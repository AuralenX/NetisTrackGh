# Changelog — NetisTrackGh

Versioning: Semantic Versioning (https://semver.org)
Format: Keep a human-readable list of notable changes for each release. Group changes by type.

Release Types
- Added: for new features
- Changed: for changes in existing functionality
- Deprecated: for soon-to-be removed features
- Removed: for removed features
- Fixed: for any bug fixes
- Security: in case of vulnerabilities

Template (copy for each release)
- [x.y.z] - YYYY-MM-DD
  - Added:
    - ...
  - Changed:
    - ...
  - Deprecated:
    - ...
  - Removed:
    - ...
  - Fixed:
    - ...
  - Security:
    - ...

Unreleased
- Planned:
  - Offline implementation (IndexedDB + Service Worker)
  - API E2E tests (Playwright)
  - Performance/Load testing
  - CI/CD pipeline

[1.0.0] - 2025-12-06
- Added:
  - Complete backend API (Auth, Sites, Fuel, Maintenance, Sync) with Swagger docs
  - Firebase Auth (REST) + JWT, RBAC (admin/supervisor/technician)
  - Joi validation for core models (user/site/fuel/maintenance)
  - Security hardening: Helmet, CORS, rate limiting
  - Centralized logging (Winston), error handling, graceful shutdown
  - Frontend SPA (Vanilla JS) with modular pages, services, and modals
  - PWA manifest and initial offline scaffolding (files in src/offline)
  - Professional documentation set (requirements, architecture, setup, deployment, security, testing, API reference, database schema, UI guide, offline, environment, contributing, changelog)
- Changed:
  - N/A (initial release)
- Deprecated:
  - N/A
- Removed:
  - N/A
- Fixed:
  - N/A
- Security:
  - Documented security model and incident response
  - Recommended production CORS allowlist and hardened CSP

Release Process
- Prepare: update documentation, increment package versions as needed
- Tests: run backend tests (Jest + Supertest), perform manual checks on core flows
- Changelog: update this file with all notable changes
- Tag: create git tag vX.Y.Z and push tags
- Deploy: follow documentation/deployment.md
- Post-release: monitor health, error rates, and logs; create follow-up issues if needed

Links
- Documentation index: documentation/README.md
- API docs (Swagger): /docs (local dev: http://localhost:3000/docs)
- Setup and deployment: documentation/setup.md, documentation/deployment.md
