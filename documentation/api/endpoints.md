# NetisTrackGh — API Endpoints Reference

Version: 1.0.0
Last updated: 2025-12-06

Overview

- RESTful API powered by Node.js/Express with Firebase Auth + Firestore
- Swagger UI is available for live, interactive docs at: /docs (e.g., http://localhost:3000/docs)
- This document summarizes stable endpoints by domain with roles, request/response examples, and curl snippets

Base URL

- Development: http://localhost:3000
- All endpoints below are prefixed with /api unless otherwise noted

Auth & Headers

- Authentication for protected routes uses Firebase-issued idToken:
  - Authorization: Bearer <idToken>
- Optional headers used by frontend:
  - X-Client-Version: 2.0.0
  - X-User-Role: technician|supervisor|admin

Error Model (generic)

- 4xx/5xx responses typically return:
  - { "error": "message", "code": "MACHINE_READABLE_CODE", "details": [...]? }

Health & Status (Public)

- GET /health → 200 OK, service heartbeat with memory/uptime
- GET /api/status → 200 OK, service metadata, uptime, memory, routes listing
- Swagger: GET /docs (restrict in production as needed)

---

## Authentication (/api/auth)

1. POST /api/auth/verify

- Purpose: Verify credentials via Firebase REST; returns idToken, refreshToken, user profile
- Auth: Public
- Body:
  {
  "email": "technician@netistrackgh.com",
  "password": "userpassword123"
  }
- 200 Response:
  {
  "message": "Login successful",
  "user": {
  "uid": "string",
  "email": "technician@netistrackgh.com",
  "role": "technician",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string",
  "assignedSites": [],
  "isActive": true
  },
  "token": "idToken",
  "refreshToken": "refresh",
  "expiresIn": "3600"
  }
- Errors: 400 INVALID_EMAIL/MISSING_CREDENTIALS, 401 INVALID_CREDENTIALS, 503 SERVICE_UNAVAILABLE

curl:
curl -sS -X POST http://localhost:3000/api/auth/verify \
 -H "Content-Type: application/json" \
 -d '{"email":"technician@netistrackgh.com","password":"userpassword123"}'

2. POST /api/auth/refresh

- Purpose: Exchange refreshToken for new idToken
- Auth: Public
- Body:
  { "refreshToken": "string" }
- 200 Response:
  {
  "message": "Token refreshed successfully",
  "token": "newIdToken",
  "refreshToken": "newRefreshToken",
  "expiresIn": "3600",
  "user": {
  "uid": "string",
  "email": "string",
  "role": "technician",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string",
  "assignedSites": []
  }
  }
- Errors: 400 validation, 401 INVALID_REFRESH_TOKEN

3. GET /api/auth/profile

- Purpose: Get current authenticated user profile; creates default if missing
- Auth: Bearer token
- 200 Response: { "user": { ... } }
- Errors: 401

4. PUT /api/auth/profile

- Purpose: Update user profile fields (validated)
- Auth: Bearer token
- Body: Partial profile fields per validation rules
- 200 Response: { "message": "Profile updated successfully", "user": { ... } }
- Errors: 400 validation, 401

5. GET /api/auth/users

- Purpose: List all users (Admin only)
- Auth: Bearer token + role admin
- 200 Response: { "users": [ ... ], "total": N }
- Errors: 401/403

6. POST /api/auth/assign-role

- Purpose: Assign role to a user (Admin only)
- Auth: Bearer token + role admin
- Body: { "userId": "uid", "role": "technician|supervisor|admin" }
- 200: { "message": "Role assigned successfully", "userId": "...", "role": "..." }
- Errors: 400 invalid role, 401/403

7. POST /api/auth/reset-password

- Purpose: Send password reset email (generic success)
- Auth: Public
- Body: { "email": "user@example.com" }
- 200: { "message": "RESET_EMAIL_SENT", "code": "RESET_EMAIL_SENT" }

8. POST /api/auth/change-password

- Purpose: Change password for authenticated user
- Auth: Bearer token
- Body: { "currentPassword": "old", "newPassword": "new" }
- 200: { "message": "Password changed successfully", "code": "PASSWORD_CHANGED" }
- Errors: 400 invalid, 401 invalid current password or unauthenticated

9. POST /api/auth/logout

- Purpose: Log security event for logout (JWT is stateless)
- Auth: Bearer token
- Body: { "reason": "user_initiated", "deviceId": "optional" }
- 200: { "message": "Logout successful", "code": "LOGOUT_SUCCESS" }

10. POST /api/auth/security-logs

- Purpose: Log a custom security event from frontend
- Auth: Bearer token
- Body: { "event": "string", ... }
- 201: { "message": "Security event logged successfully", "timestamp": "..." }

11. GET /api/auth/security-logs

- Purpose: Get security logs (User: own logs, Admin: all)
- Auth: Bearer token
- Query: limit, offset, startDate, endDate
- 200: { "logs": [ ... ], "total": N, "limit": N, "offset": N }

---

## Sites (/api/sites)

1. GET /api/sites

- Purpose: List sites visible to the user (technicians: assigned; supervisors/admins: all)
- Auth: Bearer token
- Query: search (optional)
- 200: { "sites": [ ... ] }

2. GET /api/sites/search?query=...

- Purpose: Search by siteId or name
- Auth: Bearer token
- 200: { "sites": [ ... ], "total": N, "query": "..." }
- 400: invalid query

3. GET /api/sites/{siteId}

- Purpose: Get site details
- Auth: Bearer token
- 200: { "site": { ... } }
- Errors: 401/403/404

4. POST /api/sites

- Purpose: Create a new site (manual 6-digit siteId)
- Auth: Bearer token, Roles: technician|supervisor|admin
- Body: must satisfy Joi schema (see database/schema.md)
- 201: { "message": "Site created successfully", "siteId": "600545", "data": { ... } }
- Errors: 400/401/403/409

5. PUT /api/sites/{siteId}

- Purpose: Update site
- Auth: Bearer token, Roles: technician|supervisor|admin
- Body: partial fields per update schema
- 200: { "message": "Site updated successfully" }
- Errors: 400/401/403/404

6. DELETE /api/sites/{siteId}

- Purpose: Soft delete (Admin only)
- Auth: Bearer token, Role: admin
- 200: { "message": "Site deleted successfully" }
- Errors: 401/403/404

curl:
curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/sites

---

## Fuel (/api/fuel)

1. POST /api/fuel

- Purpose: Create fuel log
- Auth: Bearer token
- Body: validated payload (see model)
- 201: { "message": "Fuel log created", "logId": "...", "data": { ... } }
- Errors: 400/401

2. GET /api/fuel/site/{siteId}

- Purpose: Get fuel logs for a site
- Auth: Bearer token
- 200: { "logs": [ ... ] }

3. GET /api/fuel/consumption/{siteId}

- Purpose: Fuel consumption analytics
- Auth: Bearer token
- 200: { "consumption": { ... } }

4. POST /api/fuel/verify/{logId}

- Purpose: Verify fuel log (Supervisor/Admin)
- Auth: Bearer token, Roles: supervisor|admin
- 200: { "message": "Fuel log verified" }
- Errors: 403/404

---

## Maintenance (/api/maintenance)

1. POST /api/maintenance

- Purpose: Create maintenance log
- Auth: Bearer token
- 201: { "message": "Maintenance log created", "logId": "...", "data": { ... } }
- Errors: 400/401

2. GET /api/maintenance/site/{siteId}

- Purpose: List maintenance logs for a site
- Auth: Bearer token
- 200: { "logs": [ ... ] }

3. GET /api/maintenance/upcoming

- Purpose: Upcoming maintenance schedules
- Auth: Bearer token
- 200: { "upcoming": [ ... ] }

4. GET /api/maintenance/analytics/{siteId}

- Purpose: Maintenance analytics for a site
- Auth: Bearer token
- 200: { "analytics": { ... } }

5. POST /api/maintenance/verify/{logId}

- Purpose: Verify maintenance log (Supervisor/Admin)
- Auth: Bearer token, Roles: supervisor|admin
- 200: { "message": "Maintenance log verified" }
- Errors: 403/404

---

## Sync (/api/sync)

1. POST /api/sync

- Purpose: Process offline sync queue
- Auth: Bearer token
- Body: queued operations (client-side design)
- 200: { "message": "Sync processed", "results": [ ... ] }
- Errors: 400 invalid queue

2. GET /api/sync/status

- Purpose: Get sync status
- Auth: Bearer token
- 200: { "status": "ok", ... }

3. POST /api/sync/conflicts

- Purpose: Resolve reported conflicts
- Auth: Bearer token
- Body: conflict resolution metadata
- 200: { "message": "Conflicts resolved", ... }

---

## Common Considerations

Validation

- Joi schemas enforce constraints (e.g., siteId is 6-digit)
- Validation errors return 400 with details array

Auth & RBAC

- verifyToken: checks idToken validity
- requireRole: enforces route-level roles (technician|supervisor|admin)

Rate Limiting

- Production defaults (configurable via env):
  - window: 15 minutes
  - max: 100 requests
- Returns 429 with error and code RATE_LIMIT_EXCEEDED

CORS

- Development: permissive default
- Production: configure allowlist and methods/headers appropriately

Error Codes (examples)

- 400: VALIDATION_ERROR
- 401: UNAUTHENTICATED / INVALID_CREDENTIALS
- 403: FORBIDDEN / INVALID_ROLE
- 404: NOT_FOUND
- 409: CONFLICT
- 429: RATE_LIMIT_EXCEEDED
- 500/503: SERVER_ERROR / SERVICE_UNAVAILABLE

References

- Live Docs (Swagger): /docs
- Requirements: ../requirements.md
- Security: ../security.md
- Data Model: ../database/schema.md
