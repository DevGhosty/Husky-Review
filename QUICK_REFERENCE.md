# Quick Reference: Auth0 + Supabase Setup

## 🏃 Quick Start (Local Dev)

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with your credentials
cp .env.example .env.local
# Edit .env.local with your Auth0 and Supabase keys

# 3. Run dev server
npm run dev

# 4. Visit http://localhost:5173 and click Sign In
```

## 🔑 Environment Variables Checklist

### Frontend Variables (commit-safe)
```
VITE_AUTH0_DOMAIN=xxx.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
VITE_AUTH0_AUDIENCE=https://your-api
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/app
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Server Variables (Vercel only, never commit)
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AUTH0_DOMAIN=xxx.auth0.com
```

## 📋 Auth0 Setup Checklist

- [ ] Create application in Auth0
- [ ] Create API with audience identifier
- [ ] Set Callback URLs:
  - Dev: `http://localhost:5173/app`
  - Prod: `https://yourdomain.vercel.app/app`
- [ ] Set Logout URLs:
  - Dev: `http://localhost:5173`
  - Prod: `https://yourdomain.vercel.app`
- [ ] Copy Domain and Client ID

## 🗄️ Supabase Setup Checklist

- [ ] Create Supabase project
- [ ] Run SQL schema from INTEGRATION_GUIDE.md
- [ ] Create `resumes` storage bucket
- [ ] Set bucket to Private (authenticated only)
- [ ] Copy Project URL and Anon Key

## 🧪 Testing Flows

### Test Authentication
```
1. Visit http://localhost:5173
2. Click "Sign in" button
3. Auth0 Universal Login appears
4. Sign up or log in with email
5. Redirected to /app
6. Try accessing /app/saved-reviews
```

### Test Protected Routes
```
1. As unauthenticated user, try /app
   → Should redirect to /login
2. As authenticated user, /app should load
3. Click logout (if available in AppShell)
4. Try /app again → Should redirect to /login
```

### Test API Endpoints
```bash
# Get access token first (do this in browser console while logged in):
// window.__auth0FromCache__.access_token

# Test GET /api/resumes
curl -H "Authorization: Bearer {token}" http://localhost:5173/api/resumes

# Should return: []  (empty for new users)
# Without token: 401 Unauthorized
```

### Test Resume Operations
```
1. Navigate to /app/saved-reviews
2. Look for "Your Saved Resumes" section
3. Verify it shows "No saved resumes yet" initially
4. [Future] Upload resume button (to be implemented)
5. [Future] Verify resume appears in list
6. [Future] Test delete button
```

## 🚀 Deployment Checklist

```bash
# Before deployment:
npm run build        # Verify build succeeds
npm run preview      # Test production build locally

# Deploy to Vercel:
npm run deploy:prod

# After deployment:
# 1. Update Auth0 callback URLs to production domain
# 2. Test login flow in production
# 3. Verify API endpoints work
# 4. Check browser console for errors
```

## 🐛 Common Issues & Fixes

### "Cannot find module '@auth0/auth0-react'"
```bash
npm install @auth0/auth0-react
```

### "Token verification failed"
- Check `AUTH0_DOMAIN` is set in Vercel
- Verify token is not expired
- Ensure `VITE_AUTH0_AUDIENCE` matches Auth0 API setting

### "Unauthorized" on API calls
- Verify `Authorization` header is sent
- Check token hasn't expired
- Ensure user is authenticated

### "RLS policy denies access"
- Check user_id format matches Auth0 'sub'
- Verify RLS policies are created
- Check Supabase logs for detailed error

### Build fails with TypeScript errors
```bash
npm run build  # See detailed error messages
# Fix any missing types or syntax errors
```

## 📞 Key Files & Functions

| File | Purpose |
|------|---------|
| `src/auth/auth0-config.ts` | Auth0/Supabase config |
| `src/components/protected-route.tsx` | Route protection |
| `src/hooks/useResumes.ts` | Resume CRUD hook |
| `api/auth0-verify.ts` | Token validation |
| `api/resumes.ts` | Resume list/delete |
| `api/resumes/upload.ts` | Resume upload |

## 🔗 Useful Links

- [Auth0 React SDK](https://auth0.com/docs/libraries/auth0-react)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Vercel Functions](https://vercel.com/docs/serverless-functions)
- [JWT.io](https://jwt.io) — Decode tokens to debug

## 📊 Testing Acceptance Criteria

- [ ] Unauthenticated users cannot access /app/*
- [ ] Sign-in button initiates Auth0 Universal Login
- [ ] After login, user redirected to /app
- [ ] Logout removes session
- [ ] API proxy rejects requests without valid token
- [ ] User can see their own saved resumes
- [ ] One user cannot read another's resumes
- [ ] Production build succeeds
- [ ] No console errors in production

## 💾 Save These Credentials

```
Auth0 Domain: ___________________
Auth0 Client ID: ___________________
Auth0 Audience: ___________________
Supabase URL: ___________________
Supabase Anon Key: ___________________
Supabase Service Role Key: ___________________
```

---

For detailed setup, see `INTEGRATION_GUIDE.md`
For implementation details, see `IMPLEMENTATION_SUMMARY.md`
