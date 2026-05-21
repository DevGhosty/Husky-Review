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

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const error = new Error('Supabase server configuration is missing');
    (error as any).statusCode = 500;
    throw error;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export function setApiHeaders(res: any, methods: string) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', `${methods},OPTIONS`);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function sendError(res: any, error: unknown) {
  const statusCode = (error as any).statusCode || 500;
  const message = (error as Error).message || 'Internal server error';
  return res.status(statusCode).json({ message });
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
