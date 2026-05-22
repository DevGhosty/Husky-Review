# Auth0 tenant setup (one-time)

Code changes for Google-only `@uw.edu` login and logout are in the app. Finish tenant + Vercel configuration with the steps below.

## Quick setup (Auth0 CLI — day to day)

```bash
npm run auth0:setup:cli
```

This updates callback/logout URLs, ensures the app is a **SPA** (not Regular Web Application), deploys the post-login Action, and patches public-client token settings.

## Option A — Management API (CI / initial tenant bind)

1. In [Auth0 Dashboard](https://manage.auth0.com/) → **Applications** → **Create Application** → **Machine to Machine**.
2. Authorize it for the **Auth0 Management API** with scopes:
   - `read:clients`, `update:clients`
   - `read:actions`, `create:actions`, `update:actions`, `delete:actions`
3. Add to `.env.local` (do not commit):

   ```bash
   AUTH0_MGMT_CLIENT_ID=your_m2m_client_id
   AUTH0_MGMT_CLIENT_SECRET=your_m2m_client_secret
   ```

4. Run:

   ```bash
   npm run auth0:setup
   ```

This updates callback/logout/web-origin URLs and deploys the post-login Action in [`auth0/actions/post-login-uw-google.js`](auth0/actions/post-login-uw-google.js).

## Option B — Auth0 CLI (interactive)

```bash
.\.tools\auth0-cli\auth0.exe login
.\.tools\auth0-cli\auth0.exe apps update <VITE_AUTH0_CLIENT_ID> ^
  --callbacks "http://localhost:5173/app,https://husky-review.vercel.app/app,https://*.vercel.app/app" ^
  --logout-urls "http://localhost:5173,https://husky-review.vercel.app,https://*.vercel.app" ^
  --origins "http://localhost:5173,https://husky-review.vercel.app,https://*.vercel.app"
```

Create the post-login Action manually using the code in `auth0/actions/post-login-uw-google.js` and attach it to the **Login** flow.

## Auth0 application connections

In **Applications** → your Husky-Review SPA → **Connections**, enable **only** Google (`google-oauth2`).

## Vercel environment

Production URL: `https://husky-review.vercel.app`

Set in Vercel (Preview + Production):

| Variable | Example |
|----------|---------|
| `VITE_AUTH0_DOMAIN` | `dev-gamqgs47xldlc3hi.us.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | (SPA client id) |
| `VITE_AUTH0_AUDIENCE` | `https://husky-review-api` |
| `VITE_AUTH0_CALLBACK_URL` | `http://localhost:5173/app` (local); build uses origin `/app` at runtime |
| `AUTH0_DOMAIN` | same as `VITE_AUTH0_DOMAIN` |
| `AUTH0_AUDIENCE` | same as `VITE_AUTH0_AUDIENCE` |

**Note:** `vercel env pull` may write empty strings for encrypted variables. Keep secrets in the Vercel dashboard and maintain a local `.env.local` manually.

Sync server-only variables to Vercel (from `.env.local`):

```bash
npm run env:sync-server
```

Redeploy after changes:

```bash
npm run deploy:prod
```

## Access token claims (API enforcement)

The post-login Action sets on the **access token**:

- `email` — used by [`api/auth0-verify.ts`](api/auth0-verify.ts) to require `@uw.edu` on every API call
- `role` — `authenticated` for Supabase third-party auth

Redeploy the Action after changing `auth0/actions/post-login-uw-google.js`:

```bash
npm run auth0:setup:cli
```

## Verify

```bash
npm run build
npm run dev:vercel
# second terminal:
$env:API_BASE_URL='http://localhost:3000'; npm run test:auth
```

Optional API boundary checks (paste a real access token from the browser):

| Env var | Expect |
|---------|--------|
| `AUTH_TEST_TOKEN` | `GET /api/resumes` → 200 |
| `AUTH_TEST_TOKEN_NON_UW` | `GET /api/resumes` → 403 |

Server routes require **`AUTH0_DOMAIN`** and **`AUTH0_AUDIENCE`** (not `VITE_*` fallbacks).

Manual: sign in with `@uw.edu` Google → `/app` loads → profile menu **Sign out** returns home and `/app` shows the sign-in gate.

## Token storage

The SPA uses `cacheLocation="localstorage"` with `useRefreshTokens={false}` (see [`src/auth/auth0-provider.tsx`](src/auth/auth0-provider.tsx)) so session restore stays reliable without silent refresh iframes that can hang behind CSP.
