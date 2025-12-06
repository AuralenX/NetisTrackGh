# Contributing Guide — NetisTrackGh

Version: 1.0.0
Last updated: 2025-12-06

Purpose

- Define a clear and consistent contribution workflow for maintainers and contributors.
- Improve code quality, review efficiency, and release predictability.

Scope

- Backend (Node.js/Express/Firebase Admin)
- Frontend (Vanilla JS SPA/PWA)
- Documentation (this docs/ directory)

Repository Structure (Summary)

- backend/ — Express API, Firebase Admin, Swagger
- frontend/ — Static SPA, PWA manifest, components/pages/services
- documentation/ — Project docs (you are here)

Before You Start

- Read documentation/README.md to understand docs navigation.
- Read documentation/setup.md for local dev setup and environment variables.
- Review documentation/architecture.md and documentation/security.md for system design and security context.
- For testing expectations, see documentation/testing.md.

Contribution Workflow

1. Fork and Clone (for external contributors)

- Fork the repository to your GitHub account.
- Clone locally:
  - git clone https://github.com/YourUser/NetisTrackGh.git
  - cd NetisTrackGh

2. Create a Branch

- Use the following naming conventions:
  - blackboxai/<short-purpose> (for AI-generated contributions)
  - feat/<short-purpose> (new features)
  - fix/<short-purpose> (bug fixes)
  - docs/<short-purpose> (documentation)
  - refactor/<short-purpose> (internal refactors)
  - chore/<short-purpose> (tooling, deps, CI)
  - test/<short-purpose> (tests only)
- Examples:
  - feat/offline-sync-queue
  - fix/auth-token-refresh
  - docs/add-api-curl-examples

3. Keep Your Branch Up to Date

- Rebase from the default branch (main) regularly:
  - git fetch origin
  - git rebase origin/main

4. Code Style and Standards
   Backend (Node/Express)

- Prefer modern JS (ES2019+). Keep functions small and composable.
- Validation with Joi (see backend/src/models/\*).
- Centralized error handling (utils/errorHandler).
- Logging with Winston (utils/logger).

Frontend (Vanilla JS)

- Keep modules cohesive (pages, modals, services).
- Avoid global leakage; use module-scoped classes/functions.
- Prefer async/await; handle errors with user-friendly messages.
- Maintain accessibility (labels, focus, ARIA where appropriate).

Formatting and Linting

- Use 2-space indentation and trailing newlines.
- Prefer single quotes in JS files for consistency.
- Keep lines reasonably short (soft limit ~100-120 chars).
- If Prettier/ESLint configs are added later, run formatters before committing.

Security

- Never commit secrets or credentials.
- Do not log sensitive data (tokens, passwords, private keys).
- Enforce RBAC in routes; never rely on frontend checks alone.
- Review documentation/security.md for policies and checklists.

5. Write/Update Tests (where applicable)

- Backend unit/integration tests with Jest + Supertest:
  - cd backend
  - npm test
- Cover happy paths and error paths for modified endpoints.
- Update documentation/testing.md with new test commands or noteworthy scenarios if needed.

6. Update Documentation (if applicable)

- Update relevant docs when adding features or changing behavior:
  - documentation/api/endpoints.md
  - documentation/database/schema.md
  - documentation/offline.md
  - documentation/environment.md
- Update documentation/README.md quick links if new docs are created.

Commit Convention (Conventional Commits)

Format

- type(scope): short summary

Types

- feat: a new feature
- fix: a bug fix
- docs: documentation only changes
- style: formatting, no code change
- refactor: code change that neither fixes a bug nor adds a feature
- perf: performance improvement
- test: adding or correcting tests
- chore: maintenance, tooling, CI, deps

Examples

- feat(auth): implement token refresh with buffer window
- fix(sites): validate 6-digit siteId and return 409 on duplicates
- docs(api): add curl examples for /auth/verify
- refactor(maintenance): extract schedule calculation utils

Commit Body (Optional)

- Explain motivation and context.
- Reference issues, e.g., Closes #123.

7. Open a Pull Request (PR)

- Push your branch and open a PR against main.
- Use a descriptive title and include:
  - What and why: summary of changes and motivation
  - Scope of impact (backend/frontend/docs)
  - Screenshots for UI changes (if helpful)
  - Test coverage or manual test results
  - Any breaking changes or migration notes

PR Checklist

- Code builds and runs locally
- Tests pass locally (backend)
- Relevant documentation updated
- No secrets or sensitive logs included
- Follows commit conventions and branch naming rules
- Changes are minimal and focused per PR (avoid unrelated edits)

Code Review Guidelines

- Be constructive and specific.
- Focus on correctness, readability, security, and maintainability.
- Request changes for:
  - Missing validation or error handling
  - Security concerns (RBAC, token handling, CORS/CSP)
  - Unclear naming or large, complex functions without comments
- Approve when:
  - Tests (if any) are sufficient for the change
  - Code is clear and consistent with project patterns
  - Documentation is adequate

Merging

- Prefer squash merging to keep history clean (single commit per PR).
- Ensure commit message follows Conventional Commits after squash.

Issue Reporting

- Use clear, actionable titles (e.g., "Fuel logs: 500 when siteId not found").
- Include:
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment (dev/staging/prod), logs, screenshots if possible
- Tag labels (bug, enhancement, docs, security, performance).

Security Vulnerabilities

- Do not open a public issue.
- Report privately to the maintainer via email or a dedicated security channel.
- Provide details and reproduction steps if possible.

Release Management

- Follow semantic versioning in documentation/changelog.md.
- Each release should include:
  - Summary of features/fixes
  - Breaking changes (if any)
  - Upgrade/rollback notes

Local Development Quickstart

- See documentation/setup.md for prerequisites and step-by-step commands.
- Backend:
  - cd backend && npm install && npm run dev
- Frontend:
  - Open frontend/public/index.html in a local static server
- Swagger docs:
  - http://localhost:3000/docs

Contact and Support

- Use GitHub Issues for bugs and feature requests.
- For discussion or questions, create a GitHub Discussion thread (if enabled) or open an issue with "question" label.

Acknowledgements

- Please add yourself to CONTRIBUTORS.md (if present) or include your name/email in PR description.

References

- Setup: documentation/setup.md
- Architecture: documentation/architecture.md
- Security: documentation/security.md
- API: documentation/api/endpoints.md
- Testing: documentation/testing.md
- Offline: documentation/offline.md
