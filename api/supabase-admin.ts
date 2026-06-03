import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const RESUME_BUCKET = 'resumes';
export const AVATAR_BUCKET = 'avatars';

export interface ResumeRow {
  id: string;
  auth0_user_id: string;
  filename: string;
  storage_path: string;
  content_type: string | null;
  size_bytes: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://husky-review.vercel.app',
];

function getAllowedOrigins(): string[] {
  const raw = process.env.AUTH0_ALLOWED_ORIGINS || process.env.VITE_AUTH0_ALLOWED_ORIGINS || '';
  const configured = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _adminClient: SupabaseClient<any> | null = null;

export function getSupabaseAdmin() {
  if (_adminClient) return _adminClient;

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    const error = new Error('Supabase server configuration is missing');
    (error as any).statusCode = 500;
    throw error;
  }

  _adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return _adminClient;
}

export function setApiHeaders(res: any, methods: string, requestOrigin?: string) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Methods', `${methods},OPTIONS`);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const origin = typeof requestOrigin === 'string' ? requestOrigin : undefined;
  if (origin && getAllowedOrigins().includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
}

export function sendError(res: any, error: unknown) {
  const statusCode = (error as any).statusCode || 500;

  if (statusCode >= 500) {
    console.error('API error:', error);
    return res.status(statusCode).json({ message: 'Internal server error' });
  }

  const message = (error as Error).message || 'Request failed';
  return res.status(statusCode).json({ message });
}

export function sendInternalError(res: any, context: string, cause: unknown) {
  console.error(context, cause);
  return res.status(500).json({ message: 'Internal server error' });
}

function getPostgresErrorCode(cause: unknown): string | undefined {
  if (!cause || typeof cause !== 'object' || !('code' in cause)) {
    return undefined;
  }

  const code = (cause as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function shouldExposeDeletePermissionHint() {
  return process.env.VERCEL_ENV !== 'production';
}

export function sendSupabaseMutationError(res: any, context: string, cause: unknown) {
  console.error(context, cause);

  const code = getPostgresErrorCode(cause);
  const detail =
    cause && typeof cause === 'object' && 'message' in cause && typeof (cause as { message?: unknown }).message === 'string'
      ? (cause as { message: string }).message
      : undefined;

  if (code === '42501') {
    return res.status(500).json({
      message: shouldExposeDeletePermissionHint()
        ? 'Database delete permissions missing — apply migration 20260528000000_fix_reviews_delete.sql'
        : 'Internal server error',
    });
  }

  if (shouldExposeDeletePermissionHint() && detail) {
    return res.status(500).json({ message: `Delete failed: ${detail}` });
  }

  return res.status(500).json({ message: 'Internal server error' });
}

export function getRouteId(req: { query?: Record<string, string | string[] | undefined>; url?: string }) {
  const fromQuery = typeof req.query?.id === 'string' ? req.query.id : req.query?.id?.[0];
  if (fromQuery) {
    return fromQuery;
  }

  const url = req.url || '';
  const match = url.match(/\/api\/(?:resumes|reviews)\/([^/?#]+)/);
  return match?.[1];
}

export function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._=-]/g, '_');
}

export async function createSignedAvatarUrl(supabase: SupabaseClient<any>, storagePath: string | null | undefined) {
  if (!storagePath) {
    return null;
  }

  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(storagePath, 60 * 60);
  if (error) {
    console.warn('Failed to sign avatar URL', { storagePath, error });
    return null;
  }

  return data?.signedUrl || null;
}

export async function attachAvatarUrl(supabase: SupabaseClient<any>, profile: Record<string, unknown> | null) {
  if (!profile) {
    return null;
  }

  const storagePath =
    typeof profile.avatar_storage_path === 'string' ? profile.avatar_storage_path : null;

  return {
    ...profile,
    avatar_url: await createSignedAvatarUrl(supabase, storagePath),
  };
}

export async function withSignedUrl(supabase: SupabaseClient<any>, row: ResumeRow) {
  const { data } = await supabase.storage.from(RESUME_BUCKET).createSignedUrl(row.storage_path, 60 * 10);

  return {
    id: row.id,
    user_id: row.auth0_user_id,
    auth0_user_id: row.auth0_user_id,
    filename: row.filename,
    storage_path: row.storage_path,
    file_url: data?.signedUrl || '',
    download_url: data?.signedUrl || '',
    content_type: row.content_type,
    size_bytes: row.size_bytes,
    metadata: row.metadata || undefined,
    uploaded_at: row.created_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
