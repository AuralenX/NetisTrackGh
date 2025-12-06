# NetisTrackGh — Database Schema (Firestore)

Version: 1.0.0
Last updated: 2025-12-06

Purpose

- Define Firestore collections, document shapes, validation constraints (aligned with Joi models), and recommended indexes.
- Clarify ID conventions, relationships, and recommended server-side patterns.

Storage Overview

- Primary DB: Firebase Firestore (NoSQL, document store)
- Access pattern: Server-side only (via Firebase Admin SDK in backend). Clients do NOT write directly to Firestore.
- Collections (current):
  - users
  - sites
  - fuelLogs
  - maintenanceLogs
  - securityLogs
- Collections (optional/future):
  - maintenanceSchedules (derived from schedule schema)
  - audit (for broader operational audits)
- Client-side (PWA/offline):
  - IndexedDB (local only; documented in offline.md once implemented)

ID & Timestamp Conventions

- Document IDs:
  - sites: use telecom Site ID (string 6 digits) as the document ID. Example: "600545"
  - Other collections: auto-generated IDs unless otherwise required
- Timestamps:
  - Prefer Firestore serverTimestamp() set by backend where possible for createdAt/updatedAt
  - Some Joi schemas default to Date.now (back-end set). Ensure consistency
- References:
  - Store references by IDs (e.g., userId/technicianId and siteId). Avoid storing nested full documents

Security Model

- Firestore is accessed only from backend code; validation and RBAC enforced in Express controllers/middleware
- Backend ensures role-based access and data validation prior to writing to Firestore
- Firestore Security Rules can be restrictive (server-only access) since Admin SDK bypasses rules

---

## Collection: users

Document ID: uid (string, Firebase Auth UID)

Schema (aligned with backend/src/models/userModel.js):

- uid: string (required)
- email: string (email, required)
- role: string (enum: technician|supervisor|admin, required)
- firstName: string (<=50, optional)
- lastName: string (<=50, optional)
- phoneNumber: string (<=20, optional)
- assignedSites: string[] (default [])
- isActive: boolean (default true)
- createdAt: Timestamp/Date (default now)
- updatedAt: Timestamp/Date (default now)

Indexes (suggested):

- Composite/Single:
  - role
  - isActive
  - email (unique semantics at app-level)
  - assignedSites (array-contains) if querying users by a specific site (optional use-case)

Notes:

- Role also exists as custom claims in Firebase Auth; keep role in Firestore for convenience and queryability
- Consider denormalized counts (assignedSitesCount) if needed for analytics

---

## Collection: sites

Document ID: siteId (string of 6 digits, e.g., "600545")

Schema (aligned with backend/src/models/siteModel.js):

- siteId: string(6) [pattern ^[0-9]{6}$] (required)
- name: string (1..100, required)
- location (required):
  - address: string (required)
  - coordinates (optional):
    - latitude: number [-90..90]
    - longitude: number [-180..180]
- acSystem (required):
  - capacity: number (>=0)
  - voltage: "110V"|"220V"|"240V"
  - phase: "Single"|"Three"
- dcSystem (required):
  - batteryCapacity: number (>=0)
  - solarCapacity: number (>=0, optional)
  - inverterCapacity: number (>=0)
- generator (required):
  - capacity: number (>=0)
  - fuelTankCapacity: number (>=0)
  - currentRunHours: number (>=0, default 0)
  - lastMaintenanceHours: number (>=0, default 0)
- fuel (required):
  - currentLevel: number [0..100]
  - consumptionRate: number (>=0) // L/hour
  - lastRefuelDate: Date (optional)
- maintenanceSchedule (required):
  - nextMaintenance: Date
  - maintenanceInterval: number (>=0) // hours
  - lastMaintenance: Date (optional)
- assignedTechnician: string (uid, optional)
- isActive: boolean (default true)
- createdAt: Timestamp/Date (default now)
- updatedAt: Timestamp/Date (default now)

Indexes (suggested):

- siteId (documentId) — used directly in doc reads
- name (for name-based search; consider also lowercasedName)
- assignedTechnician
- isActive
- Composite examples:
  - assignedTechnician + isActive
  - name + isActive

Notes:

- For search, consider storing normalized fields (e.g., keywords, lowercasedName)
- Soft delete: set isActive=false; avoid hard deletes where possible

---

## Collection: fuelLogs

Document ID: auto-generated

Schema (aligned with backend/src/models/fuelModel.js):

- siteId: string (required)
- technicianId: string (required) // uid
- fuelAmount: number (>=0, required)
- fuelCost: number (>=0, optional)
- currentLevel: number [0..100] (required)
- previousLevel: number [0..100] (optional)
- refuelDate: Date (default now)
- odometerReading: number (>=0, optional)
- generatorHours: number (>=0, optional)
- notes: string (<=500, optional)
- images: string[] (optional) // URLs to uploaded receipts/photos
- isVerified: boolean (default false)
- verifiedBy: string (optional) // uid
- createdAt: Timestamp/Date (recommended)
- updatedAt: Timestamp/Date (recommended)

Indexes (suggested):

- siteId
- refuelDate (for analytics time windows)
- isVerified
- Composite:
  - siteId + refuelDate (desc) for recent logs per site
  - siteId + isVerified

Notes:

- For analytics (/fuel/consumption/{siteId}), queries by siteId and time-range are expected
- Store sizes/images in cloud storage; save only URLs in Firestore

