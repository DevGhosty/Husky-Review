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

/** Base params for Auth0Provider (no audience — avoids hanging session checks on /app) */
export function getAuth0ProviderAuthorizationParams() {
  return {
    redirect_uri: AUTH0_CONFIG.redirectUri,
    scope: 'openid profile email',
  };
}

/** Params when requesting an API access token (resume routes require audience + email claims) */
export function getAccessTokenRequestOptions() {
  if (!AUTH0_CONFIG.audience) {
    return {};
  }

  return {
    authorizationParams: {
      audience: AUTH0_CONFIG.audience,
    },
  };
}

export function getAuth0LoginOptions(returnTo = '/app') {
  return {
    appState: { returnTo },
    authorizationParams: {
      ...getAuth0ProviderAuthorizationParams(),
      audience: AUTH0_CONFIG.audience || undefined,
      connection: AUTH0_CONFIG.connection,
      prompt: 'select_account' as const,
    },
  };
}

const AUTH_NOTICE_STORAGE_KEY = 'husky_review_auth_notice';

/** Auth0 redirects back with ?code=… on success or ?error=… when login is denied */
export function getAuth0CallbackSearchParams(search = typeof window !== 'undefined' ? window.location.search : '') {
  const params = new URLSearchParams(search);
  const error = params.get('error');
  return {
    hasAuthCallback: params.has('code'),
    hasAuthError: Boolean(error),
    error,
    errorDescription: params.get('error_description'),
  };
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  uw_email_required: 'Use a @uw.edu Google account to access Husky-Review.',
  google_required: 'Use Google sign-in to access Husky-Review.',
};

export function formatAuth0CallbackError(error: string | null, errorDescription: string | null): string | null {
  if (!error) {
    return null;
  }

  if (errorDescription) {
    const mapped = AUTH_ERROR_MESSAGES[errorDescription];
    if (mapped) {
      return mapped;
    }
    if (!errorDescription.includes('_')) {
      return errorDescription;
    }
  }

  if (error === 'access_denied') {
    return 'Sign-in was denied. Use a @uw.edu Google account to access Husky-Review.';
  }

  return `Sign-in failed (${error}).`;
}

const AUTH_CALLBACK_PARAMS = ['code', 'state', 'error', 'error_description'] as const;

/** Strip Auth0 callback params and keep only in-app paths. */
export function sanitizeAppReturnTo(path: string): string {
  try {
    const url = new URL(path, 'https://husky-review.local');
    for (const key of AUTH_CALLBACK_PARAMS) {
      url.searchParams.delete(key);
    }
    url.searchParams.delete('setup');
    url.searchParams.delete('returnTo');
    const search = url.searchParams.toString();
    const normalized = `${url.pathname}${search ? `?${search}` : ''}${url.hash}`;
    return normalized.startsWith('/app') ? normalized : '/app';
  } catch {
    return path.startsWith('/app') ? path : '/app';
  }
}

export function buildAppReturnTo(pathname: string, search: string, hash: string): string {
  const params = new URLSearchParams(search);
  for (const key of AUTH_CALLBACK_PARAMS) {
    params.delete(key);
  }
  params.delete('setup');
  params.delete('returnTo');
  const cleanSearch = params.toString();
  return sanitizeAppReturnTo(`${pathname}${cleanSearch ? `?${cleanSearch}` : ''}${hash}`);
}

export function stashAuthNotice(message: string) {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.setItem(AUTH_NOTICE_STORAGE_KEY, message);
}

export function consumeAuthNotice(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const message = sessionStorage.getItem(AUTH_NOTICE_STORAGE_KEY);
  if (message) {
    sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
  }
  return message;
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

