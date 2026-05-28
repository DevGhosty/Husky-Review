import type { getSupabaseAdmin } from './supabase-admin.js';

export const WEEKLY_APP_KEY_REVIEW_LIMIT = 2;

export interface ReviewQuotaStatus {
  source: 'app-key' | 'user-key' | 'deterministic';
  limit: number;
  remaining: number | null;
  resetAt: string | null;
}

export function getAppGeminiKey() {
  return process.env.GEMINI_API_KEY?.trim() || '';
}

function quotaLimitError(resetAt?: string) {
  const resetLabel = resetAt ? new Date(resetAt).toLocaleDateString('en-US') : 'next week';
  const error = new Error(`Weekly app-key review limit reached. Try again after ${resetLabel}.`);
  (error as any).statusCode = 429;
  throw error;
}

function quotaCheckError(cause: unknown): never {
  console.error('Failed to check review quota', cause);
  const error = new Error('Failed to check review quota');
  (error as any).statusCode = 500;
  throw error;
}

function toQuotaStatus(quota: any): ReviewQuotaStatus {
  return {
    source: 'app-key',
    limit: WEEKLY_APP_KEY_REVIEW_LIMIT,
    remaining: typeof quota?.remaining === 'number' ? quota.remaining : null,
    resetAt: quota?.reset_at || null,
  };
}

function getQuotaRow(data: unknown) {
  return Array.isArray(data) ? data[0] : data;
}

export function deterministicQuotaStatus(): ReviewQuotaStatus {
  return {
    source: 'deterministic',
    limit: 0,
    remaining: null,
    resetAt: null,
  };
}

export function userKeyQuotaStatus(): ReviewQuotaStatus {
  return {
    source: 'user-key',
    limit: 0,
    remaining: null,
    resetAt: null,
  };
}

export async function checkAppKeyQuota(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
): Promise<ReviewQuotaStatus> {
  const { data, error } = await supabase.rpc('check_weekly_review_quota', {
    p_auth0_user_id: userId,
    p_limit: WEEKLY_APP_KEY_REVIEW_LIMIT,
  });

  if (error) {
    return quotaCheckError(error);
  }

  const quota = getQuotaRow(data);
  if (!quota?.allowed) {
    quotaLimitError(quota?.reset_at);
  }

  return toQuotaStatus(quota);
}

export async function getAppKeyQuotaStatus(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
): Promise<ReviewQuotaStatus> {
  const { data, error } = await supabase.rpc('check_weekly_review_quota', {
    p_auth0_user_id: userId,
    p_limit: WEEKLY_APP_KEY_REVIEW_LIMIT,
  });

  if (error) {
    return quotaCheckError(error);
  }

  return toQuotaStatus(getQuotaRow(data));
}

export async function consumeAppKeyQuota(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
): Promise<ReviewQuotaStatus> {
  const { data, error } = await supabase.rpc('consume_weekly_review_quota', {
    p_auth0_user_id: userId,
    p_limit: WEEKLY_APP_KEY_REVIEW_LIMIT,
  });

  if (error) {
    return quotaCheckError(error);
  }

  const quota = getQuotaRow(data);
  if (!quota?.allowed) {
    quotaLimitError(quota?.reset_at);
  }

  return toQuotaStatus(quota);
}