---

## Collection: maintenanceLogs

Document ID: auto-generated

Schema (aligned with backend/src/models/maintenanceModel.js):

- siteId: string (required)
- technicianId: string (required)
- maintenanceType: "routine"|"corrective"|"preventive"|"emergency" (required)
- title: string (<=100, required)
- description: string (<=1000, required)
- partsUsed: [
  { name: string(required), quantity: number(>=1), cost: number(>=0, optional), partNumber: string(optional) }
  ] (default [])
- laborHours: number (>=0, required)
- totalCost: number (>=0, optional)
- completedDate: Date (default now)
- nextMaintenanceDate: Date (optional)
- status: "scheduled"|"in-progress"|"completed"|"cancelled" (default "completed")
- priority: "low"|"medium"|"high"|"critical" (default "medium")
- images: string[] (optional)
- generatorHours: number (>=0, optional)
- notes: string (<=500, optional)
- isVerified: boolean (default false)
- verifiedBy: string (optional)
- createdAt: Timestamp/Date (recommended)
- updatedAt: Timestamp/Date (recommended)

Indexes (suggested):

- siteId
- completedDate
- status
- priority
- nextMaintenanceDate (for upcoming maintenance views)
- Composite:
  - siteId + completedDate (desc)
  - status + nextMaintenanceDate

Notes:

- Upcoming maintenance can be based on nextMaintenanceDate within maintenanceLogs or derived from a separate schedules collection
- Verification flow for supervisors/admins should be queryable by isVerified status

---

## Collection: securityLogs

Document ID: auto-generated

Schema (as used by backend controllers):

- event: string (e.g., "login_success", "login_failed", "password_reset_requested", "password_changed", "logout", "brute_force_detected")
- userId: string (uid, if available)
- email: string (optional)
- ip: string
- userAgent: string
- timestamp: Date/Timestamp (server assigned)
- metadata: object (optional) // e.g., reason, deviceId, etc.

Indexes (suggested):

- userId
- email
- event
- timestamp (for time-range queries)
- Composite:
  - userId + timestamp (desc)
  - event + timestamp

Notes:

- Consider retention policies (e.g., 90 days) and export/archive procedures

---

## Optional Collection: maintenanceSchedules (future)

Document ID: auto-generated or site-scoped

Schema (aligned with maintenanceScheduleSchema):

- siteId: string (required)
- maintenanceType: "routine"|"preventive" (required)
- title: string (<=100, required)
- description: string (<=500, required)
- scheduledDate: Date (required)
- estimatedHours: number (>=0, required)
- priority: "low"|"medium"|"high" (default "medium")
- assignedTo: string (uid, optional)
- recurrence: "once"|"weekly"|"monthly"|"quarterly"|"yearly" (default "once")
- createdAt/updatedAt: Timestamp (recommended)

Indexes (suggested):

- siteId
- scheduledDate
- assignedTo
- priority

---

## Validation Mapping to Joi

- users: backend/src/models/userModel.js
- sites: backend/src/models/siteModel.js
- fuelLogs: backend/src/models/fuelModel.js
- maintenanceLogs: backend/src/models/maintenanceModel.js
- schedules (optional): maintenanceScheduleSchema in maintenanceModel.js

Ensure backend controllers validate input against Joi before writes to Firestore.

---

## Query Patterns & Index Advice

Sites

- By siteId (doc read)
- List visible sites:
  - Technicians: assignedTechnician == uid (consider storing assignedTechnician on site doc)
  - Supervisors/Admins: list all (filter by isActive)
- Search:
  - Match by siteId or name (add lowercasedName and/or keywords array for improved search)
- Indexes:
  - assignedTechnician, isActive, name (plus composites as needed)

Fuel Logs

- Latest per site:
  - where siteId == ... orderBy refuelDate desc
- Time-range analytics:
  - where siteId == ... and refuelDate >= start and <= end
- Indexes:
  - (siteId, refuelDate desc)
  - (siteId, isVerified)

Maintenance Logs

- Latest per site:
  - where siteId == ... orderBy completedDate desc
- Upcoming:
  - where nextMaintenanceDate >= now orderBy nextMaintenanceDate asc
- Indexes:
  - (siteId, completedDate desc)
  - (status, nextMaintenanceDate)

Security Logs

- Per user:
  - where userId == ... orderBy timestamp desc
- By event/time:
  - where event == ... and timestamp >= ...
- Indexes:
  - (userId, timestamp desc)
  - (event, timestamp)

---

## Data Quality & Migration Notes

- Normalize siteId to 6-digit strings and enforce uniqueness at the application layer
- For name-based search, store a normalized lowercasedName
- Consider backfilling createdAt/updatedAt with server timestamps on all collections
- For heavy analytics, denormalize key aggregates (optional), or export to BigQuery
- Keep images as URLs (Cloud Storage); avoid storing large blobs in Firestore

---

## Backups & Exports

- Scheduled exports (e.g., to Cloud Storage) for compliance/recovery
- Versioned exports, with retention policy aligned to organization requirements
- Document full recovery steps in deployment.md and security.md (runbook section)

References

- Joi Models: backend/src/models/\*.js
- Controllers (write patterns): backend/src/controllers/\*
- Requirements: ../requirements.md
- Security: ../security.md
- Architecture: ../architecture.md
