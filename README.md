# Garde Admin

A presentation scaffold using the EV admin platform's visual system and shared UI components.

## Run

- npm install
- npm run dev
- npm run lint
- npm run build

The root redirects to /login. Use **Preview dashboard** to inspect the shell without signing in.

## Included routes

- /login
- /forgot-password
- /reset-password
- /change-password-required
- /dashboard (intentionally empty)
- /settings/profile
- /settings/security
- /settings redirects to /settings/profile

## Integration status

This is a UI preview, not an authenticated application. Dashboard and settings routes are currently public and contain no account data. Form submissions do not send requests, create sessions, reset passwords, or save profile changes. Passwords are never persisted. Security setup is disabled until integration.

When endpoint documentation arrives, add server-side session verification to the dashboard layout and authenticated data access, connect the auth/profile forms, and remove the preview entry point. Determine password rules, reset token handling, and two-factor challenges from the API contract. No EV API configuration, credentials, or environment files were copied.

## Logos

Update lib/brand.ts:
- logoUrl: full logo used throughout auth and expanded navigation.
- collapsedLogoUrl: compact logo used only in the collapsed sidebar.

Both currently point to local dummy SVG URLs. Absolute image URLs also work.

## Design guide

See DESIGN.md for the inherited colors, typography, spacing, and interaction conventions.
