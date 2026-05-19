# Deployment & Setup Checklist

## Pre-Launch Requirements

### ✅ Code Changes Completed
All code changes have been implemented and are ready for deployment. The following has been added:

**Frontend Components:**
- Auth0 provider integration
- Protected route component
- Auth0 login page
- Resume hook for backend integration
- Updated saved-reviews page with backend data display

**Backend API Routes:**
- Token verification middleware
- Resume CRUD endpoints
- File upload handling
- Row-level security integration

**Configuration:**
- Environment variables template
- Vercel deployment configuration
- TypeScript support for all files

---

## Step-by-Step Deployment

### Phase 1: External Setup (30-45 minutes)

#### Auth0 Configuration
1. [ ] Go to https://manage.auth0.com
2. [ ] Create new Single Page Application
3. [ ] Name it "Husky-Review"
4. [ ] Go to Settings and note your Domain and Client ID
5. [ ] Create API with name "Husky-Review-API"
6. [ ] Note your API Identifier (Audience)
7. [ ] Configure URLs:
   - Callback: `http://localhost:5173/app` (dev), `https://yourdomain.vercel.app/app` (prod)
   - Logout: `http://localhost:5173` (dev), `https://yourdomain.vercel.app` (prod)
   - Web Origins: `http://localhost:5173` (dev), `https://yourdomain.vercel.app` (prod)

#### Supabase Configuration
1. [ ] Go to https://supabase.com
2. [ ] Create new project, note Project URL and Anon Key
3. [ ] Open SQL Editor
4. [ ] Copy and run the SQL schema from `INTEGRATION_GUIDE.md`
5. [ ] Go to Storage and create bucket named "resumes" (Private)
6. [ ] Note your Service Role Key

---

### Phase 2: Local Testing (15-20 minutes)

1. [ ] Copy `.env.example` to `.env.local`
2. [ ] Fill in your Auth0 and Supabase credentials
3. [ ] Run `npm install`
4. [ ] Run `npm run dev`
5. [ ] Navigate to `http://localhost:5173`
6. [ ] Test login flow:
   - [ ] Click "Sign in"
   - [ ] Complete Auth0 login
   - [ ] Verify redirect to `/app`
   - [ ] Check that `/app/saved-reviews` loads
7. [ ] Test protected routes:
   - [ ] Open new incognito window
   - [ ] Try accessing `http://localhost:5173/app`
   - [ ] Should redirect to `/login`

---

### Phase 3: Production Build Test (10 minutes)

1. [ ] Run `npm run build`
   - [ ] Verify no TypeScript errors
   - [ ] Check build output is in `dist/`
2. [ ] Run `npm run preview`
   - [ ] Test app works in preview mode
   - [ ] Verify Auth0 login still works

---

### Phase 4: Vercel Deployment (20-30 minutes)

#### Initial Setup
1. [ ] Push code to GitHub
2. [ ] Go to https://vercel.com
3. [ ] Import your repository
4. [ ] Set Framework to "Vite"
5. [ ] Build Command: `npm run build`
6. [ ] Output Directory: `dist`
7. [ ] Don't deploy yet

#### Environment Variables
In Vercel Project Settings → Environment Variables, add:
1. [ ] `VITE_AUTH0_DOMAIN` = your-tenant.auth0.com
2. [ ] `VITE_AUTH0_CLIENT_ID` = (from Auth0)
3. [ ] `VITE_AUTH0_AUDIENCE` = (from Auth0 API)
4. [ ] `VITE_SUPABASE_URL` = (from Supabase)
5. [ ] `VITE_SUPABASE_ANON_KEY` = (from Supabase)
6. [ ] `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase, server-only)
7. [ ] `AUTH0_DOMAIN` = your-tenant.auth0.com (for API routes)

#### Deploy
1. [ ] Click Deploy button
2. [ ] Wait for build to complete
3. [ ] Note your Vercel URL

#### Post-Deployment
1. [ ] Go to Auth0 Application Settings
2. [ ] Update Callback URLs: Add `https://yourvercelurl.vercel.app/app`
3. [ ] Update Logout URLs: Add `https://yourvercelurl.vercel.app`
4. [ ] Update Web Origins: Add `https://yourvercelurl.vercel.app`
5. [ ] Save changes

