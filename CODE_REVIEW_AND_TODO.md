## NetisTrackGh Codebase Review

### High-level overview
- **Architecture**: Well-structured separation between backend (`backend/`) and a mobile-first SPA/PWA frontend (`frontend/public/`). The documentation in `documentation/` is unusually strong and gives a clear picture of flows (auth, RBAC, offline/sync design, observability).
- **Backend**: Node/Express API with Firebase Admin + Firestore, JWT-based auth, centralized error handling, rate limiting, and Swagger docs. The core `server.js` is clean and production-aware (Netlify vs self-hosted, health/status endpoints, graceful shutdown).
- **Frontend**: Vanilla JS SPA with hash-based routing (`frontend/public/js/app.js`), dynamic imports for pages, a rich `authService` handling session and security concerns, and a PWA-ready shell (service worker stub, manifest, splash/loading).
- **Docs & DX**: Extensive docs (architecture, security, offline, testing, environment, contributing, etc.) and a clear backend `package.json` with Jest + Supertest set up but not yet wired into actual tests.

### Critical issues (must fix)
- **Hard-coded and committed secrets**
  - **Backend `.env` currently in the repo and contains real secrets**: Firebase project ID, **private key**, client email, and `FIREBASE_WEB_API_KEY` are all committed in `backend/.env`. This is a major security risk.
  - **Frontend Firebase config and EmailJS key are hard-coded** in `frontend/public/js/app.js` (`firebaseConfig.apiKey`, etc.) and `initializeEmailJS()` (public key).
  - **Actions to take immediately**:
    - Rotate **all** exposed credentials:
      - Firebase Admin private key and associated service account.
      - Firebase Web API key.
      - Any EmailJS public keys or other third-party keys.
    - Remove `backend/.env` from git history and ignore it:
      - Add `.env` to `backend/.gitignore` (root `.gitignore` is already present; ensure backend-specific ignore is correct).
      - Replace `backend/.env` with a **safe** `backend/.env.example` that contains only variable names and placeholder values (you already have `.env.example`, but the real `.env` must not be tracked).
    - For frontend:
      - Move environment-specific config into a build-time configuration file or environment variables (e.g., bundler or separate `config.*.js` files not tracked with real keys).
      - At minimum, document that the current Firebase config is public (as in any web app) but still treat rotation and proper project security as mandatory.

