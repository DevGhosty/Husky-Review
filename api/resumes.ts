import { requireAuth } from './auth0-verify.js';
import { getSupabaseAdmin, sendError, sendInternalError, setApiHeaders, withSignedUrl, type ResumeRow } from './supabase-admin.js';

export default async function handler(req: any, res: any) {
  setApiHeaders(res, 'GET', req.headers?.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await requireAuth(req.headers.authorization);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('resumes')
      .select('id, auth0_user_id, filename, storage_path, content_type, size_bytes, metadata, created_at, updated_at')
      .eq('auth0_user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return sendInternalError(res, 'Failed to fetch resumes', error);
    }

    const resumes = await Promise.all(((data || []) as ResumeRow[]).map((row) => withSignedUrl(supabase, row)));
    return res.status(200).json(resumes);
  } catch (error) {
    return sendError(res, error);
  }
}
