# NetisTrackGh — Security Model and Hardening Guide

Version: 1.0.0
Last updated: 2025-12-06

Purpose
- Define the authentication and authorization model, transport and application security layers, data protection, logging/auditing, and incident response.
- Document defaults implemented in code and recommended production hardening.

Security Objectives
- Protect user accounts and access tokens (authN)
- Enforce least-privilege access based on roles (authZ / RBAC)
- Validate and sanitize all inputs (validation)
- Resist common web attacks (headers, CORS, rate limiting)
- Provide auditability and forensics (logs, security events)
- Enable safe operations and recovery (IR/BCP/DR)

Authentication (AuthN)
- Identity Provider: Firebase Identity Toolkit (REST API)
  - Sign-in: POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=WEB_API_KEY
  - Token refresh: POST https://securetoken.googleapis.com/v1/token?key=WEB_API_KEY (grant_type=refresh_token)
  - Password reset email: POST accounts:sendOobCode
  - Password change: POST accounts:update (with idToken)
- Backend Flow
  - Backend receives email/password from client at POST /api/auth/verify
  - Calls Firebase REST endpoints to validate credentials (server side)
  - On success, returns:
    - idToken (JWT), refreshToken, expiresIn, and the user profile (Firestore-backed)
  - Ensures user profile exists/updated in Firestore users collection
- Token Handling
  - idToken (JWT) used for Authorization: Bearer <token> to protected routes
  - refreshToken used for /api/auth/refresh to get a new idToken
  - Expiry handled client-side with auto-refresh before buffer time
- Frontend storage
  - Tokens stored in localStorage + optional sessionStorage (short-lived)
  - Cookie (auth_token) can be optionally set (Strict, Secure, path=/) — not HttpOnly since set client-side
  - Recommendation: Avoid long-lived tokens on shared devices; prefer short sessions and inactivity timeouts

Authorization (AuthZ) and Roles (RBAC)
- Roles: admin, supervisor, technician
- Enforcement
  - Middleware verifyToken: validates JWT and attaches user claims/context
  - Middleware requireRole: checks route-level role requirements
- Role Semantics
  - technician: view assigned sites; create logs (fuel/maintenance); read own reports; update own profile
  - supervisor: view all sites; verify logs; read analytics; manage technicians; export data
  - admin: full system access; manage users/roles; audit/operations
- Storage of Roles
  - Firebase custom claims and/or Firestore user profile fields
  - Backend trusts claims and verifies user profile on access

