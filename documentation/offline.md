# NetisTrackGh — Offline & Sync Strategy

Version: 1.0.0
Last updated: 2025-12-06

Purpose

- Define the offline-first architecture for the PWA, including IndexedDB schema, sync queue design, Service Worker caching strategies, conflict resolution policies, and resilience patterns.
- Align with current code scaffolding (frontend/public/src/offline/\*), to be implemented.

Current Status

- Manifest configured; Service Worker not yet created/registered.
- Offline scaffolding files exist but need implementation:
  - src/offline/indexeddb.js
  - src/offline/offlineManager.js
  - src/offline/syncQueue.js

Goals

- Allow technicians to capture site, fuel, and maintenance logs offline.
- Queue mutations when offline and replay them when back online.
- Cache essential GET data for read-only viewing while offline.
- Provide clear UI feedback on network status and sync progress.
- Offer conflict detection and resolution rules.

Architecture Overview

- Client-side storage: IndexedDB
- Mutation queue: syncQueue (IndexedDB)
- Read caching: cached GET responses for critical views
- Background sync: replay queued requests to backend when connectivity returns
- SW scope: Cache static assets + runtime API GETs
- API model: All writes go through backend (no direct Firestore writes from client)

Network Detection & State

- Detect via window.navigator.onLine and "online"/"offline" events
- For stability, complement with periodic HEAD/GET to /health or /api/status
- UI should render a small status banner/badge when offline

IndexedDB Schema (Proposed)
Database: netistrackgh-db (version 1)

Object stores:

1. syncQueue

- keyPath: id (string, UUID)
- indexes: ["route", "method", "status", "createdAt"]
- Data shape:
  - id: string
  - route: string (e.g., "/api/fuel")
  - method: "POST"|"PUT"|"DELETE"
  - payload: object (request body)
  - headers: object (minimal set, e.g., Authorization)
  - retries: number (default 0)
  - maxRetries: number (default 5)
  - status: "pending"|"processing"|"failed"|"completed"
  - createdAt: number (timestamp)
  - lastAttemptAt: number (timestamp|null)
  - metadata:
    - entityType: "site"|"fuelLog"|"maintenanceLog"
    - entityId: string|null
    - lastKnownVersion: number|timestamp|null

2. cache.sites

- keyPath: siteId (string)
- Data: last fetched site doc (from GET /api/sites or GET /api/sites/{siteId})
- metadata: updatedAt

3. cache.siteDetails

- keyPath: siteId (string)
- Data: detailed site page data (denormalized for fast offline read)
- metadata: updatedAt

4. cache.fuelLogs

- keyPath: id (string)
- index: ["siteId", "timestamp"]
- Data: logs from GET /api/fuel/site/{siteId}
- metadata: siteId, updatedAt

5. cache.maintenanceLogs

- keyPath: id (string)
- index: ["siteId", "timestamp"]
- Data: logs from GET /api/maintenance/site/{siteId}
- metadata: siteId, updatedAt

Queueing Strategy (Writes)

- On submit (POST/PUT/DELETE), if online:
  - Try network first. On failure (network), enqueue and show offline-confirmation.
- If offline:
  - Enqueue immediately with payload and minimal headers (Authorization if available).
  - Mark UI as "Queued for sync".
- Add idempotency metadata when possible (e.g., client-generated temp IDs).

Replay Strategy

- Trigger replay when:
  - "online" event fires, or
  - Manual user action "Sync Now", or
  - Periodic timer (e.g., every 60s while has pending queue)
- Replay rules:
  - Process FIFO by createdAt; set status "processing".
  - Send request to backend; include Authorization header if available.
  - On 2xx: set status "completed" and remove from queue (or archive if needed).
  - On 4xx non-retryable (e.g., 400 validation): set status "failed" and keep for user action.
  - On 401:
    - Attempt token refresh; retry once.
  - On 429/5xx:
    - Exponential backoff; increment retries and reschedule.
  - Abort after maxRetries; mark as "failed" for manual intervention.

Exponential Backoff

- Initial delay: 2s → 4s → 8s → 16s → 32s (cap at 60s)
- Jitter: randomize +/- 20% to avoid thundering herd

Conflict Detection & Resolution

- Each queued mutation can include lastKnownVersion or lastUpdatedAt
- Server compares with current record version/timestamp:
  - If no conflict: apply and return updated record
  - If conflict:
    - Server returns conflict response with details:
      - current server value
      - client submitted value
      - conflict fields
    - Client puts item into "conflict" state in queue and displays resolution UI
- Resolution policies:
  - Last-write-wins (simple, not always correct)
  - Field-level merge where safe (additive arrays)
  - Supervisor/Admin verification might be required to resolve certain conflicts (recommended)
- UX:
  - Show conflict modal with choices:
    - Keep server
    - Keep client
    - Merge/manual edit
  - On resolution, enqueue a new corrected mutation

Service Worker (SW) Strategy

