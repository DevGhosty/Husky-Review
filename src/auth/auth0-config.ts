/**
 * Auth0 configuration for Husky-Review
 * Uses environment variables for sensitive credentials
 */

export const AUTH0_CONFIG = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || '',
  connection: 'google-oauth2',
  allowedEmailDomain: 'uw.edu',
  redirectUri:
    typeof window !== 'undefined' ? `${window.location.origin}/app` : import.meta.env.VITE_AUTH0_CALLBACK_URL || '',
};

export function getAuth0LoginOptions(returnTo = '/app') {
  return {
    appState: { returnTo },
    authorizationParams: {
      prompt: 'select_account' as const,
    },
  };
}

export function isAllowedEmail(email?: string | null) {
  return Boolean(email?.toLowerCase().endsWith(`@${AUTH0_CONFIG.allowedEmailDomain}`));
}

/**
 * Supabase configuration for backend storage
 */
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

/**
 * API routes (same-origin proxy)
 */
export const API_ROUTES = {
  token: '/api/auth/token',
  resumeList: '/api/resumes',
  resumeDetail: (id: string) => `/api/resumes/${id}`,
  resumeUpload: '/api/resumes/upload',
};
