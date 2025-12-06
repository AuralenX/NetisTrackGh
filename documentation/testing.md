# NetisTrackGh — Testing Strategy (Thorough Coverage)

Version: 1.0.0
Last updated: 2025-12-06
Coverage level: Thorough testing (happy paths, error paths, edge cases, security/RBAC, rate limiting, negative scenarios, PWA/offline flows)

Purpose

- Define a comprehensive, multi-layer test approach for backend (API), frontend (SPA/PWA), security, and offline/sync behavior.
- Provide runnable commands, scenarios, and checklists to validate reliability and regressions.

Test Scope

- Backend API (Express + Firebase + Firestore)
- Frontend SPA (Vanilla JS, hash routing)
- Security (AuthN/Z, rate limiting, CORS, headers)
- PWA & Offline (IndexedDB, Service Worker once implemented)
- Performance smoke checks

Environments

- Local development (primary)
- Optional staging mirroring production settings
- Production smoke (limited)

Tooling

- Backend: Jest + Supertest
- API exploration: curl/Postman
- Frontend Manual: Browser (Chrome/Firefox)
- Optional E2E: Playwright/Puppeteer (future)
- Linting/Security: npm audit, dependency review

Test Data and Fixtures

- Create Firebase test users:
  - technician@test.com
  - supervisor@test.com
  - admin@test.com
- Assign custom claims or set role in Firestore users collection
- Seed Firestore documents for: sites, fuelLogs, maintenanceLogs where needed
- Cleanup scripts (optional) in backend/scripts/

How to Run (Backend)

- cd backend
- npm test

Optional: API Smoke via curl (examples)

- Health:
  - curl -i http://localhost:3000/health
- Status:
  - curl -i http://localhost:3000/api/status
- Swagger (manual):
  - http://localhost:3000/docs

Backend Test Matrix (API)

Auth (/api/auth)

- POST /auth/verify
  - 200: valid email/password returns token, refreshToken, user profile
  - 400: missing fields; invalid email format
  - 401: wrong password or unknown email
  - 503: upstream Firebase unavailable (simulate network error)
- POST /auth/refresh
  - 200: valid refresh returns new idToken
  - 400: missing refreshToken
  - 401: invalid/expired refreshToken
- POST /auth/reset-password
  - 200: generic success for existing and non-existing emails
  - 400: invalid payload
- POST /auth/change-password (requires auth)
  - 200: valid currentPassword → password updated
  - 401: unauthenticated (missing/invalid JWT)
  - 401: invalid current password
  - 400: invalid payload (weak password)
- GET /auth/profile (requires auth)
  - 200: returns profile; creates if missing
  - 401: invalid/expired JWT
- PUT /auth/profile (requires auth)
  - 200: update allowed fields
  - 400: Joi validation fails
  - 401: invalid token
- POST /auth/logout (requires auth)
  - 200: logs event; stateless JWT (no real revocation)
- POST /auth/security-logs (requires auth)
  - 201: logs security event with metadata
  - 400: invalid payload
  - 401: invalid token

Sites (/api/sites)

- GET /sites (requires auth)
  - 200: technician sees assigned sites; supervisor/admin see all
  - 401: no/invalid token
- GET /sites/search?query=
  - 200: valid search by siteId/name
  - 400: missing/invalid query
- GET /sites/{siteId}
  - 200: returns site details
  - 404: unknown siteId
- POST /sites (requires role: technician/supervisor/admin)
  - 201: valid site with 6-digit siteId
  - 400: Joi validation errors (wrong siteId format, missing required fields)
  - 403: insufficient role
  - 409: duplicate siteId
- PUT /sites/{siteId} (requires role: technician/supervisor/admin; tech limited to own sites if enforced)
  - 200: updates fields
  - 400: Joi validation errors
  - 403: insufficient role or not assigned
  - 404: unknown site
- DELETE /sites/{siteId} (requires role: admin)
  - 200: soft delete (isActive=false)
  - 403: non-admin tries
  - 404: unknown

Fuel (/api/fuel)

- POST /fuel
  - 201: create log with valid payload
  - 400: invalid payload
  - 401: invalid token
- GET /fuel/site/{siteId}
  - 200: list logs
  - 404: site unknown (if applicable)
- GET /fuel/consumption/{siteId}
  - 200: returns analytics
  - 404: site unknown
- POST /fuel/verify/{logId} (supervisor/admin)
  - 200: mark as verified
  - 403: insufficient role
  - 404: unknown log

Maintenance (/api/maintenance)

- POST /maintenance
  - 201: create log with required fields
  - 400: invalid
