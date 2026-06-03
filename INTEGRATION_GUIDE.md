# Auth0 + Supabase Integration Guide for Husky-Review

This app keeps Auth0 as the identity provider and uses Supabase for account-scoped profile settings, private resume metadata, private resume file storage, review history, app-key AI quota tracking, and verified UW catalog data.

## 1. Auth0 Setup

1. Create an Auth0 Single Page Application.
2. Configure the app URLs (each value must match exactly what the browser uses):
   - **Allowed Callback URLs**: `http://localhost:5173/app`, your production `https://<domain>/app`, and Vercel previews such as `https://*.vercel.app/app` when your Auth0 plan supports wildcards.
   - **Allowed Logout URLs**: `http://localhost:5173`, your production origin `https://<domain>`, and `https://*.vercel.app`. The app signs out with `returnTo` set to `window.location.origin` (no path). If logout appears to do nothing, this origin is usually missing from Allowed Logout URLs.
   - **Allowed Web Origins**: same origins as logout (scheme + host + port, no trailing path).
3. Enable **only** the Google (`google-oauth2`) connection for this application; disable database and other social connections.
4. The SPA passes `connection: 'google-oauth2'` in `authorizationParams` on login so Universal Login goes straight to Google.
5. Create an Auth0 API for the Vercel functions.
   - Identifier becomes `VITE_AUTH0_AUDIENCE` and `AUTH0_AUDIENCE`.
   - Signing algorithm must be RS256.
6. Add an Auth0 Action for Supabase Third-Party Auth:

```js
exports.onExecutePostLogin = async (event, api) => {
  const claimNamespace = (event.secrets.CLAIM_NAMESPACE || 'https://husky-review.app/claims').replace(/\/+$/, '')

  if (event.connection.strategy !== 'google-oauth2') {
    api.access.deny('google_required', 'Use Google sign-in to access Husky-Review.')
    return
  }

  const email = (event.user.email || '').toLowerCase()
  if (!email.endsWith('@uw.edu')) {
    api.access.deny('uw_email_required', 'Use a @uw.edu Google account to access Husky-Review.')
    return
  }

  api.idToken.setCustomClaim('role', 'authenticated')
  api.idToken.setCustomClaim(`${claimNamespace}/email`, email)
  api.idToken.setCustomClaim(`${claimNamespace}/role`, 'authenticated')
  api.accessToken.setCustomClaim(`${claimNamespace}/email`, email)
  api.accessToken.setCustomClaim(`${claimNamespace}/role`, 'authenticated')
}
```

Supabase requires the literal `role` claim on the ID token. Vercel APIs accept either a standard `email` claim or the namespaced `${claimNamespace}/email` access-token claim; set `AUTH0_CLAIM_NAMESPACE` to the same namespace if you change it.

Attach the Action to the **Login** flow. The Action is the server-side enforcement point for Google-only and `@uw.edu` access; the client also blocks non-`@uw.edu` emails in [`protected-route.tsx`](./src/components/protected-route.tsx).

## 2. Supabase Setup

1. Create a Supabase project.
2. In Authentication settings, add a Third-Party Auth integration for Auth0.
3. Apply the SQL files in [`supabase/migrations`](./supabase/migrations) in timestamp order. `supabase/schema.sql` is retained as a legacy profile/resume bootstrap reference, but the migrations are the deployable source of truth.
4. Confirm the `resumes` storage bucket exists and is private.
5. Confirm RLS is enabled on:
   - `public.profiles`
   - `public.resumes`
   - `public.reviews`
   - `public.review_recommendations`
   - `public.review_roadmap_actions`
   - `storage.objects`

The RLS policies compare owner columns and storage folder names to `auth.jwt()->>'sub'`, because Auth0 user IDs are strings like `auth0|...`, not Supabase Auth UUIDs.

## 3. Environment Variables

Local `.env.local` and Vercel need:

```bash
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
VITE_AUTH0_AUDIENCE=https://your-api-identifier
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/app
# Optional: override sign-out return URL (must match Auth0 Allowed Logout URLs exactly)
# VITE_AUTH0_LOGOUT_URL=http://localhost:5173
# Optional: extra origins for logout validation messages (comma-separated)
# VITE_AUTH0_ALLOWED_ORIGINS=https://your-production-domain.vercel.app

AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_CLAIM_NAMESPACE=https://husky-review.app/claims

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_or_anon_key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

GEMINI_API_KEY=your_server_side_gemini_key
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code.
`GEMINI_API_KEY` is server-only. Signed-in users get 2 app-key Gemini reviews per 7-day window; they can paste their own Gemini key in the app for additional reviews, and that key is not stored.

## 4. App Flow

1. `/app/*` routes show the Husky-Review app shell first, then redirect to Auth0 Universal Login only after the user clicks Continue with Google.
2. The browser uses Auth0 ID tokens for Supabase profile reads/writes through Supabase Third-Party Auth and RLS.
3. Resume uploads go through Vercel API routes with Auth0 access tokens.
4. API routes verify Auth0 tokens with `jose` and Auth0 JWKS.
5. API routes use the server-only Supabase service role key, filter by Auth0 `sub`, store files under `resumes/<auth0-sub>/...`, and return short-lived signed URLs.
6. `/api/reviews/analyze` fetches the uploaded resume, retrieves active verified UW activities, packs a trimmed AI context, enforces the weekly app-key quota, and persists the review result.

## 5. Verification

Run:

```bash
npm run build
npm run dev:vercel
```

In a second PowerShell terminal:

```powershell
$env:API_BASE_URL = 'http://localhost:3000'
npm run test:auth
```

Manual checks:

- Unauthenticated `/app/*` shows the in-app sign-in gate.
- Clicking Continue with Google redirects to Auth0 Universal Login with only the Google connection available.
- A signed-in user reaches `/app`.
- Uploading a resume and clicking Analyze creates a resume record and storage object.
- Running analysis creates a review record with recommendations and roadmap actions.
- `/app/saved-reviews` lists uploaded resumes with signed Open links.
- `/app/saved-reviews` lists saved reviews and can reopen them into `/app/roadmap`.
- Deleting a resume removes the database row and storage object.
- Profile settings survive refresh after Supabase Third-Party Auth is configured.
- Sign out from the profile menu clears the session and returns to the site origin; visiting `/app` shows the sign-in gate again.

## 6. Vercel environment sync

From the `Husky-Review` directory:

```bash
vercel link
vercel env pull .env.local
```

Set the same Auth0 and Supabase variables for **Preview** and **Production**, then redeploy. Preview deployments need the preview origin in Auth0 logout/callback/web-origin settings.