Input Validation and Data Integrity
- Validation Library: Joi (backend/src/models/*)
  - Enforces strongly-typed payloads, ranges, formats (e.g., siteId 6-digit)
  - Returns aggregated errors (400) with descriptive messages
- Recommended Practices
  - Validate all input on public and protected endpoints
  - Avoid over-permissive schemas; validate nested objects thoroughly
  - Sanitize strings if any HTML-rendered content is stored/displayed

HTTP Security Headers (Helmet)
- Implemented in server.js with helmet()
  - defaultSrc 'self'
  - styleSrc 'self' 'unsafe-inline' cdnjs.cloudflare.com
  - scriptSrc 'self' cdnjs.cloudflare.com
  - imgSrc 'self' data: https:
- Recommendations for Production
  - Remove 'unsafe-inline' where possible by using nonces/hashes
  - Limit external CDNs or pin SRI hashes
  - Set additional headers:
    - Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
    - X-Content-Type-Options: nosniff (Helmet adds)
    - Referrer-Policy: no-referrer or strict-origin-when-cross-origin
    - Permissions-Policy: restrict camera/mic/geolocation unless required

CORS
- Development
  - Permissive: origin callback returns true for all
- Production
  - Maintain an allowlist of trusted origins (e.g., https://app.example.com)
  - Allow only required methods/headers
  - Example allowlist logic:
    - origin in ALLOWED_ORIGINS env or reject with 403

Rate Limiting and Abuse Protection
- express-rate-limit configured
  - dev default: 1000 per minute (configurable)
  - prod default: 100 per 15 min (configurable)
- Recommendations
  - Use a shared store (Redis) behind multiple instances
  - Add user-level throttling on sensitive endpoints (login, password reset)
  - Consider CAPTCHA after repeated failed logins

Session, Inactivity, and Timeout Policies
- Frontend
  - Inactivity warning at 30 minutes; auto-logout after additional 5 minutes if unacknowledged
  - Auto token refresh with buffer window to avoid abrupt expiry
- Backend
  - No server-side sessions (stateless JWT)
  - Consider refresh token rotation and revocation lists for high-security deployments

Sensitive Data and Secrets
- Secrets/Keys
  - FIREBASE_WEB_API_KEY (public client API key)
  - FIREBASE_PRIVATE_KEY (server-side, must be kept secret)
  - FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID
- Handling
  - Store in environment variables or secret manager (Vault, AWS Secrets Manager, GCP Secret Manager)
  - Never commit secrets; maintain .env.example
  - Log redaction for secrets and PII
- Data at Rest
  - Firestore data encrypted at rest (managed by GCP)
- Data in Transit
  - HTTPS required in production; TLS termination at proxy/load balancer

PII and Privacy
- Minimize PII: store only what is necessary in user profiles
- Avoid logging raw email/password (never log passwords)
- Audit log content should not contain secret tokens or passwords
- Provide data export/deletion procedures per organization policy

Security Logging and Audit Trails
- Security events stored in Firestore collection securityLogs
  - login_success / login_failed
  - password_reset_requested / password_changed
  - session_imported / logout
  - brute_force_detected
- Log Fields
  - timestamp, event, userId, email (if applicable), ip, userAgent, metadata
- Backend Logging (Winston)
  - Structured logs for request handling and errors
  - Recommended: ship to centralized log system (ELK/Cloud provider)
- Log Retention
  - Define retention policies (e.g., 90 days) based on compliance requirements

Error Handling and Responses
- Centralized error handler returns structured JSON:
  - error: message
  - code: machine-readable code
  - details: optional (validation)
- Common Codes:
  - 400 ValidationError
  - 401 Unauthenticated / Invalid Credentials
  - 403 Forbidden / Invalid Role
  - 404 Not Found
  - 409 Conflict (e.g., duplicate siteId)
  - 429 Rate limit exceeded
  - 500/503 Service error
- 404 fallback includes useful discovery hints (/docs, /health, /api/status)

Threat Model (High-Level) and Mitigations
- Credential stuffing / brute force
  - Rate limiting, brute force detection, security logs, optional CAPTCHA after N failures
- Token theft
  - Short-lived tokens, inactivity timers, secure cookie attributes, logout endpoints
- CSRF (less likely for pure API + Bearer tokens)
  - Prefer Authorization headers over cookies; if cookies used, consider SameSite=strict and CSRF tokens if necessary
- XSS
  - Strict CSP, avoid unsafe-inline where possible; sanitize user-generated HTML; DOM-based protections on frontend
- Clickjacking
  - X-Frame-Options / frame-ancestors in CSP
- CORS abuse
  - Strict allowlist in production; block credentials where not required
- DoS
  - Rate limiting, WAF/CDN, autoscaling
- Sensitive data exposure
  - HTTPS, secret management, token redaction in logs

Production Hardening Checklist
- [ ] HTTPS enabled with HSTS
- [ ] CORS allowlist configured via env
- [ ] Helmet CSP hardened (no unsafe-inline or nonces/hashes in place)
- [ ] Rate limiting tuned and shared store (Redis) if multi-instance
- [ ] Swagger restricted or protected (auth, IP allowlist, or disabled in prod)
- [ ] Secrets in secret manager; .env withheld from VCS
- [ ] Logging shipped to central store; PII redaction in place
- [ ] Backup and recovery plans (Firestore exports, config backup)
- [ ] Monitoring and alerting (HTTP health, error rates, latency, 429 spikes)
- [ ] Role review process and periodic access audits

Incident Response (IR) and Recovery
- Detection
  - Monitor anomalous spikes (401/403/429/5xx), login failures, rate limiting events
- Containment
  - Revoke tokens as needed (rotate refresh tokens, adjust deny lists)
  - Restrict Swagger or turn off certain flows temporarily
- Eradication
  - Patch vulnerabilities, rotate keys, improve rate limits
- Recovery
  - Restore normal operations; monitor closely
- Postmortem
  - Document root cause, remediation, timeline; update runbooks and this guide

Operational Runbook (Security Tasks)
- Weekly
  - Review securityLogs for anomalies
  - Check rate limiting metrics and adjust thresholds if needed
- Monthly
  - Role and access review, ensure least-privilege
  - Rotate sensitive keys where policy dictates
- Quarterly
  - Pen test / security review; CSP/CORS review; dependency audit (npm audit)
- On-Change
  - Update Swagger and docs for new endpoints and required roles
  - Re-run threat model considerations for new modules

References
- Backend implementation: backend/server.js, backend/src/middleware/{verifyToken, requireRole}.js
- Validation: backend/src/models/*
- Swagger Docs: /docs
- Requirements: documentation/requirements.md
- Architecture: documentation/architecture.md
