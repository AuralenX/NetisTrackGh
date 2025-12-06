# NetisTrackGh Documentation

Comprehensive documentation for NetisTrackGh — a Progressive Web App for telecom site monitoring, fuel tracking, and maintenance management with role-based access and offline support.

Version: 1.0.0

---

Quick Links
- Setup (Local Development): setup.md
- Deployment Guide: deployment.md
- Architecture Overview: architecture.md
- API Reference (Markdown): api/endpoints.md
- Live API Swagger Docs: http://localhost:3000/docs
- Data Model (Firestore Schemas): database/schema.md
- Security Model: security.md
- Testing Strategy: testing.md
- Offline & Sync Strategy: offline.md
- Environment Configuration: environment.md
- Contributing Guide: contributing.md
- Changelog: changelog.md
- Requirements & Use Cases: requirements.md
- UI/UX Guide: ui/ui-guide.md

---

1. Purpose

This documentation provides everything needed to understand, develop, deploy, and maintain NetisTrackGh. It targets:
- Developers: Setup, architecture, coding conventions, API, data model, testing
- Ops/Infra: Deployment, environment configuration, monitoring, incident response
- QA: Test plans, coverage targets, test data
- Stakeholders: Requirements, roles, capabilities, success metrics

---

2. System Overview

- Frontend: Vanilla JavaScript SPA (hash-based routing), PWA-ready, modular pages and components, IndexedDB (planned)
- Backend: Node.js (Express.js), Firebase Admin + Firestore, JWT-based auth, Swagger documentation
- Authentication: Firebase Identity Toolkit (REST) + JWT, RBAC (Admin, Supervisor, Technician)
- Security: Helmet, CORS, rate limiting, centralized error handling, security logs
- Observability: Health (/health), API Status (/api/status), structured logging (Winston)
- Offline: IndexedDB + Sync Queue + Service Worker (design in progress)

---

3. Core Capabilities

- Site Management: CRUD for telecom sites with AC/DC, generator, fuel, and maintenance fields
- Fuel Tracking: Logs, consumption analytics
- Maintenance: Logs, schedules, verification
- Role-based Dashboards: Admin, Supervisor, Technician views
- Offline-first Design: Data capture offline, queued sync (to be finalized)

---

4. Environments

- Development
  - API Docs: http://localhost:3000/docs
  - Health: http://localhost:3000/health
  - Status: http://localhost:3000/api/status
- Production
  - Configure CORS, reverse proxy (HTTPS), environment variables, log retention

See environment.md and deployment.md for details.

---

5. Project Structure (High-level)

backend/
- server.js (Express app)
- src/config (firebaseAdmin, swagger, db)
- src/controllers (auth, sites, fuel, maintenance, sync)
- src/models (Joi schemas)
- src/routes (route modules)
- src/middleware (verifyToken, requireRole)
- src/utils (logger, error handler, calculators)
- tests/ (API tests placeholder)

frontend/public/
- index.html, manifest.json
- js/app.js (SPA router & boot)
- src/auth (login, register, password reset)
- src/pages (Sites, Fuel, Maintenance, Reports, etc.)
- src/modals (AddSite, FuelLog, MaintenanceLog, etc.)
- src/services (authService, apiService, siteService)
- src/offline (indexeddb, offlineManager, syncQueue)
- src/styles (main, dashboard, pages)

documentation/
- This folder

---

6. Roles & Access (RBAC Overview)

- Technician
  - View assigned sites
  - Create fuel/maintenance logs
  - Read own reports
  - Update own profile
- Supervisor
  - View all sites
  - Verify logs
  - Read analytics
  - Manage technicians
  - Generate reports
- Admin
  - Full access
  - Manage users, system, audit logs, configuration

See security.md for full access rules.

---

7. API Overview

Base URLs
- API Docs (Swagger): /docs
- Health: /health
- Status: /api/status
- Auth: /api/auth
- Sites: /api/sites
- Fuel: /api/fuel
- Maintenance: /api/maintenance
- Sync: /api/sync

See api/endpoints.md for detailed endpoints and curl examples.

---

8. Data Model Overview (Firestore Collections)

- users: User profiles, roles, activity state
- sites: Telecom site documents with AC/DC, generator, fuel, maintenanceSchedule
- fuelLogs: Fuel log entries per site
- maintenanceLogs: Maintenance log entries per site
- securityLogs: Auth and security events
- syncQueue (client-side IndexedDB): Offline queue (design in offline.md)

See database/schema.md for schemas and validation.

---

9. Security Highlights

- Firebase REST auth + JWT + custom claims for roles
- Helmet security headers
- CORS with explicit methods and headers
- Rate limiting (stricter in production)
- Centralized error handling
- Security logs for sensitive events
See security.md for incident response and hardening.

---

10. Offline & PWA

- Manifest configured
- Service Worker planned (sw.js)
- IndexedDB + sync queue design
- Conflict resolution and retry strategies
See offline.md for design and implementation plan.

---

11. Development Workflow

- Setup: setup.md
- Run backend: npm run dev (in backend/)
- Serve frontend: open frontend/public/index.html or use a static server
- Work with API: http://localhost:3000/docs
- Testing: testing.md (Jest/Supertest plan)

---

12. Glossary

- Site: Telecom site asset (with power systems, generator, fuel)
- Fuel Log: Fuel consumption/refuel records
- Maintenance Log: Maintenance work record with technician and schedule info
- RBAC: Role Based Access Control
- Sync Queue: Local offline-first queue of pending operations
- PWA: Progressive Web App
- CSR: Client-side rendering SPA

---

13. Maintenance & Ownership

- Repository: Root README.md
- API Docs: /docs (Swagger UI)
- Primary Maintainer: AuralenX - Asiedu Minta Kwaku
- Issue Tracking: GitHub Issues

---

14. Next Steps (Docs)

- Fill out requirements.md, api/endpoints.md, database/schema.md, ui/ui-guide.md (placeholders exist)
- Add testing.md with chosen coverage depth (critical-path vs thorough)
- Add offline.md for IndexedDB + SW implementation plan
- Add deployment.md, security.md, environment.md, contributing.md, changelog.md

Refer to documentation/TODO.md for progress tracking.