---

### Phase 5: Verification (15-20 minutes)

#### Authentication Flow
- [ ] Navigate to production URL
- [ ] Click "Sign in"
- [ ] Verify Auth0 Universal Login page appears
- [ ] Complete sign-up or login
- [ ] Verify redirect to `/app`
- [ ] Verify user can access `/app/saved-reviews`

#### API Endpoints
- [ ] Open browser DevTools → Network tab
- [ ] Navigate to `/app/saved-reviews`
- [ ] Check that GET `/api/resumes` returns `[]` (no 401 error)
- [ ] Verify Authorization header has Bearer token

#### Logout Flow
- [ ] [Look for logout button in AppShell header]
- [ ] Click logout
- [ ] Verify redirect to homepage
- [ ] Try accessing `/app` → Should redirect to `/login`

#### Route Protection
- [ ] Open incognito/private window
- [ ] Try accessing production URL `/app`
- [ ] Should redirect to `/login`
- [ ] Try accessing `/` → Should work
- [ ] Try accessing `/privacy` → Should work
- [ ] Try accessing `/resources` → Should work

#### Error Handling
- [ ] Check browser console for errors
- [ ] Check Vercel function logs (Vercel Dashboard → Deployments → Logs)
- [ ] Verify no 500 errors in API responses

---

## Acceptance Criteria Verification

Run through each criterion and mark complete:

- [ ] Unauthenticated users cannot access `/app/*` routes
  - Try accessing in private/incognito window
  - Should redirect to `/login`

- [ ] Signed-in users can log in and log out successfully
  - Complete full auth flow
  - Verify logout returns to home

- [ ] API proxy rejects requests without valid Auth0 tokens
  - Open DevTools and inspect API call headers
  - Verify `Authorization: Bearer` header is present
  - Make manual fetch without token, verify 401

- [ ] A user can save a resume and later reopen it from their account
  - [To be implemented in future phase]
  - Currently shows empty state for saved resumes

- [ ] One user cannot read another user's saved resumes
  - RLS policies prevent cross-user access
  - Verify via Supabase logs if needed

- [ ] Production build still succeeds after the integration
  - Run `npm run build` — verify zero errors
  - Deployment succeeded without errors

---

## Rollback Procedure (if needed)

1. [ ] Push previous commit to GitHub
2. [ ] Go to Vercel Dashboard
3. [ ] Click "Deployments"
4. [ ] Find previous successful deployment
5. [ ] Click "..." and select "Redeploy"
6. [ ] Wait for completion

---

## Troubleshooting During Setup

### Issue: "Auth0Provider not found"
**Solution**: Verify `@auth0/auth0-react` is in package.json and run `npm install`

### Issue: "Cannot find module 'supabase'"
**Solution**: Run `npm install @supabase/supabase-js`

### Issue: "Auth0 login redirects to wrong URL"
**Solution**: Check Callback URLs in Auth0 match your domain exactly (including https://)

### Issue: "API returns 401 Unauthorized"
**Solution**: Verify:
- Auth0 token is valid and not expired
- VITE_AUTH0_DOMAIN environment variable is set
- API request includes `Authorization: Bearer {token}` header

### Issue: "Build fails with TypeScript errors"
**Solution**: 
- Run `npm run build` to see detailed errors
- Fix any import/syntax issues
- Ensure all environment variables are defined

### Issue: "Vercel functions not executing"
**Solution**: Verify:
- `.env` variables are set in Vercel project settings
- API route files are in `api/` directory at project root
- No TypeScript errors in API files

---

## Support Resources

- **Auth0 Docs**: https://auth0.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Implementation Guide**: `INTEGRATION_GUIDE.md`
- **Quick Reference**: `QUICK_REFERENCE.md`

---

## Success Indicators

When everything is working:
1. ✅ Login button initiates Auth0 Universal Login
2. ✅ After login, user redirected to `/app`
3. ✅ Protected routes require authentication
4. ✅ API calls include valid Auth0 token
5. ✅ No console errors in browser
6. ✅ No errors in Vercel function logs
7. ✅ Production build completes successfully

---

**Estimated Total Time**: 1.5 - 2 hours for complete setup and verification

For detailed step-by-step instructions, see `INTEGRATION_GUIDE.md`
