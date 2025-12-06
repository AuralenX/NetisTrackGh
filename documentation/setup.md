# NetisTrackGh — Local Development Setup

Version: 1.0.0
Last updated: 2025-12-06

Purpose

- This guide explains how to set up and run NetisTrackGh locally for development on Windows/macOS/Linux.
- It covers backend (Node/Express) and frontend (Vanilla JS SPA PWA), environment variables, and common troubleshooting.

Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ (bundled with Node)
- Git
- Firebase project (for Auth + Firestore)
- Optional: A static HTTP server to serve the frontend (e.g., http-server)

Repository

- Clone:
  - git clone https://github.com/AuralenX/NetisTrackGh.git
  - cd NetisTrackGh

Project Layout (high-level)

- backend/ — Express API, Swagger docs, Firebase Admin, Joi validation, RBAC
- frontend/public/ — Static SPA/PWA (index.html, js/app.js, src modules, styles)
- documentation/ — Project docs (this file)

Backend Setup (Node/Express)

1. Install dependencies

- cd backend
- npm install

2. Create an .env file in backend/

- The API reads configuration from environment variables. Use the template below.

Example backend/.env

- PORT=3000
- NODE_ENV=development
- # Rate limiting (fallbacks exist in code)
- RATE_LIMIT_WINDOW_MS=60000
- RATE_LIMIT_MAX_REQUESTS=1000
- # Firebase REST (client API key used for verify/reset/refresh flows)
- FIREBASE_WEB_API_KEY=your_firebase_web_api_key
- # Firebase Admin (server-side)
- FIREBASE_PROJECT_ID=your_firebase_project_id
- FIREBASE_CLIENT_EMAIL=your_firebase_admin_client_email
- # Put private key as a single line (replace \n with actual newlines in code or escape properly)
- FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

Notes:

- In many environments, FIREBASE_PRIVATE_KEY requires escaped newlines \n. If you store it with actual newlines, ensure your loader handles it correctly.
- Keep keys secret. Do not commit .env to version control.

3. Run the API (development)

- npm run dev
- The server starts on http://localhost:3000
- Swagger docs: http://localhost:3000/docs
- Health: http://localhost:3000/health
- Status: http://localhost:3000/api/status

4. Run tests (backend)

- npm test
- Test stack: jest + supertest
- Add integration tests under backend/tests/

Frontend Setup (SPA/PWA)

1. Serve the app

- Option A (open directly):
  - Open frontend/public/index.html in your browser
  - Suitable for initial development; some PWA features (Service Worker) may require http(s) origin
- Option B (recommended: run a local static server):
  - cd frontend/public
  - npx http-server -p 5173
  - Open http://localhost:5173
  - Any simple static server will work (serve, live-server, etc.)

2. Backend URL / Auth Service

- The frontend calls the backend API at http://localhost:3000 by default:
  - See frontend/public/src/services/authService.js → config.backendBaseUrl
- To point to a different API host/port, update that config value or introduce a small config file to centralize URLs.

3. Firebase client SDK (frontend)

- The demo app uses Firebase web SDK (compat) in index.html and initializes in js/app.js.
- app.js contains a demo firebaseConfig; replace with your Firebase project's public config if needed.

Example (in frontend/public/js/app.js)

- const firebaseConfig = { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId }
- These keys are not secret but still treat responsibly.
- For production, consider injecting via a config file (e.g., src/services/firebaseConfig.js) and never commit sensitive secrets to the client.

User Accounts & Login

- Backend login endpoint: POST /api/auth/verify
- Create test users in Firebase Console (Email/Password auth enabled).
- After login, the backend will either fetch or create a user profile document in Firestore (users collection) and set default role if none exists.

Useful URLs (Development)

- API root: http://localhost:3000
- Swagger Docs: http://localhost:3000/docs
- Health Check: http://localhost:3000/health
- API Status: http://localhost:3000/api/status
- Frontend (example): http://localhost:5173 (if using http-server)

CORS

- The server enables CORS in development to allow any origin.
- In production, configure an allowlist or stricter rules.

RBAC (Roles)

- Roles: technician, supervisor, admin
- Role checks enforced by middleware on protected routes
- Admin can assign roles via POST /api/auth/assign-role (ensure admin claim on that account)

Troubleshooting

- 401 Unauthorized:
  - Ensure Authorization: Bearer <token> header for protected endpoints.
  - If token expired, use /api/auth/refresh with refreshToken.
- 429 Too Many Requests:
  - Triggered by rate limiting; wait or adjust RATE*LIMIT*\* in .env for development.
- Firebase errors (auth):
  - Check FIREBASE_WEB_API_KEY in backend .env.
  - Confirm Email/Password provider enabled in Firebase project.
- Invalid JSON:
  - Ensure requests use Content-Type: application/json and valid JSON bodies.
- CORS errors:
  - Use the same host/port or ensure CORS is configured appropriately for your dev origin (update server configuration if needed).
- FIREBASE_PRIVATE_KEY:
  - If you see malformed key errors, ensure escaped newlines are correct.
- Port conflicts:
  - Change PORT in .env or stop the process using the port.

Developer Workflow (suggested)

- Backend:
  - Create feature branches: feature/<short-name>
  - Run: npm run dev (watches with nodemon)
  - Add tests in backend/tests/
- Frontend:
  - Serve /public with a static server for a more realistic environment
  - Use hash routes: #login, #dashboard, #sites, #fuel, #maintenance, #reports, #profile, #settings, #help, #about
- Docs:
  - Update documentation/TODO.md as you complete documents
  - Keep endpoints and data model docs aligned with Swagger and Joi schemas

Next Steps

- See documentation/requirements.md for functional scope and user stories.
- See documentation/architecture.md for system design and flows.
- See documentation/deployment.md for production guidance.
- See documentation/security.md for hardening and incident response.
- See documentation/testing.md for test strategy (coverage levels and commands).