- File: public/sw.js (to be created)
- Registration: in app.js after PWA is ready
- Cache strategies:
  - Precache app shell (index.html, CSS, critical JS, icons)
  - Runtime caching for API GETs:
    - Strategy: stale-while-revalidate for /api/sites, /api/fuel/site/:id, /api/maintenance/site/:id
    - Cache key: URL with query params
    - TTL: consider a short TTL or manual invalidation on successful writes
- Offline fallback:
  - If GET fails when offline:
    - Serve cached response if available (from caches API or IndexedDB)
    - Else fallback UI (friendly offline page with limited actions)
- Background sync (optional enhancement):
  - Use Background Sync API to schedule queue replay when connectivity returns (where supported)
  - Fallback to "online" event + timer-based retries

Data Freshness and Invalidation

- After successful mutation affecting a given site:
  - Invalidate (or refresh) cache entries:
    - cache.sites entry for that site
    - cache.fuelLogs or cache.maintenanceLogs lists
  - Optionally re-fetch fresh data in the background
- Maintain updatedAt timestamps to detect staleness

Security Considerations

- Do not store secrets in IndexedDB. Store only necessary data payloads.
- Authorization token:
  - Prefer short-lived tokens; renew before replay.
  - Store only what is needed to replay requests.
- PII:
  - Keep sensitive data minimal in the cache and queue.
  - Consider hashing device identifiers and redacting logs.

UX Guidelines

- Visual indicator for offline/online state in the navbar or status bar
- Offline queue badge count (e.g., "3 to sync")
- "Sync Now" button to force replay attempts
- Toasts on sync successes/failures
- Clear messaging for conflicts and failed items with "Resolve" action

Error Handling

- Network failures:
  - Automatic enqueue when request fails and network is offline/unstable
- 401 unauthorized:
  - Try token refresh; if still failing, show "Session expired" and redirect to login
- 429 rate-limited:
  - Backoff and retry later; inform user if manual sync was initiated
- 4xx validation:
  - Present errors; allow edit and requeue or discard
- SW install/activate errors:
  - Log gracefully; allow app to function without offline caching

Minimal Pseudocode (Concept)

enqueueMutation(route, method, payload, meta) {
const item = {
id: uuid(),
route, method, payload,
headers: { Authorization: "Bearer " + getToken() },
status: "pending",
retries: 0,
maxRetries: 5,
createdAt: Date.now(),
lastAttemptAt: null,
metadata: meta
};
db.syncQueue.add(item);
notify("Queued for sync");
}

async function replayQueue() {
const pending = await db.syncQueue.where("status").equals("pending").sortBy("createdAt");
for (const item of pending) {
try {
await db.syncQueue.update(item.id, { status: "processing", lastAttemptAt: Date.now() });
const res = await fetch(baseUrl + item.route, {
method: item.method,
headers: item.headers,
body: item.method === "GET" ? undefined : JSON.stringify(item.payload)
});

      if (res.status === 401) {
        await refreshToken();
        item.headers.Authorization = "Bearer " + getToken();
        // retry once after refresh
        continue;
      }

      if (res.ok) {
        await db.syncQueue.delete(item.id);
        invalidateCaches(item.metadata);
        continue;
      }

      if (res.status === 409) {
        // conflict
        await db.syncQueue.update(item.id, { status: "failed", error: "conflict", serverData: await res.json() });
        showConflictUI(item);
        continue;
      }

      if ([429, 500, 503].includes(res.status)) {
        await backoff(item);
        continue;
      }

      // other 4xx: validation or forbidden
      await db.syncQueue.update(item.id, { status: "failed", error: await res.text() });

    } catch (e) {
      // network or unexpected error
      await backoff(item);
    }

}
}

Implementation Steps (Suggested)

1. IndexedDB Utility (indexeddb.js)

- Create/open DB
- Define object stores and indexes
- Provide CRUD helpers

2. Offline Manager (offlineManager.js)

- Listen for online/offline events
- Expose isOnline()
- Trigger replayQueue() on "online"

3. Sync Queue (syncQueue.js)

- enqueue, dequeue, update status
- backoff logic with retries and jitter
- hooks for conflict handling

4. Service Worker (sw.js)

- Precache app shell
- Runtime caching for GET /api/... with stale-while-revalidate
- Background sync (where available)
- Fallback routes

5. UI Integration

- Show offline badge, queue count
- Buttons: "Sync Now", "View Queue", "Resolve Conflicts"
- Error toasts and conflict modal

Validation and Testing

- Unit: queue operations, backoff
- Integration: enqueue offline → replay online, token refresh path
- Manual: airplane mode testing
- PWA audits: Lighthouse (offline ready, SW registered)
- Negative: conflict scenarios, 429 backoff, invalid payloads

References

- Requirements: requirements.md
- Architecture: architecture.md
- Security: security.md
- Testing: testing.md
- API endpoints: api/endpoints.md
