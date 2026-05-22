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

/** Shared authorization params for Auth0Provider and login redirects */
export function getAuth0ProviderAuthorizationParams() {
  return {
    redirect_uri: AUTH0_CONFIG.redirectUri,
    audience: AUTH0_CONFIG.audience || undefined,
    scope: 'openid profile email',
  };
}

export function getAuth0LoginOptions(returnTo = '/app') {
  return {
    appState: { returnTo },
    authorizationParams: {
      ...getAuth0ProviderAuthorizationParams(),
      connection: AUTH0_CONFIG.connection,
      prompt: 'select_account' as const,
    },
  };
}

/** Auth0 redirects back with ?code=… or ?error=… while the SPA finishes the exchange */
export function getAuth0CallbackSearchParams(search = typeof window !== 'undefined' ? window.location.search : '') {
  const params = new URLSearchParams(search);
  return {
    hasAuthCallback: params.has('code') || params.has('state'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
  };
}

export function formatAuth0CallbackError(error: string | null, errorDescription: string | null): string | null {
  if (!error) {
    return null;
  }

  if (errorDescription) {
    return errorDescription;
  }

  if (error === 'access_denied') {
    return 'Sign-in was denied. Use a @uw.edu Google account to access Husky-Review.';
  }

  return `Sign-in failed (${error}).`;
}

/** Origins that must appear in Auth0 Allowed Logout URLs (exact match for returnTo) */
export function getAllowedOrigins(): string[] {
  const configured = (import.meta.env.VITE_AUTH0_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value: string) => value.trim())
    .filter(Boolean);

  if (typeof window !== 'undefined') {
    return Array.from(new Set([window.location.origin, ...configured]));
  }

  return Array.from(new Set(['http://localhost:5173', ...configured]));
}

export function getLogoutReturnTo(): string {
  const override = import.meta.env.VITE_AUTH0_LOGOUT_URL?.trim();
  if (override) {
    return override;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export function getAuth0LogoutOptions() {
  return {
    logoutParams: {
      returnTo: getLogoutReturnTo(),
    },
  };
}

/**
 * Returns a user-facing message when logout cannot run, or null when OK.
 * Auth0 rejects logout when returnTo is missing from Allowed Logout URLs (often looks like a no-op).
 */
export function validateLogoutReturnTo(): string | null {
  const returnTo = getLogoutReturnTo();

  if (!returnTo) {
    return 'Sign-out is only available in the browser.';
  }

  const allowed = getAllowedOrigins();
  if (!allowed.includes(returnTo)) {
    return `Sign-out URL "${returnTo}" must be listed in Auth0 Allowed Logout URLs. Allowed in this app: ${allowed.join(', ')}.`;
  }

  return null;
}

export function isAuth0Configured() {
  return Boolean(AUTH0_CONFIG.domain && AUTH0_CONFIG.clientId);
}

export function isAllowedEmail(email?: string | null) {
  return Boolean(email?.toLowerCase().endsWith(`@${AUTH0_CONFIG.allowedEmailDomain}`));
}

export function formatAuth0Error(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const authError = error as { error_description?: string; message?: string; error?: string };
  return authError.error_description || authError.message || authError.error || fallback;
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
