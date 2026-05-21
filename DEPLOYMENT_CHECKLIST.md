# Deployment & Setup Checklist

## External Setup

- [ ] Auth0 SPA application created.
- [ ] Auth0 API created with RS256 signing.
- [ ] Auth0 callback/logout/web-origin URLs include local and production origins.
- [ ] Auth0 post-login Action adds `role: "authenticated"` to ID tokens.
- [ ] Auth0 post-login Action denies non-Google connections and non-`@uw.edu` email addresses.
- [ ] Auth0 application has Google OAuth enabled and every other login connection disabled.
- [ ] Auth0 Universal Login displays only the Google sign-in option for the Husky-Review app.
- [ ] Supabase project created.
- [ ] Supabase Third-Party Auth integration for Auth0 enabled.
- [ ] [`supabase/schema.sql`](./supabase/schema.sql) has been run.
- [ ] `resumes` storage bucket is private.
- [ ] RLS is enabled for `profiles`, `resumes`, and storage policies.

## Environment Variables

- [ ] `VITE_AUTH0_DOMAIN`
- [ ] `VITE_AUTH0_CLIENT_ID`
- [ ] `VITE_AUTH0_AUDIENCE`
- [ ] `VITE_AUTH0_CALLBACK_URL`
- [ ] `AUTH0_DOMAIN`
- [ ] `AUTH0_AUDIENCE`
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` must be server-only.

## Local Verification

- [ ] Run `npm install`.
- [ ] Run `npm run build`.
- [ ] Run `npm run dev`.
- [ ] Run `npm run dev:vercel` when testing API routes locally.
- [ ] Run `npm run test:auth` against `vercel dev` or a deployed URL with `API_BASE_URL`.
- [ ] Visit `http://localhost:5173`.
- [ ] Click Continue with Google from the app and confirm it redirects to Auth0 Universal Login.
- [ ] Sign in with a valid `@uw.edu` Google account.
- [ ] Verify `/app` loads after redirect.
- [ ] Change profile settings, refresh, and confirm they persist.
- [ ] Upload a resume from the dashboard and click Analyze.
- [ ] Confirm the resume appears on `/app/saved-reviews`.
- [ ] Open the resume signed URL.
- [ ] Delete the resume and confirm it disappears.

## Production Verification

- [ ] Deploy to Vercel from `development`.
- [ ] Add production URL to Auth0 callback/logout/web-origin settings.
- [ ] Confirm unauthenticated `/app/*` shows the in-app sign-in gate.
- [ ] Confirm Continue with Google redirects to Auth0 Universal Login.
- [ ] Confirm API calls include `Authorization: Bearer ...`.
- [ ] Confirm API calls without tokens return `401`.
- [ ] Confirm invalid tokens return `401`.
- [ ] Confirm Vercel function logs show no Supabase service-role key exposure.

## Supabase Verification

- [ ] `public.profiles` has RLS enabled.
- [ ] `public.resumes` has RLS enabled.
- [ ] Policies use `auth.jwt()->>'sub'`.
- [ ] `resumes_auth0_user_id_created_at_idx` exists.
- [ ] Private resume objects are stored under `<auth0-sub>/<timestamp>-<filename>`.
- [ ] Signed URLs are short-lived.
