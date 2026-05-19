# Auth0 + Supabase Integration Guide for Husky-Review

## Overview
This guide covers the complete Auth0 and Supabase integration for Husky-Review. The app now supports:
- Auth0 Universal Login for secure authentication
- Per-user resume storage in Supabase with row-level security
- Vercel serverless API routes for token verification and proxying
- Protected routes that require authentication

---

## Part 1: Auth0 Setup

### Step 1: Create an Auth0 Application
1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Create a **New Application** → Choose **Single Page Application**
3. Name it `Husky-Review`
4. In **Settings**, configure:
   - **Allowed Callback URLs**: `http://localhost:5173/app` (dev) and `https://yourdomain.vercel.app/app` (prod)
   - **Allowed Logout URLs**: `http://localhost:5173` (dev) and `https://yourdomain.vercel.app` (prod)
   - **Allowed Web Origins**: `http://localhost:5173` (dev) and `https://yourdomain.vercel.app` (prod)
   - **Token Endpoint Authentication Method**: `None`
5. Copy your **Domain** and **Client ID** from Settings

### Step 2: Create an Auth0 API (Audience)
1. Go to **APIs** → **Create API**
2. Name: `Husky-Review-API`
3. Identifier: `https://husky-review-api.example.com` (or similar)
4. Signing algorithm: `RS256`
5. Copy the **Identifier** (this is your `VITE_AUTH0_AUDIENCE`)

### Step 3: Environment Variables
Add to `.env.local` (local dev) and Vercel project settings (production):
```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_AUDIENCE=https://husky-review-api.example.com
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/app
AUTH0_DOMAIN=your-tenant.auth0.com
```

---

## Part 2: Supabase Setup

### Step 1: Create a Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com)
2. Create a **New Project**
3. Copy your **Project URL** and **Anon Key** from Settings > API

### Step 2: Create Resumes Table
In the Supabase **SQL Editor**, run:
```sql
-- Create resumes table
CREATE TABLE resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,  -- Auth0 'sub' claim
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  metadata JSONB,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX idx_resumes_user_id ON resumes(user_id);

-- Enable Row Level Security
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
-- Allow users to see only their own resumes
CREATE POLICY "Users can view own resumes" ON resumes
  FOR SELECT USING (auth.uid() = (SELECT auth.uid()));

-- Allow users to insert their own resumes
CREATE POLICY "Users can insert own resumes" ON resumes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete own resumes" ON resumes
  FOR DELETE USING (user_id = auth.uid());
```

### Step 3: Create Storage Bucket
1. Go to **Storage** → Create new bucket
2. Name: `resumes`
3. Set to **Private** (authenticated access only)
4. Create RLS policy:
   ```sql
   CREATE POLICY "Authenticated users can upload their own resumes" ON storage.objects
     FOR INSERT TO authenticated
     WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid());

   CREATE POLICY "Authenticated users can view their own resumes" ON storage.objects
     FOR SELECT TO authenticated
     USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid());
   ```

### Step 4: Environment Variables
Add to `.env.local` and Vercel:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Server-only, never expose
```

**Note**: The Service Role Key should ONLY be set in Vercel environment variables (never in `.env.local` or committed to git).

---

## Part 3: Vercel Deployment

### Step 1: Connect Repository
1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Framework: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Step 2: Environment Variables
In Vercel Project Settings → Environment Variables, add:
```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_AUDIENCE=https://husky-review-api.example.com
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AUTH0_DOMAIN=your-tenant.auth0.com
```

### Step 3: Deploy
```bash
npm run deploy:prod
```

After deployment, update your Auth0 application's **Allowed Callback URLs** with your Vercel domain.

---

## Part 4: Local Development

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create `.env.local`
Copy from `.env.example` and fill in your Auth0 and Supabase credentials:
```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_AUDIENCE=https://husky-review-api.example.com
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 3: Run Development Server
```bash
npm run dev
```

Navigate to `http://localhost:5173` and click "Sign in" to test Auth0 Universal Login.

---

## Part 5: Architecture Overview

