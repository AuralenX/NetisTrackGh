# NetisTrackGh — Environment Configuration

Version: 1.0.0
Last updated: 2025-12-06

Purpose

- Define all environment variables and configuration needed for local development, staging, and production.
- Explain secure handling of secrets and environment-specific behavior for the backend API and frontend SPA/PWA.

Overview

- Backend (Node/Express) loads environment variables from process.env (e.g., via .env in development).
- Frontend (Vanilla JS SPA) is static and does not have a build step with env injection; configurable values are defined in code (e.g., authService config and Firebase config in app.js). Avoid placing secrets in the frontend.

Environments

- development: local machine, permissive CORS, verbose logs, Swagger enabled
- staging (optional): mirrors production to verify configuration and performance
- production: strict CORS, hardened security headers, rate-limit tuned, log aggregation, TLS

Backend Environment Variables (server)
Required

- PORT
  - Description: HTTP port for the API server
  - Example: 3000
- NODE_ENV
  - Description: Environment mode
  - Values: development | production
- FIREBASE_WEB_API_KEY
  - Description: Firebase web API key used for Identity Toolkit REST calls (verify/refresh/reset)
  - Example: AIzaSyExample123
- FIREBASE_PROJECT_ID
  - Description: Firebase project ID for Admin SDK
  - Example: netistrackgh
- FIREBASE_CLIENT_EMAIL
  - Description: Firebase Admin client email (service account)
  - Example: firebase-adminsdk-xyz@netistrackgh.iam.gserviceaccount.com
- FIREBASE_PRIVATE_KEY
  - Description: Firebase Admin private key (service account)
  - Format: Keep as a single line with \n escape sequences or ensure your runtime properly loads multiline values
  - Example: -----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9...==\n-----END PRIVATE KEY-----

Optional / Defaults in Code

- RATE_LIMIT_WINDOW_MS
  - Description: Rate limit window in milliseconds
  - Default: 15min in production, 1min in development (fallbacks in code)
- RATE_LIMIT_MAX_REQUESTS
  - Description: Max requests per IP per window
  - Default: 100 in production, 1000 in development (fallbacks in code)

Backend .env (Example for local development)

- PORT=3000
- NODE_ENV=development
- RATE_LIMIT_WINDOW_MS=60000
- RATE_LIMIT_MAX_REQUESTS=1000
- FIREBASE_WEB_API_KEY=your_firebase_web_api_key
- FIREBASE_PROJECT_ID=your_firebase_project_id
- FIREBASE_CLIENT_EMAIL=your_firebase_admin_client_email
- FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

Notes for FIREBASE_PRIVATE_KEY

- When copying the private key:
  - If using a .env file, replace actual newlines with \n sequences.
  - If your deploy platform allows multiline secrets, ensure your code loader handles them correctly before passing to firebase-admin.
- Never commit this key to the repository.

Frontend Configuration (SPA)

- The SPA is static and currently defines:
  - Backend base URL in: frontend/public/src/services/authService.js → config.backendBaseUrl (default http://localhost:3000/api)
  - Firebase client config in: frontend/public/js/app.js

Recommendation for Frontend Config

- Extract runtime configuration to a small JSON file (public/config.json) that contains only non-sensitive values:
  - { "apiBaseUrl": "https://api.example.com/api" }
- Fetch this config in app.js before initializing services to avoid hardcoding URLs.
- Do NOT place secrets (private keys, service account credentials) in the frontend; Firebase client config is not a secret but treat responsibly.

Environment Matrix (Guidelines)

- development
  - PORT: 3000
  - NODE_ENV: development
  - CORS: permissive (any origin)
  - Swagger: enabled at /docs
  - Rate limiting: higher thresholds
  - Logging: verbose
- staging
  - NODE_ENV: production
  - CORS: allowlist for staging frontend domain(s)
  - Swagger: enabled but access restricted (e.g., basic auth or IP allowlist)
  - Rate limiting: production-like
  - Logging: shipped to central store
- production
  - NODE_ENV: production
  - CORS: strict allowlist for production frontend domain(s)
  - Helmet CSP: tighten scripts/styles sources where possible
  - Swagger: restrict or disable
  - Rate limiting: tuned (e.g., 100/15min window)
  - HTTPS via reverse proxy; HSTS enabled
  - Logging: structured, shipped to aggregation with retention

CORS Configuration

- Development
  - Code defaults to allow all origins via callback that returns true.
- Production
  - Maintain ALLOWED_ORIGINS in environment (comma-separated) and implement a whitelist check in server configuration:
    - Example (conceptual):
      - ALLOWED_ORIGINS=https://app.example.com,https://staging.example.com
    - If origin not in allowlist: return 403 or skip CORS headers.

Secrets Management

- Keep secrets in a secure store (Vault, GCP Secret Manager, AWS Secrets Manager, Render/Heroku Secret config).
- Never commit .env files to version control.
- Provide a sanitized .env.example to help developers.
- Ensure logs do not leak secrets; redact token-like fields.

Operational Notes

- Reverse Proxy
  - Set app.set('trust proxy', 1) in production for correct rate limiting/IPs (already in server.js)
- Rate Limiting
  - Adjust RATE*LIMIT*\* for environment-specific needs
- Swagger (/docs)
  - Enable in development; restrict in staging/production
- Health/Status Endpoints
  - /health and /api/status should be used by uptime monitors and operational dashboards

Validation & Testing

- Verify environment variables are present on boot; fail fast on missing critical configuration.
- Maintain scripts to validate .env content during CI (optional).
- For local development, use dotenv; for production, prefer platform-based secret injection.

References

- Setup guide: setup.md
- Deployment: deployment.md
- Security: security.md
- Testing: testing.md
- API endpoints: api/endpoints.md
