# NetisTrackGh Architecture

Version: 1.0.0
Last updated: 2025-12-06

Overview

- NetisTrackGh is a mobile-first PWA for telecom site monitoring, fuel tracking, and maintenance management.
- Architecture: SPA (Vanilla JS) + REST API (Node/Express) + Firebase (Auth + Firestore) + PWA offline design.
- Security: Firebase Identity Toolkit (REST), JWT, RBAC, Helmet, Rate-limiting, CORS, centralized error handling, audit/security logs.
- Observability: Health and status endpoints, structured logging.

High-Level Architecture

- Client (PWA)
  - Single Page Application using hash-based routing
  - Dynamic module imports for pages and dashboards
  - Authentication managed via backend-only flow (no direct Firestore writes from client)
  - Planned: IndexedDB for offline queue, Service Worker caching, background sync
- API Server (Node.js + Express)
  - REST endpoints grouped by domain: Auth, Sites, Fuel, Maintenance, Sync
  - Middleware for JWT verification and role-based access
  - Input validation using Joi
  - API documentation via Swagger (/docs)
- Firebase
  - Firebase Auth (via REST API) for credential verification, token refresh, password reset
  - Firebase Admin SDK for server-side operations and Firestore access
  - Firestore as primary data store (users, sites, fuelLogs, maintenanceLogs, securityLogs)

Component Map

- Frontend
  - Router: frontend/public/js/app.js
  - Pages: frontend/public/src/pages/\*
  - Modals: frontend/public/src/modals/\*
  - Services: frontend/public/src/services/\*
  - Offline (planned): frontend/public/src/offline/\*
- Backend
  - Server bootstrap: backend/server.js
  - Config: backend/src/config/\*
  - Controllers: backend/src/controllers/\*
  - Routes: backend/src/routes/\*
  - Middleware: backend/src/middleware/\*
  - Models (validation): backend/src/models/\*
  - Utilities: backend/src/utils/\*

Sequence Flows

1. Authentication (Login)

- Client → POST /api/auth/verify (email, password)
- Backend → Firebase Identity Toolkit (REST) signInWithPassword
- Backend ← Firebase returns idToken, refreshToken, expiresIn
- Backend → Ensure user profile exists (Firestore users collection)
- Backend → Return token + refreshToken + user profile + role to client
- Client → store tokens (localStorage/sessionStorage), start auto-refresh, set cookie (optional)

2. Protected API Request

- Client → GET/POST/PUT/DELETE /api/... with Authorization: Bearer <token>
- Backend → verifyToken middleware validates Firebase JWT
- Backend → requireRole middleware enforces RBAC
- Backend → Controller logic → Firestore
- Backend → response JSON with success/error

3. Token Refresh

- Client (before expiry buffer) → POST /api/auth/refresh with refreshToken
- Backend → Firebase securetoken.googleapis.com REST refresh
- Backend → Return new token, refreshToken, expiresIn
- Client → store updated tokens and extend session

4. Offline & Sync (planned)

- Client offline → store actions (fuel/maintenance/site creates/updates) in IndexedDB syncQueue
- Client online → background sync triggers send of queued requests to /api/sync
- Backend → processes queued operations; resolves conflicts; returns status
- Client → updates local state accordingly

ASCII Architecture Diagram (Conceptual)

[Client (PWA)]
├─ Router (app.js)
├─ Pages (Sites, Fuel, Maintenance, Reports, ...)
├─ Services (authService, apiService, siteService)
├─ Offline (IndexedDB, Service Worker) [planned]
└─ Storage (localStorage/sessionStorage/cookies)

        | HTTPS (CORS, JWT)
        v

[Node.js + Express API]
├─ Routes (/api/auth, /api/sites, /api/fuel, /api/maintenance, /api/sync)
├─ Middleware (verifyToken, requireRole)
├─ Controllers (authController, siteController, ...)
├─ Models (Joi validation)
├─ Utils (logger, errorHandler)
└─ Swagger (/docs)

        | Admin SDK
        v

[Firebase]
├─ Auth (REST) - login, refresh, reset
└─ Firestore - users, sites, fuelLogs, maintenanceLogs, securityLogs

Request Lifecycle (Backend)

- Incoming request
- Security middleware (Helmet, CORS, Rate limit)
- Body parsing (JSON, URL-encoded)
- Swagger (if /docs)
- Public endpoints (/health, /api/status)
- Auth routes (/api/auth/\*) with mixed public/protected handlers
- Protected routes (/api/sites, /api/fuel, /api/maintenance, /api/sync)
  - verifyToken → requireRole → Controller
- Success/Fail → errorHandler middleware
- 404 fallback (after all routes)

Authentication & Authorization

- Authentication
  - Firebase Identity Toolkit REST for email/password sign-in
  - Refresh token flow via securetoken.googleapis.com
  - Tokens returned to client with expiry and refreshToken