- GET /maintenance/site/{siteId}
  - 200: list logs
- GET /maintenance/upcoming
  - 200: upcoming schedule per site
- GET /maintenance/analytics/{siteId}
  - 200: maintenance analytics
- POST /maintenance/verify/{logId} (supervisor/admin)
  - 200: verified
  - 403: insufficient role

Sync (/api/sync)

- POST /sync
  - 200: processes queued ops
  - 400: invalid queue format
- GET /sync/status
  - 200: status OK
- POST /sync/conflicts
  - 200: resolves simulated conflict
  - 400: invalid payload

Security and Middleware

- JWT verification
  - 401: missing, malformed, or expired token
- RBAC (requireRole)
  - 403: role insufficient
- Rate Limiting
  - 429 after threshold; verify window resets
- CORS
  - Valid origin allowed; disallowed origin blocked (prod settings)
- Helmet headers
  - Ensure CSP and security headers in responses

Backend Supertest Skeleton (Example)
/\*
const request = require('supertest');
const app = require('../server');

describe('Auth API', () => {
it('login success returns token & profile', async () => {
const res = await request(app)
.post('/api/auth/verify')
.send({ email: 'technician@test.com', password: 'validpass' });
expect(res.statusCode).toBe(200);
expect(res.body.token).toBeDefined();
expect(res.body.user.role).toBeDefined();
});

it('invalid email format returns 400', async () => {
const res = await request(app)
.post('/api/auth/verify')
.send({ email: 'bad', password: 'x' });
expect(res.statusCode).toBe(400);
});
});
\*/

Frontend Testing

Manual Critical Flows (Thorough Verification)

- Auth
  - Load index.html → #login
  - Valid login (technician, supervisor, admin) → redirected to dashboard/analytics
  - Invalid login shows error (invalid credentials)
  - Password reset flow triggers backend call
  - Inactivity modal after 30 minutes; actions respected
- Navigation
  - Hash routes: #dashboard, #analytics, #sites, #fuel, #maintenance, #reports, #profile, #settings, #help, #about, #site-details
  - Ensure re-render without stale handlers
- Role-based UI
  - Technician: no admin actions, only assigned sites visible
  - Supervisor/Admin: verification actions present
- Forms and Validation
  - Sites create/update: correct constraints (6-digit siteId)
  - Fuel/Maintenance modals: required fields and feedback
  - Error display for 400/401/403/404/409/429/5xx
- Security UX
  - Token expiry auto-refresh works
  - Logout clears state
- Performance UX
  - Loading states and transitions work smoothly

Optional E2E (future)

- Playwright scripts: login, create site (technician), verify log (supervisor), admin role updates

PWA & Offline Testing (when implemented)

- Service Worker
  - Registers on load (localhost or HTTPS)
  - Caches static assets; offline reload shows cached UI
- IndexedDB Sync Queue
  - Offline mode: create fuel/maintenance/site entries → queued
  - Reconnect: background sync sends queue → backend /api/sync
  - Conflict resolution: server responds; UI displays resolution result
- Failure modes
  - Network loss during submit shows retry
  - Idempotency or de-duplication as needed

Performance Smoke (Light)

- Health and status endpoints respond < 200ms locally
- Sites list and search within reasonable time
- Watch for large payloads; verify request size limits

Test Reporting and Coverage

- Jest coverage:
  - cd backend && npm test -- --coverage
- Target coverage:
  - Lines/Branches/Functions: 70%+ initially; higher as project matures
- Manual checklists stored in /documentation/testing.md; export to issue templates if needed

Regression Checklist (Before Release)

- Auth flows for all roles (login, refresh, logout)
- Core CRUD (sites/fuel/maintenance) happy + error paths
- RBAC checks on all sensitive endpoints
- Rate limiting behaves correctly
- CORS works for intended origins only (prod)
- Frontend navigation & forms work; error messages visible
- PWA basics (when implemented): SW registration and offline view

CI/CD Integration (Suggested)

- GitHub Actions:
  - Node setup, npm ci
  - Run tests with coverage
  - Lint/audit
  - Optionally spin up local Firestore emulator for isolated tests (future)
- Badge coverage and report artifacts

Known Gaps and Future Tests

- E2E automation with Playwright
- Offline conflict resolution edge cases
- Load testing (k6/Artillery) for critical endpoints
- Firestore emulator integration for deterministic tests

References

- API Docs: /docs (Swagger)
- Requirements: requirements.md
- Architecture: architecture.md
- Security: security.md
- Offline Plan: offline.md