### Frontend Flow
1. **Login Page** → User clicks "Continue with Auth0"
2. **Auth0 Universal Login** → Redirects to Auth0, user signs in/up
3. **Redirect** → Back to `/app` with Auth0 session
4. **Protected Routes** → ProtectedRoute component checks `isAuthenticated`
5. **Access Token** → Obtained via `getAccessTokenSilently()` hook
6. **API Calls** → Sent with `Authorization: Bearer {token}` header

### Backend Flow (Vercel Functions)
1. **API Endpoint** receives request with Auth0 token
2. **`requireAuth()`** validates JWT and extracts `user_id` (Auth0 'sub')
3. **Supabase Query** filters by `user_id` (RLS enforces same-user access)
4. **Response** returned to frontend (403 if user doesn't own resource)

### Database Security
- All resume records include `user_id` (Auth0 subject)
- Row-level security policies prevent cross-user access
- Storage bucket policies limit file access to owner
- Service role key only used server-side (never exposed to client)

---

## Part 6: Testing Checklist

### Authentication
- [ ] Unauthenticated users cannot access `/app/*` routes
- [ ] Clicking "Sign in" redirects to Auth0 Universal Login
- [ ] After login, user is redirected to `/app`
- [ ] Logout button appears in authenticated state
- [ ] Marketing pages (`/`, `/privacy`, `/resources`) are accessible without auth

### API Proxy
- [ ] API endpoints require valid Auth0 token
- [ ] Requests without token return 401
- [ ] Expired tokens are properly rejected
- [ ] Token is refreshed automatically when expired

### Resume Storage
- [ ] User can upload a resume
- [ ] Resume appears in "Your Saved Resumes" section
- [ ] Resume can be downloaded/opened
- [ ] Resume can be deleted
- [ ] Deleting doesn't affect other users' resumes
- [ ] Metadata is preserved in Supabase

### Production Build
```bash
npm run build
```
- [ ] Build succeeds without errors
- [ ] No console errors in production build
- [ ] Auth0 config loads correctly from env vars
- [ ] Vercel functions deploy successfully

---

## Part 7: Troubleshooting

### "Authorization header missing" error
**Cause**: API request wasn't sent with Bearer token  
**Fix**: Ensure `getAccessTokenSilently()` is called before making API request

### "Token verification failed" error
**Cause**: Token is invalid or expired  
**Fix**: Check Auth0 configuration, ensure `VITE_AUTH0_AUDIENCE` matches API setting

### "Cannot read properties of undefined (reading 'sub')" on Vercel
**Cause**: `SUPABASE_SERVICE_ROLE_KEY` not set in Vercel env vars  
**Fix**: Add to Vercel Project Settings > Environment Variables

### User redirected to login after sign-in
**Cause**: Auth0 session not persisting  
**Fix**: Verify `Allowed Callback URLs` in Auth0 matches your domain

### RLS policy errors in Supabase
**Cause**: Row-level security policy syntax error  
**Fix**: Check policy syntax, ensure auth.uid() matches your user_id format

---

## Part 8: Security Considerations

1. **Never commit `.env.local`** — add to `.gitignore`
2. **Service Role Key is server-only** — never expose to frontend
3. **Use HTTPS in production** — Auth0 requires secure URLs
4. **Enable CORS selectively** — API routes restrict to your domain
5. **Token expiry** — Auth0 tokens expire; use `getAccessTokenSilently()` for refresh
6. **RLS is required** — Never skip row-level security policies

---

## Resources

- [Auth0 React SDK Docs](https://auth0.com/docs/libraries/auth0-react)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Serverless Functions](https://vercel.com/docs/serverless-functions/introduction)
- [JWT Verification](https://auth0.com/docs/secure/tokens/access-tokens/verify-access-tokens)

---

## Next Steps

1. Set up Auth0 tenant and application
2. Create Supabase project and tables
3. Configure environment variables
4. Test locally with `npm run dev`
5. Deploy to Vercel and update Auth0 callback URLs
6. Verify all acceptance criteria pass
