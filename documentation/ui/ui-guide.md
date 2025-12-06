# NetisTrackGh — UI/UX Guide

Version: 1.0.0
Last updated: 2025-12-06

Purpose
- Provide a guide to the application's user interface, navigation model, page behaviors, reusable components/modals, and styling conventions.
- Document role-based visibility and accessibility considerations.

Design Principles
- Mobile-first, PWA-friendly
- Fast navigation (SPA, hash routing)
- Clear visual hierarchy and readable typography
- Role-aware visibility (technician, supervisor, admin)
- Informative feedback (toasts, validation messages, loading states)

Navigation & Routing (Hash-based)
- Entry: index.html
- Router: frontend/public/js/app.js (NetisTrackApp)
- Routes:
  - #login
  - #password-reset
  - #request-account
  - #dashboard
  - #analytics
  - #sites
  - #fuel
  - #maintenance
  - #reports
  - #profile
  - #settings
  - #help
  - #about
  - #site-details
- Lazy loading via dynamic imports:
  - src/auth/*.js
  - src/pages/*.js
  - src/dashboard/*.js

Global UI States
- Loading screen on startup with animated logo and loading dots
- Per-page loading placeholder injected during route changes
- Error screen rendering (showError in app router)
- Toast notifications via authService.showToast for feedback

Page Inventory (src/pages)

Login (#login)
- Purpose: Authenticate users using backend-only flow
- Elements:
  - Email/password inputs
  - Login button, password reset link, account request link
- Behavior:
  - On success: redirect based on role (dashboard or analytics)
  - On failure: show error toast/message

Password Reset (#password-reset)
- Purpose: Trigger backend password reset flow
- Elements:
  - Email input, submit button
- Behavior:
  - Always shows friendly success message (security best practice)

Request Account (#request-account)
- Purpose: Support prompting admins to create accounts (informational flow)

Dashboard (#dashboard)
- Audience: Technicians primarily
- Content:
  - Quick status tiles: assigned sites, pending logs (if applicable)
  - Shortcuts to log fuel/maintenance
- Behavior:
  - Pulls minimal data to remain performant on mobile

Analytics (#analytics)
- Audience: Supervisors/Admins
- Content:
  - Charts (planned) on fuel consumption, maintenance KPIs
- Behavior:
  - Respect RBAC; technicians may be redirected away

Sites (#sites)
- Purpose: Site browsing and search
- Elements:
  - Search bar (by siteId/name)
  - Site list with summary cards
- Behavior:
  - Technician: sees assigned sites only
  - Supervisor/Admin: sees all sites
- Actions:
  - View details (navigates to #site-details)
  - Create site (role gated)
  - Edit site (role gated)

Site Details (#site-details)
- Purpose: Show full site information
- Sections:
  - Identity (siteId, name)
  - Location (address, map coordinates if available)
  - AC/DC systems
  - Generator details
  - Fuel information
  - Maintenance schedule
  - Assigned technician
- Actions:
  - Open modals (log fuel/maintenance)
  - Edit site info (role gated)

Fuel Logs (#fuel)
- Purpose: View and log fuel events
- Elements:
  - List of recent logs per site or by filter
  - Add Fuel Log action (opens modal)
- Behavior:
  - Validation: level ranges, non-negative inputs
  - Verification: supervisor/admin action where applicable

Maintenance (#maintenance)
- Purpose: View and log maintenance
- Elements:
  - Logs list by site
  - Add Maintenance Log action (opens modal)
  - Schedule maintenance (opens scheduler modal)
- Behavior:
  - Enforce required fields per schema
  - Verification actions for roles

Reports (#reports)
- Purpose: Aggregate views and exports (planned)
- Elements:
  - Filter controls
  - Export buttons (CSV/JSON) [planned]

Profile (#profile)
- Purpose: View/update user profile
- Elements:
  - Basic info (firstName, lastName, phoneNumber)
- Behavior:
  - Save updates via backend PUT /auth/profile

Settings (#settings)
- Purpose: Client preferences (theme, notifications - as applicable)
- Behavior:
  - Non-critical; primarily persistent client-side

Help (#help)
- Purpose: FAQ and support contacts

About (#about)
- Purpose: App info and version

Reusable Components (public/components)

modal.js
- Generic modal wrapper behaviors
- Backdrop, close interactions (tap outside or X)

site-card.js
- Compact visual display of sites
- Key info: name, siteId, location snippet, status cues
- Clickable to open details

fuel-gauge.js
- Visual representation of current fuel level (percentage)
- Accepts a numeric input (0..100)

maintenance-alert.js
- Displays upcoming/overdue maintenance states
- Severity-based colors (low, medium, high, critical)

Modal Inventory (src/modals)

FuelLogModal.js
- Inputs:
  - site selection/confirmation
  - fuelAmount, fuelCost, currentLevel, previousLevel, odometerReading, generatorHours, notes, images
- Validation:
  - non-negative values; currentLevel 0..100
- Actions:
  - Submit → POST /api/fuel
- Feedback:
  - Success toast and list refresh

MaintenanceLogModal.js
- Inputs:
  - maintenanceType, title, description, partsUsed[], laborHours, totalCost, completedDate, priority, generatorHours, notes, images
- Validation:
  - Required fields, bounds on numbers and lengths
- Actions:
  - Submit → POST /api/maintenance

AddSiteModal.js
- Inputs:
  - siteId (6 digits), name, location, systems, generator, fuel, maintenance schedule
- Validation:
  - Joi-aligned, enforce siteId pattern
- Actions:
  - Submit → POST /api/sites

MaintenanceSchedulerModal.js
- Inputs:
  - maintenanceType, title, description, scheduledDate, estimatedHours, priority, assignedTo, recurrence
- Actions:
  - Create schedule (implementation dependent: log vs separate collection)

FuelSiteSelectorModal.js / MaintenanceSiteSelectorModal.js
- Purpose:
  - Quickly pick a site before logging actions
- Behavior:
  - Search by siteId/name; filter to assigned sites for technicians

Styling & Layout

Global CSS
- frontend/public/css/style.css → core styles
- src/styles/dashboard.css → dashboard visuals
- src/styles/pages.css → route-specific styles
- src/auth/auth.css → auth screen styles

Design tokens (informal)
- Primary color: #667eea
- Accent colors: decisions per component
- Buttons:
  - Primary: background #667eea, white text, rounded corners
- Cards:
  - White background, subtle shadow, rounded corners, responsive

Form UX
- Inputs with clear labels and helper text
- Validation:
  - Client-side where possible, aligned with backend errors
  - Immediate feedback on invalid inputs
- Accessibility:
  - Label elements tied to inputs (for/id)
  - Keyboard navigability (Tab order)
  - Sufficient color contrast

Role-based Visibility
- Technician:
  - Can create fuel/maintenance logs
  - Limited site visibility (assigned)
  - No role-management actions
- Supervisor:
  - Can verify logs
  - Access analytics and broader site lists
- Admin:
  - Full access, including user/role management (via API/UI)
- Ensure UI checks mirror backend RBAC to avoid confusing hidden actions that are allowed or vice versa

Feedback & Empty States
- Show informative empty states when lists are empty (e.g., “No sites assigned yet”)
- Use toasts for action feedback (success/error)
- Use loading spinners/placeholders during data fetches

Performance Considerations
- Lazy-load pages and modules
- Cache frequent data client-side (consider IndexedDB in offline design)
- Avoid rendering large lists at once; use paging/virtualization where needed

Accessibility Checklist
- Semantic HTML for structure
- Focus management when modals open/close
- Keyboard-accessible controls
- Alt text for images (icons and meaningful imagery)
- Announce validation errors and statuses (ARIA live regions if needed)

Internationalization (Future)
- Centralize user-facing strings to allow for easy translation
- Avoid hard-coded text in logic-heavy components

Error Handling Patterns
- Graceful fallback UI on route errors
- Show actionable messages (e.g., “Check your network connection”)
- 401 → session expired → redirect to #login after toast

Quality & UI Review
- Verify all primary routes on mobile viewport sizes
- Confirm modals are responsive and scroll safely on small screens
- Ensure consistent spacing and typography scales across pages

References
- Router and App Shell: public/js/app.js
- Services: src/services/*
- Modals: src/modals/*
- Pages: src/pages/*
- Styles: src/styles/*, src/auth/auth.css
