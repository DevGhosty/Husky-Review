import type { GetTokenSilentlyOptions } from '@auth0/auth0-react';
import { getAccessTokenRequestOptions } from './auth0-config';

const RETRY_DELAY_MS = 150;

function isRetriableAuth0TokenError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const authError = error as { error?: string; message?: string };
  const code = authError.error || '';
  const message = (authError.message || '').toLowerCase();

  return (
    code === 'login_required' ||
    code === 'consent_required' ||
    code === 'timeout' ||
    message.includes('timeout') ||
    message.includes('missing refresh token')
  );
}

/**
 * Fetches an API access token (with audience when configured).
 * Retries once with a fresh cache read — first call after login often needs this.
 */
export async function getApiAccessToken(
  getAccessTokenSilently: (options?: GetTokenSilentlyOptions) => Promise<string>,
): Promise<string> {
  const baseOptions = getAccessTokenRequestOptions();
  const attempts: GetTokenSilentlyOptions[] = [
    baseOptions,
    { ...baseOptions, cacheMode: 'off' },
  ];

  let lastError: unknown;

  for (let index = 0; index < attempts.length; index += 1) {
    try {
      return await getAccessTokenSilently(attempts[index]);
    } catch (error) {
      lastError = error;
      const shouldRetry = index < attempts.length - 1 && isRetriableAuth0TokenError(error);
      if (!shouldRetry) {
        break;
      }
      await new Promise((resolve) => window.setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw lastError;
}
