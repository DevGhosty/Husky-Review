# Deployment & Setup Checklist

## External Setup

- [ ] Auth0 SPA application created.
- [ ] Auth0 API created with RS256 signing.
- [ ] Auth0 callback URLs include `http://localhost:5173/app`, production `/app`, and Vercel preview pattern (e.g. `https://*.vercel.app/app`).
- [ ] Auth0 logout URLs include `http://localhost:5173`, production origin, and `https://*.vercel.app` (exact match for `returnTo`; fixes “sign out does nothing”).
- [ ] Auth0 web origins match logout origins (no path suffix).
- [ ] Auth0 post-login Action adds ID-token `role: "authenticated"` for Supabase and namespaced `email` / `role` claims for Vercel API access tokens.
- [ ] Auth0 post-login Action denies non-Google connections and non-`@uw.edu` email addresses.
- [ ] Auth0 application has Google OAuth enabled and every other login connection disabled.
- [ ] Auth0 Universal Login displays only the Google sign-in option for the Husky-Review app.
- [ ] Supabase project created.
- [ ] Supabase Third-Party Auth integration for Auth0 enabled.
- [ ] SQL files in [`supabase/migrations`](./supabase/migrations) have been applied in timestamp order.
- [ ] Migration [`20260528000000_fix_reviews_delete.sql`](./supabase/migrations/20260528000000_fix_reviews_delete.sql) is applied (grants `DELETE` to `service_role` on resume/review tables; sets `reviews.resume_id` to `ON DELETE SET NULL`). Verify with [`scripts/verify-delete-permissions.sql`](./scripts/verify-delete-permissions.sql).
- [ ] `resumes` storage bucket is private.
- [ ] RLS is enabled for `profiles`, `resumes`, and storage policies.

## Environment Variables

- [ ] `VITE_AUTH0_DOMAIN`
- [ ] `VITE_AUTH0_CLIENT_ID`
- [ ] `VITE_AUTH0_AUDIENCE`
- [ ] `VITE_AUTH0_CALLBACK_URL`
- [ ] `AUTH0_DOMAIN`
- [ ] `AUTH0_AUDIENCE`
- [ ] `AUTH0_CLAIM_NAMESPACE` (same namespace used by the Auth0 Action; defaults to `https://husky-review.app/claims`)
- [ ] `AUTH0_ALLOWED_ORIGINS` (comma-separated; API CORS allowlist)
- [ ] `CRON_SECRET` (server-only; protects resume purge cron)
- [ ] `GEMINI_API_KEY` (server-only; optional locally but required for Gemini-backed production analysis)
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` must be server-only.

## Local Verification

- [ ] Run `npm install`.
- [ ] Run `npm run audit` (remaining high findings are in the dev-only `vercel` CLI, not the production Vite bundle).
- [ ] Run `npm run build`.
- [ ] Run `npm run dev`.
- [ ] Run `npm run dev:vercel` when testing API routes locally.
- [ ] Run `npm run test:auth` against `vercel dev` or a deployed URL with `API_BASE_URL`.
- [ ] Optional: set `AUTH_TEST_TOKEN`, `AUTH_TEST_RESUME_ID`, and/or `AUTH_TEST_REVIEW_ID` when running `npm run test:auth` to smoke-test DELETE routes (uses disposable test rows only).
- [ ] Visit `http://localhost:5173`.
- [ ] Click Continue with Google from the app and confirm it redirects to Auth0 Universal Login.
- [ ] Sign in with a valid `@uw.edu` Google account.
- [ ] Verify `/app` loads after redirect.
- [ ] Change profile settings, refresh, and confirm they persist.
- [ ] Upload a resume from the dashboard and click Analyze.
- [ ] Confirm the resume appears on `/app/saved-reviews`.
- [ ] Run a review and confirm the saved review appears on `/app/saved-reviews`.
- [ ] Open the saved review and confirm `/app/roadmap` uses persisted recommendations.
- [ ] Open the resume signed URL.
- [ ] Delete a saved review from `/app/saved-reviews` and confirm it disappears.
- [ ] Delete the resume and confirm it disappears (linked saved reviews remain, with no resume filename).

## Production Verification

- [ ] Deploy to Vercel from `development`.
- [ ] Add production and Vercel preview URLs to Auth0 callback/logout/web-origin settings.
- [ ] Sign out from profile menu returns to site origin and `/app` shows sign-in gate.
- [ ] Confirm unauthenticated `/app/*` shows the in-app sign-in gate.
- [ ] Confirm Continue with Google redirects to Auth0 Universal Login.
- [ ] Confirm API calls include `Authorization: Bearer ...`.
- [ ] Confirm API calls without tokens return `401`.
- [ ] Confirm invalid tokens return `401`.
- [ ] Confirm a third app-key review in the same 7-day window returns `429` and the UI offers BYOK.
- [ ] Confirm a valid user-supplied Gemini key can run an additional review and is not persisted.
- [ ] Confirm Vercel function logs show no Supabase service-role key exposure.

## Supabase Verification

- [ ] `public.profiles` has RLS enabled.
- [ ] `public.resumes` has RLS enabled.
- [ ] Policies use `auth.jwt()->>'sub'`.
- [ ] `resumes_auth0_user_id_created_at_idx` exists.
- [ ] `resumes_created_at_idx` exists (supports retention cleanup).
- [ ] `reviews_auth0_user_id_created_at_idx` exists.
- [ ] `review_ai_usage_limits` exists and `consume_weekly_review_quota` / `check_weekly_review_quota` are executable only by `service_role`.
- [ ] `service_role` has `DELETE` on `resumes`, `reviews`, `review_recommendations`, and `review_roadmap_actions` (see [`scripts/verify-delete-permissions.sql`](./scripts/verify-delete-permissions.sql)).
- [ ] `reviews_resume_id_fkey` uses `ON DELETE SET NULL` so resume deletes do not cascade-delete saved reviews.
- [ ] `CRON_SECRET` is set in Vercel; cron `/api/cron/purge-expired-resumes` runs daily on Hobby (`0 8 * * *` UTC) or more often on Pro.
- [ ] Cron purge skips resumes linked to saved reviews; only orphan uploads older than `RESUME_ORPHAN_RETENTION_HOURS` (default 168) are removed.
- [ ] Private resume objects are stored under `<auth0-sub>/<timestamp>-<filename>`.
- [ ] Signed URLs are short-lived.
