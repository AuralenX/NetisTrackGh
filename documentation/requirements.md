# NetisTrackGh Requirements and Use Cases

Version: 1.0.0
Last updated: 2025-12-06

Overview

- NetisTrackGh is a telecom site monitoring and management system focused on generator sites, fuel tracking, and maintenance scheduling with role-based access.
- Architecture: PWA (Vanilla JS SPA) + Node/Express backend + Firebase Firestore + Firebase Auth (REST) + JWT.
- Key features: Sites management, fuel logs, maintenance logs & schedules, role-based dashboards, offline-first design (planned), security logging.

Goals

- Provide a reliable, field-usable system to capture and sync operational data (fuel, maintenance).
- Support role-appropriate workflows for technicians, supervisors, and admins.
- Enable analytics, verification, and auditability of activities.
- Provide resilient offline-first behaviors for poor connectivity.

Scope

- In-scope:
  - Authentication & authorization (Firebase REST + JWT and RBAC)
  - Site CRUD with extended telecom attributes (AC/DC systems, generator, fuel, maintenance schedule)
  - Fuel logging, maintenance logging, and verification flows
  - Role dashboards and basic analytics
  - Offline capture (design in place, implementation in progress)
  - API documentation via Swagger and markdown
- Out-of-scope (initial phase):
  - Real-time telemetry ingestion (IoT integration)
  - Automated dispatch or workforce management
  - Payments/billing integration

Personas and Roles

- Technician
  - Field operator assigned to specific sites
  - Tasks: View assigned sites, create fuel/maintenance logs, view own reports, update own profile
- Supervisor
  - Oversees multiple technicians and sites
  - Tasks: View all sites, verify logs, view analytics, manage technicians, generate reports
- Admin
  - System-wide configuration and access
  - Tasks: Full access, manage users/roles, site management, audit & system settings
- Stakeholders
  - Operations managers, compliance/audit teams, IT administrators

Use Cases (by Role)

- Technician
  - View assigned sites and details (site specs, location, generator/fuel/maintenance info)
  - Log fuel activities: refuel, consumption notes, tank levels
  - Log maintenance activities: routine services, repairs, parts replaced
  - View own logs and report summaries
  - Update own profile details
- Supervisor
  - View all sites with search/filter by siteId/name
  - Verify fuel and maintenance logs
  - View analytics: consumption rates, maintenance schedules due, exceptions
  - Manage technician assignments to sites
  - Export reports (CSV/JSON) [planned]
- Admin
  - Manage users, assign roles, deactivate accounts
  - Manage sites: create/update/delete (soft delete), enforce data quality
  - Configure system settings (rate limits, auth, CORS) [backend ops]
  - Review audit logs/security events

Functional Requirements (FR)

- Authentication and Authorization
  - FR-AUTH-1: Login via POST /api/auth/verify with email and password
  - FR-AUTH-2: Refresh token via POST /api/auth/refresh
  - FR-AUTH-3: Password reset via POST /api/auth/reset-password and change via POST /api/auth/change-password
  - FR-AUTH-4: Logout tracking via POST /api/auth/logout and security logs endpoints
  - FR-AUTH-5: Access protected endpoints with JWT; enforce RBAC
  - FR-AUTH-6: Get/update user profile via GET/PUT /api/auth/profile
- Sites
  - FR-SITE-1: List sites scoped to role via GET /api/sites
  - FR-SITE-2: Search sites via GET /api/sites/search?query=
  - FR-SITE-3: Get site details via GET /api/sites/{siteId}
  - FR-SITE-4: Create site via POST /api/sites (requires valid schema, 6-digit siteId)
  - FR-SITE-5: Update site via PUT /api/sites/{siteId}
  - FR-SITE-6: Delete (soft) site via DELETE /api/sites/{siteId} (Admin only)
- Fuel
  - FR-FUEL-1: Create fuel log via POST /api/fuel
  - FR-FUEL-2: Get site fuel logs via GET /api/fuel/site/{siteId}
  - FR-FUEL-3: Fuel consumption analytics via GET /api/fuel/consumption/{siteId}
  - FR-FUEL-4: Verify fuel log via POST /api/fuel/verify/{logId} (Supervisor/Admin)
- Maintenance
  - FR-MAINT-1: Create maintenance log via POST /api/maintenance
  - FR-MAINT-2: Get site maintenance logs via GET /api/maintenance/site/{siteId}
  - FR-MAINT-3: Upcoming maintenance via GET /api/maintenance/upcoming
  - FR-MAINT-4: Maintenance analytics via GET /api/maintenance/analytics/{siteId}
  - FR-MAINT-5: Verify maintenance log via POST /api/maintenance/verify/{logId} (Supervisor/Admin)
- Sync (Offline)
  - FR-SYNC-1: Process offline queue via POST /api/sync
  - FR-SYNC-2: Get sync status via GET /api/sync/status
  - FR-SYNC-3: Resolve sync conflicts via POST /api/sync/conflicts
- UI/UX
  - FR-UI-1: SPA navigation with routes: login, dashboard, analytics, sites, fuel, maintenance, reports, profile, settings, help, about, site-details
  - FR-UI-2: Reusable modals for adding logs and selecting sites
  - FR-UI-3: Responsive layout for mobile PWA