- Authorization (RBAC)
  - Roles: admin, supervisor, technician
  - requireRole middleware checks for role membership or specific privileges
  - Examples:
    - Technician: create fuel/maintenance logs, view assigned sites
    - Supervisor: verify logs, view all sites, analytics
    - Admin: full system access including user/role management

Error Handling

- Centralized error handler returns structured error payloads with code and message
- Input validation errors (400) from Joi with details
- Auth failures (401), forbidden (403), not found (404), rate-limited (429), server errors (5xx)
- 404 handler returns list of available endpoints for discoverability
- Unhandled rejections and exceptions monitored; in production, process may exit after logging

Logging & Monitoring

- Winston logger for structured logs
- Startup banner prints health URLs and API endpoints
- Health endpoints:
  - /health → service availability and memory stats
  - /api/status → uptime, memory usage, environment, API routes
- Swagger UI (/docs) with:
  - Request duration
  - Persist authorization
  - Filter
- Security event logs captured in Firestore (login success/failure, password reset/change, logout, etc.)

Security Layers

- Helmet security headers and CSP in server.js
- CORS configuration with allowed methods/headers
- express-rate-limit with environment-aware defaults
- JWT validation middleware (verifyToken) for protected routes
- RBAC middleware (requireRole)
- Data validation with Joi (Models) to ensure input integrity
- Audit/security logging for sensitive events

Environments & Configuration

- Environment variables (examples):
  - PORT
  - NODE_ENV
  - RATE_LIMIT_WINDOW_MS
  - RATE_LIMIT_MAX_REQUESTS
  - FIREBASE_WEB_API_KEY
  - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (server-side)
- Development
  - Swagger at http://localhost:3000/docs
  - Health at http://localhost:3000/health
  - Status at http://localhost:3000/api/status
- Production
  - HTTPS via reverse proxy/ingress
  - CORS allowlist
  - Secure key management
  - Logging aggregation and retention

Performance Considerations

- Backend
  - Route handlers kept lean; validation and role checks early
  - Rate limiting to protect from abuse
- Frontend
  - Code-splitting via dynamic imports in app.js
  - Page instance caching for better navigation performance
  - Planned: caching static assets via Service Worker
- Firestore
  - Indexes for common queries (sites by technician, logs by siteId)
  - Efficient document designs with clear access patterns

Scalability

- Horizontally scalable API servers behind a load balancer
- Firestore scales with usage; consider collection partitioning if needed (by siteId/date)
- Stateless API with JWT allows easy scaling
- Queue-based sync design for offline clients

Offline Architecture (Planned)

- IndexedDB data stores:
  - syncQueue: queued mutations (POST/PUT/DELETE) with payload and metadata
  - cache: recently accessed site details and lists
- Service Worker:
  - Cache static assets (HTML, CSS, JS, icons)
  - Runtime caching strategies for API GETs (stale-while-revalidate)
  - Background sync for queued mutations
- Conflict Resolution:
  - Client includes lastKnownVersion/timestamp
  - Server resolves conflicts; supervisor verification for authoritative resolution

CORS and CSP

- CORS: methods ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders '\*'
- CSP (Helmet):
  - defaultSrc 'self'
  - styleSrc 'self' 'unsafe-inline' cdnjs.cloudflare.com
  - scriptSrc 'self' cdnjs.cloudflare.com
  - imgSrc 'self' data: https:
- Consider environment-sensitive tightening for production

Data Model (Summary)

- users: uid, email, role, isActive, assignedSites, timestamps
- sites: siteId, name, location, acSystem, dcSystem, generator, fuel, maintenanceSchedule, assignedTechnician, isActive, timestamps
- fuelLogs: siteId, quantity, timestamp, createdBy, verifiedBy, status
- maintenanceLogs: siteId, type, details, timestamp, createdBy, verifiedBy, status
- securityLogs: event, userId/email, ip, userAgent, timestamp

Dependencies (Key)

- Backend: express, cors, helmet, express-rate-limit, dotenv, firebase-admin, joi, swagger-jsdoc, swagger-ui-express, winston, axios
- Dev: jest, supertest, nodemon
- Frontend (CDN): Firebase compat SDKs, EmailJS, font-awesome

Deployment Topology (Typical)

- API: Node/Express app behind HTTPS proxy (NGINX/Cloud provider LB)
- Frontend: Static hosting (Netlify/Vercel/Static CDN)
- Firebase: Managed service (Auth + Firestore)
- Domain: app.example.com (frontend), api.example.com (backend)
- SSL/TLS termination at proxy/load balancer

Glossary

- RBAC: Role Based Access Control
- PWA: Progressive Web App
- SPA: Single Page Application
- JWT: JSON Web Token
- CSP: Content Security Policy

References

- API Docs: /docs (Swagger UI)
- Requirements: requirements.md
- Security: security.md
- Offline & Sync: offline.md
- Data Model: database/schema.md
