# Garde Admin

Admin dashboard using the EV admin visual system, NextAuth v4, and TanStack Query v5. The dashboard remains intentionally empty.

## Local setup

Use Node 22.13 or later.

1. Run npm install.
2. Copy .env.example to .env.local.
3. Set GARDE_API_URL to the API base including /api/v1 (local: http://127.0.0.1:8000/api/v1).
4. Set APP_ORIGIN and NEXTAUTH_URL to the exact frontend origin (local: http://localhost:3000).
5. Generate NEXTAUTH_SECRET with: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
6. Start the API and run npm run dev.

The local environment is configured for the supplied API URL. Secrets stay in the ignored .env.local. Use a separate secret for each deployment, shared across its replicas. Production requires HTTPS. The migration replaces the former preview/custom session; sign in again.

## Architecture

- app/api/auth/[...nextauth]/route.ts: NextAuth credentials, CSRF, session, and sign-out routes.
- app/api/_lib/next-auth-options.ts: Garde password, 2FA, and passkey credentials provider; safe session projection and logout.
- app/api/proxy/[...path]/route.ts: same-origin allowlisted proxy for account reads, recovery, and security operations. It attaches bearer tokens server-side and validates current admin access.
- app/api/_lib: the only upstream API transport and token-refresh integrations. Pages and components never call the Garde API directly.
- lib/query: TanStack Query hooks for current-user fetching, mutations, cache invalidation, and transient-error retry policy.
- components/providers/app-providers.tsx: NextAuth SessionProvider and TanStack QueryClientProvider, plus development query tools.
- Dashboard layout verifies the encrypted NextAuth token and seeds the query cache with its user snapshot. The current-user query immediately checks /api/proxy/auth/me and stays fresh on focus and every 45 seconds.

All future endpoint integrations should be added under app/api/proxy and consumed through lib/query. Token-issuing endpoints are deliberately unavailable through the generic proxy: they must pass through NextAuth so sessions cannot drift from API tokens.

## Admin flow

- Email/password followed by mandatory email OTP or TOTP.
- First-time admins enroll 2FA with a QR code/manual key or email OTP. The setup proxy retains the rotated pending token inside the NextAuth cookie.
- Admin accounts are invite-only. No signup route is exposed.
- Passkey enrollment in Security; passkey sign-in offered for previously known enrolled emails on this browser.
- Password recovery uses an emailed 6-digit code, email, and a new password.
- Profile reads GET /auth/me. It remains read-only because the supplied API has no update endpoint.
- Security supports password changes, switching 2FA method, passkey enrollment, and confirmed account closure.
- Closed accounts can be restored within seven days, then must sign in again.

## Session handling

NextAuth encrypts the JWT session in HttpOnly, SameSite=Lax cookies, with Secure in production. Cookie chunks are supported by both NextAuth and the gateway. API access, refresh, and pending tokens are never exposed in /api/auth/session or query data. Only non-secret 2FA challenge metadata reaches the UI.

NextAuth handles credentials CSRF. Proxy writes additionally validate the exact Origin. Every private proxy request checks /auth/me for admin role and enrolled 2FA. Customer login tokens are rejected and their refresh token is revoked. Queries only retry transient failures; mutations never replay automatically. Query caches are cleared on sign-out.

Both NextAuth and the proxy refresh within one minute of expiry. The proxy retries /me after an access-token rejection, but does not refresh or end sessions for incorrect passwords on security actions. Invalid refresh tokens end the session; transient outages preserve it. Expired server rendering goes through /session/refresh to renew the NextAuth session before returning.

Refresh requests are coalesced in the Node process, including concurrent NextAuth/proxy requests. This local deployment targets a single persistent Node instance. Before multi-replica or serverless deployment, use a shared atomic refresh coordinator such as Redis to serialize single-use refresh tokens across instances.

NextAuth sign-out clears its session even if upstream revocation fails. When the API is unavailable, remote revocation cannot be guaranteed until normal token expiry.

## Passkeys

API WEBAUTHN_ORIGIN must match the frontend origin and WEBAUTHN_RP_ID its hostname (localhost locally). HTTPS is required except on localhost. The browser library serializes native credentials before verification through NextAuth. Real enrollment requires the user's authenticator; automated tests do not simulate biometrics.

## Verification

- npm run lint
- npm run build
- npm run test:auth (requires a production build)

Tests start an isolated mock API and production Next server on temporary ports, using real NextAuth HTTP flows and cookies. Coverage includes CSRF, 2FA setup rotation, hidden tokens, role rejection, mixed-route refresh concurrency, cookie chunking, revoked sessions, recovery, security operations, logout failure, and closure. No real accounts or credentials are used.

## Branding

lib/brand.ts references the supplied public/images/logo/logo.svg and logo-collaspes.svg. The full wordmark appears on auth screens and expanded navigation; the compact mark appears on the collapsed rail. Original white SVGs remain unchanged; CSS makes them dark on light surfaces and white on dark surfaces.

DESIGN.md documents the inherited colors, typography, and layouts.
