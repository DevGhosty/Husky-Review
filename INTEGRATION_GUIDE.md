# Auth0 + Supabase Integration Guide for Husky-Review

This app keeps Auth0 as the identity provider and uses Supabase for account-scoped profile settings, private resume metadata, and private resume file storage.

## 1. Auth0 Setup

1. Create an Auth0 Single Page Application.
2. Configure the app URLs:
   - Callback URLs: `http://localhost:5173/app`, plus your production `/app` URL.
   - Logout URLs: `http://localhost:5173`, plus your production origin.
   - Web Origins: `http://localhost:5173`, plus your production origin.
3. Create an Auth0 API for the Vercel functions.
   - Identifier becomes `VITE_AUTH0_AUDIENCE` and `AUTH0_AUDIENCE`.
   - Signing algorithm must be RS256.
4. Add an Auth0 Action for Supabase Third-Party Auth:

```js
exports.onExecutePostLogin = async (event, api) => {
  api.idToken.setCustomClaim('role', 'authenticated')
}
```

Supabase requires the literal `role` claim on the ID token. Auth0 strips non-namespaced custom claims from access tokens, so do not rely on adding this claim to the Auth0 access token.

## 2. Supabase Setup

1. Create a Supabase project.
2. In Authentication settings, add a Third-Party Auth integration for Auth0.
3. Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor.
4. Confirm the `resumes` storage bucket exists and is private.
5. Confirm RLS is enabled on:
   - `public.profiles`
   - `public.resumes`
   - `storage.objects`

The RLS policies compare owner columns and storage folder names to `auth.jwt()->>'sub'`, because Auth0 user IDs are strings like `auth0|...`, not Supabase Auth UUIDs.

## 3. Environment Variables

Local `.env.local` and Vercel need:

```bash
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
VITE_AUTH0_AUDIENCE=https://your-api-identifier
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/app

AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_or_anon_key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code.

## 4. App Flow

1. Auth0 protects `/app/*` routes.
2. The browser uses Auth0 ID tokens for Supabase profile reads/writes through Supabase Third-Party Auth and RLS.
3. Resume uploads go through Vercel API routes with Auth0 access tokens.
4. API routes verify Auth0 tokens with `jose` and Auth0 JWKS.
5. API routes use the server-only Supabase service role key, filter by Auth0 `sub`, store files under `resumes/<auth0-sub>/...`, and return short-lived signed URLs.

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

- Unauthenticated `/app/*` redirects to Auth0.
- A signed-in user reaches `/app`.
- Uploading a resume and clicking Analyze creates a resume record and storage object.
- `/app/saved-reviews` lists uploaded resumes with signed Open links.
- Deleting a resume removes the database row and storage object.
- Profile settings survive refresh after Supabase Third-Party Auth is configured.
