import { createClient } from '@supabase/supabase-js';

export const RESUME_BUCKET = 'resumes';

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

let _adminClient: ReturnType<typeof createClient> | null = null;

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

export async function withSignedUrl(supabase: ReturnType<typeof getSupabaseAdmin>, row: ResumeRow) {
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