- Offline-first (planned/partial)
  - FR-OFF-1: Capture logs offline into IndexedDB
  - FR-OFF-2: Queue requests when offline and retry on reconnect
  - FR-OFF-3: Background sync via service worker (when available)
  - FR-OFF-4: Conflict detection and resolution strategy

API Requirements

- All protected endpoints require Authorization: Bearer <token>.
- Swagger documentation available at /docs.
- Consistent HTTP status codes and structured error responses.
- Rate limiting:
  - Production stricter defaults (e.g., 100 req/15min) with 429 handling.
- CORS configured for allowed methods and headers.
- Content types: application/json for request/response payloads.
- Security logging for sensitive events (login, password reset, changes).

Data Requirements

- Primary persistence in Firebase Firestore
  - Collections: users, sites, fuelLogs, maintenanceLogs, securityLogs
- Client-side offline store (IndexedDB) for PWA (design in progress)
- Site schema constraints (based on backend validation):
  - 6-digit siteId
  - AC/DC system details, generator, fuel, maintenance schedule fields
  - Coordinates latitude: [-90, 90], longitude: [-180, 180]
  - isActive default true
- Standard timestamps: createdAt, updatedAt
- Soft deletion via isActive flag or archival strategy

Non-Functional Requirements (NFR)

- Security
  - JWT-based authorization with Firebase REST auth integration
  - Helmet CSP and security headers
  - Rate limiting and CORS restrictions
  - Secure storage practices (avoid storing sensitive tokens in insecure contexts)
  - Security/audit logging of critical events
- Performance
  - API P95 response time: under 500ms for typical requests (excluding heavy analytics)
  - Frontend initial load size optimized, code-splitting by route
  - Cached static assets (via service worker once implemented)
- Reliability and Availability
  - Backend health endpoints: /health and /api/status
  - Graceful shutdown handling on SIGTERM/SIGINT
  - Error handling middleware for consistent responses
- Maintainability
  - Modular code organization (controllers, routes, models, middleware, utils)
  - Joi validation for inputs
  - Swagger for discoverability and integration
  - Documentation in markdown + Swagger UI
- Observability
  - Centralized logging (Winston)
  - Request duration displayed in Swagger UI
  - Memory/uptime stats via /api/status
- Compliance and Privacy
  - Personally identifiable information minimized
  - Audit logging enabled for security events
  - Data retention policies to be defined (organization-specific)

Success Metrics (KPIs)

- Data capture success rate in the field (>= 99% with eventual consistency via offline sync)
- Reduction in unverified logs (e.g., < 5% pending after 48h)
- Fuel consumption variance within expected range (analytics correctness)
- Maintenance schedule adherence and overdue rate
- System uptime and error rate (500s)
- Latency metrics (P95 API latency)

Assumptions

- Users have modern mobile devices capable of running a PWA
- Supervisors/Admins operate with stable connectivity; technicians may operate offline
- Firebase project configured with correct API key and Auth settings
- Backend environment variables configured per environment

Constraints

- Offline functionality depends on IndexedDB and service worker support
- Network conditions vary widely; must degrade gracefully
- Firestore quotas and pricing considerations
- Security posture governed by organization policies for tokens and data handling

User Stories (Selected)

- As a Technician, I can log fuel usage while offline, so that I don't lose data in low connectivity.
- As a Supervisor, I can verify logs and see analytics to detect anomalies.
- As an Admin, I can manage users and assign roles to ensure appropriate access.
- As a Technician, I can quickly search or scan a site to open its details. [future: QR/barcode]
- As a Supervisor, I can export reports for compliance. [planned]

Acceptance Criteria (Examples)

- Login returns token, refresh token, expiry, and user profile (role, assignedSites)
- Sites listing respects RBAC: technicians see assigned sites; others see all (within policy)
- Creating a site enforces schema validation (6-digit siteId and required fields)
- Fuel and maintenance logs validate required fields and support verification state
- API returns meaningful error codes/messages (400/401/403/404/409/429/500)
- Swagger UI documents all endpoints and supports live testing
- Offline queue persists across reloads and syncs on reconnect (once implemented)

Error Handling and Codes (Examples)

- 400: Validation failed (Joi details included)
- 401: Invalid credentials or unauthenticated
- 403: Forbidden by role
- 404: Resource not found (siteId/logId)
- 409: Conflict (duplicate siteId)
- 429: Rate limit exceeded
- 500/503: Server/service unavailable

Risks and Mitigations

- Unstable connectivity in the field
  - Mitigation: Offline-first design with robust retry and conflict resolution
- Token expiration mid-session
  - Mitigation: Auto-refresh with expiry buffer and session monitor
- Data inconsistencies between client offline queue and server
  - Mitigation: Conflict detection rules; supervisor verification
- Role misconfiguration
  - Mitigation: Admin-only claims changes; audits

Milestones (High-Level)

- M1: Core API and SPA routing complete (auth, sites, fuel, maintenance)
- M2: Role dashboards and verification workflows
- M3: Offline capture and sync queue (IndexedDB + service worker)
- M4: Analytics and reporting
- M5: Testing, hardening, and production deployment

References

- Swagger Docs: /docs
- API Overview: documentation/api/endpoints.md and api.txt
- Data Schemas: documentation/database/schema.md
- Security Model: documentation/security.md
- Offline Strategy: documentation/offline.md