### Backend review
- **Server bootstrap (`backend/server.js`)**
  - **Strengths**:
    - Uses `helmet` with a good baseline CSP for non-Netlify environments and a relaxed config when `NETLIFY === 'true'`.
    - Rate limiting on `/api/` routes via `express-rate-limit` with env overrides (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`).
    - Proper JSON and URL-encoded body limits based on `NODE_ENV` (stricter in production).
    - Static serving of `public/` only when not in Netlify environment; good separation for serverless deployment.
    - Health endpoints: `/health`, `/api/health`, and `/api/status` give strong observability signals (uptime, memory, environment).
    - API routes are clearly mounted under `/api/*` with separation by domain: `auth`, `sites`, `fuel`, `maintenance`, `sync`.
    - Centralized error handling via `errorHandler` and graceful shutdown logic for `SIGTERM`/`SIGINT`.
  - **Areas to improve**:
    - **CORS**:
      - The more advanced, environment-aware CORS configuration is commented out, and the app currently calls `app.use(cors())` with **no origin restriction**.
      - This contradicts the security posture described in `documentation/security.md` and `documentation/architecture.md` (where CORS allowlist is emphasized).
      - You should re-enable the stricter CORS configuration and tie it to `ALLOWED_ORIGIN` env variable(s), falling back to sane defaults for local dev.
    - **Swagger endpoints**:
      - Swagger is correctly wired at `/docs` with nice UI tweaks, but ensure `/docs` is appropriately protected in production (if needed) or at least documented as public in `security.md`.
    - **Uploads path**:
      - `app.use('/uploads', express.static(path.join(__dirname, 'upload')));` exposes files from `upload` (note singular). Confirm this is intentional, sanitize file uploads, and document allowed file types and size limits.

- **Middleware (`backend/src/middleware/verifyToken.js`)**
  - **Strengths**:
    - Simple and clear Firebase ID token verification with `admin.auth().verifyIdToken(token)` and logging via `logger`.
    - Attaches a minimal `req.user` with `uid`, `email`, and `role` (defaulting to `technician`).
  - **Areas to improve**:
    - **Role propagation**: Relying on `decodedToken.role` means your RBAC depends on custom claims; ensure `authController` keeps those in sync, and document this clearly (partly done in `architecture.md`).
    - **Token extraction**:
      - `req.headers.authorization?.split('Bearer ')[1]` is slightly brittle; consider a more robust parser that tolerates casing and extra spaces.
    - **Error differentiation**:
      - Currently returns a generic `INVALID_TOKEN`. Consider mapping Firebase error codes (`auth/id-token-expired`, `auth/argument-error`, etc.) to more specific responses or let `errorHandler` cover this uniformly.

- **Error handling (`backend/src/utils/errorHandler.js`)**
  - **Strengths**:
    - Centralized, structured error responses with specific codes for Firebase, Firestore, validation, duplicate key, and rate limiting.
    - Custom `AppError` hierarchy (ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError) is ready for more expressive error handling in controllers.
    - Environment-aware responses: concise 500s in production, detailed stacks in development.
  - **Areas to improve**:
    - **Consistent use of `AppError`**:
      - Ensure controllers and services consistently throw these custom errors instead of generic `Error`, so responses are predictable and easier to handle on the frontend.
    - **Logging PII**:
      - You log `userId`, `ip`, and request path; double-check that you’re not logging sensitive payload fields (e.g., passwords), and ensure `logger` is configured for secure sinks in production.

- **Models, controllers, utilities**
  - Based on `architecture.md` and dependencies (`joi`, `axios`, `firebase-admin`), the models are validation layers, and controllers handle Firestore/REST calls.
  - **Potential gaps** (not all files inspected, inferred from structure):
    - Controllers likely mix validation, business logic, and Firebase calls. Consider extracting shared service functions if duplication is high.
    - Confirm that all Firestore writes enforce role-based checks and input validation through Joi models (some of this is described in docs but should be verified across all routes).
    - Sync flow (`syncRoutes`, `syncController`) should be aligned with the offline design in `offline.md`; if some parts are still “planned,” annotate controllers with TODOs or feature flags.

- **Testing**
  - `backend/package.json` defines `"test": "jest"` and includes `jest` and `supertest`, but there’s no visible `tests/` or `__tests__/` folder in the globbed file list.
  - This suggests testing is **planned but not implemented**.

### Frontend review
- **SPA router (`frontend/public/js/app.js`)**
  - **Strengths**:
    - Well-structured `NetisTrackApp` class with lazy-loaded pages using dynamic `import()` to reduce initial bundle size.
    - Hash-based routing with simple `navigateTo` helper and robust route error handling.
    - Reuse of page instances (`pageInstances` Map) with optional `detachEvents`/`destroy` to avoid leaks; this is sophisticated for a vanilla JS SPA.
    - Nice UX touches: animated splash/loading screen, per-route loading messages, and PWA readiness (service worker registration stub).
  - **Areas to improve**:
    - **Auth guard at router level**:
      - Currently, routing allows navigation to routes like `dashboard`, `sites`, etc. without a visible central auth guard.
      - You already have `authService` with `isAuthenticated()` and `redirectBasedOnRole()`. Use it here to:
        - Redirect unauthenticated users to `#login` if they attempt protected routes.
        - Redirect authenticated users away from `#login` to `#dashboard` or `#analytics`.
    - **Service worker**:
      - The service worker registration is commented out with a “we’ll create sw.js later” note. This matches the “planned” offline design in `offline.md`.
      - Implementing at least a minimal `sw.js` to cache core assets and handle basic offline fallback would be a big UX win and align docs with reality.

- **Auth service (`frontend/public/src/services/authService.js`)**
  - **Strengths**:
    - Handles **backend-only auth**: login via `/api/auth/verify`, token refresh via `/api/auth/refresh`, password reset, and change password.
    - Session management is rich: localStorage + sessionStorage, expiry tracking, auto-refresh with buffer, inactivity monitor, and session export/import.
    - Security-conscious: local security logs, brute-force detection on the client side, and logging of key events (`login_success`, `login_failed`, `token_refreshed`, etc.) with optional backend sync.
    - Provides a usable permissions system (role hierarchy + permission strings) that can power UI-level access control.
  - **Areas to improve**:
    - **Security boundaries**:
      - Client-side brute force detection and local logging are nice, but they should be mirrored server-side for real enforcement. Ensure the backend enforces similar limits.
    - **Token + cookie strategy**:
      - `setAuthCookie` uses `Secure; SameSite=Strict` on the client side. Ensure the backend either ignores this cookie or consistently uses it; currently, most calls send `Authorization: Bearer <token>`.
      - Document the intended source of truth for auth: Authorization header vs cookie.
    - **Network robustness**:
      - `getClientIP` hits `https://api.ipify.org?format=json` on login and in logs, which adds latency and external dependency. Consider making this optional or server-side.
    - **Global side effects**:
      - The inactivity modal and toasts manipulate the DOM directly. This is fine for a vanilla SPA, but ensure their styles are defined and they are accessible (focus trap, ARIA attributes).

- **General frontend**
  - Styling is separated into `auth.css`, `dashboard.css`, and `pages.css`, which keeps concerns clear.
  - Components in `frontend/public/components/` (e.g., `site-card.js`, `modal.js`, `fuel-gauge.js`) likely encapsulate core UI widgets; keep ensuring they are reusable and accessible (focus order, keyboard handling).
  - The PWA manifest and icons are in place, but the offline story is still largely “planned.”

### Documentation & project hygiene
- **Docs**
  - `documentation/architecture.md`, `security.md`, `offline.md`, `database/schema.md`, and `api/endpoints.md` are detailed and professional. They give a clear contract for future contributors.
  - `documentation/TODO.md` already tracks documentation deliverables, and most are marked as completed.
- **Project root**
  - Root `README.md` (per `documentation/TODO.md`) already links into docs and Swagger.
  - There is a `structure.txt` file that likely aids onboarding; make sure it’s kept in sync with the actual repo layout.

---

## Recommended Changes & TODO Checklist

### 1. Security & secrets management
- [ ] **Rotate Firebase Admin service account & keys**
  - Generate a new private key for Firebase Admin, update deployment environments, and invalidate the old key.
- [ ] **Rotate Firebase Web API key**
  - Create a new web API key in Firebase, update both backend and frontend configs where necessary, and restrict it by domain/IP in the Firebase console.
- [ ] **Remove real `.env` from git and ignore it**
  - Ensure `backend/.env` is **not** tracked by Git:
    - Add `.env` to `backend/.gitignore`.
    - Remove the file from git history (using history rewrite if already pushed).
  - Keep only `backend/.env.example` with sanitized placeholders.
- [ ] **Audit other secrets**
  - Check `EmailJS` public key and any other third-party tokens. Confirm they are appropriately scoped and rotate if they were never meant to be exposed.
- [ ] **Document rotation procedure**
  - Extend `documentation/environment.md` or `security.md` with a “Key Rotation” section that describes how to rotate Firebase keys, EmailJS keys, etc.

### 2. Backend hardening & correctness
- [ ] **Re-enable strict CORS configuration**
  - Restore the environment-aware CORS logic currently commented in `server.js`:
    - Build an allowlist from `ALLOWED_ORIGIN` plus known production and local-dev URLs.
    - Reject unexpected origins and log them; keep a safe default for local tools if needed.
- [ ] **Align CORS docs with implementation**
  - Update `documentation/security.md` and `architecture.md` to reflect the actual CORS config and specific allowed origins.
- [ ] **Clarify `/uploads` behavior**
  - Confirm whether `upload` (singular) is correct or if the directory should be `uploads`.
  - Add validation and sanitization to any upload endpoints (file type, size, virus scanning if applicable) and document in `security.md`.
- [ ] **Standardize error usage**
  - Update controllers to consistently throw `AppError` subclasses (`ValidationError`, `AuthenticationError`, etc.) instead of generic `Error`.
  - Ensure API responses always return structured `{ error, code, message, ... }` objects as defined in the error handler.
- [ ] **RBAC enforcement review**
  - Review all route handlers (`authRoutes`, `siteRoutes`, `fuelRoutes`, `maintenanceRoutes`, `syncRoutes`) to confirm they:
    - Use `verifyToken` on all non-public endpoints.
    - Use `requireRole` (or equivalent) to enforce role permissions as described in `architecture.md`.
  - Update `documentation/api/endpoints.md` to mark endpoints as public or protected with the correct roles.

### 3. Testing & quality
- [ ] **Introduce backend test suite**
  - Create a `tests/` or `__tests__/` directory for Jest + Supertest.
  - Add:
    - Smoke tests for health endpoints (`/health`, `/api/status`).
    - Auth flow tests (login, refresh, protected endpoint access).
    - Validation tests for key routes (sites, fuel, maintenance).
- [ ] **Set up test configuration**
  - Add a Jest config (inline in `package.json` or `jest.config.js`) and a separate `.env.test` for CI.
  - Ensure tests can run without hitting live Firebase (use emulator or mocks where possible).
- [ ] **Add basic frontend tests (optional but recommended)**
  - If you introduce a bundler/test runner (e.g., Vite + Vitest or Jest + jsdom), add smoke tests for:
    - Router navigation.
    - Auth flow UI (login form submission).
    - Critical components like `site-card` and key modals.

### 4. Frontend routing, auth & UX
- [ ] **Implement global auth guard in router**
  - In `NetisTrackApp.handleRouteChange` / `loadPage`, integrate `authService.isAuthenticated()` to:
    - Redirect unauthenticated users from protected routes (`dashboard`, `analytics`, `sites`, `fuel`, `maintenance`, `reports`, `profile`, `settings`) to `#login`.
    - Redirect authenticated users away from `#login`/`#request-account` to a suitable home (e.g., `#dashboard` or `#analytics` based on role).
- [ ] **Tighten role-based UI**
  - Use `authService.hasRole()` / `hasPermission()` to conditionally show/hide navigation items and actions (e.g., admin-only settings, supervisor-only analytics).
  - Reflect this behavior in `documentation/ui/ui-guide.md` and `requirements.md`.
- [ ] **Graceful offline behavior**
  - Implement a minimal `sw.js` that:
    - Caches core shell assets (HTML, CSS, JS, icons).
    - Provides an offline fallback page or message.
  - Gradually extend to match the design in `offline.md` (sync queue, IndexedDB, background sync).

### 5. Observability & logging
- [ ] **Centralize log levels and redaction**
  - Review `backend/src/utils/logger.js` configuration:
    - Ensure it redacts tokens, passwords, and sensitive payload data.
    - Standardize log levels (info, warn, error) across controllers and middleware.
- [ ] **Add correlation IDs (optional)**
  - Consider generating a request ID per incoming request (middleware) and including it in logs to trace requests across components.
- [ ] **Expose metrics for monitoring (optional)**
  - Consider adding a metrics endpoint or integrating with an APM/monitoring tool for CPU, memory, and request metrics beyond the existing `/api/status`.

### 6. Documentation & DX polish
- [ ] **Sync `structure.txt` with current layout**
  - Ensure `structure.txt` reflects all important folders (including any new tests, offline modules, or CI configs).
- [ ] **Add a quickstart section for new contributors**
  - In `README.md` (or `documentation/README.md`), add a “5-minute quickstart”:
    - Commands to run backend and frontend.
    - Default URLs (dashboard, docs, health).
- [ ] **Clarify environment matrix**
  - Expand `documentation/environment.md` to include a simple matrix:
    - Local dev vs staging vs production (backend URL, frontend URL, Firebase project, env vars required).

### 7. Deployment & CI (optional next steps)
- [ ] **Introduce basic CI checks**
  - Set up a simple pipeline (GitHub Actions or equivalent) that:
    - Runs `npm test` in `backend/`.
    - Optionally runs a linter if you adopt ESLint/Prettier.
- [ ] **Automate security checks**
  - Add dependency vulnerability scanning (e.g., `npm audit` or a GitHub Actions security scan) and document how to handle high-risk findings.

---

**Summary**: The codebase is well-structured and thoughtfully documented, with strong foundations in security, observability, and architecture. The most urgent work is **secrets management and CORS hardening**, followed by implementing the planned testing and offline features so that the implementation fully matches the design you’ve already documented.
