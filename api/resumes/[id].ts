import { requireAuth } from '../auth0-verify.js';
import { getSupabaseAdmin, RESUME_BUCKET, sendError, sendInternalError, setApiHeaders, withSignedUrl, type ResumeRow } from '../supabase-admin.js';

export default async function handler(req: any, res: any) {
  setApiHeaders(res, 'GET,DELETE', req.headers?.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await requireAuth(req.headers.authorization);
    const id = typeof req.query.id === 'string' ? req.query.id : req.query.id?.[0];

    if (!id) {
      return res.status(400).json({ message: 'Resume ID required' });
    }

    const supabase = getSupabaseAdmin();
    const { data: resume, error: findError } = await supabase
      .from('resumes')
      .select('id, auth0_user_id, filename, storage_path, content_type, size_bytes, metadata, created_at, updated_at')
      .eq('id', id)
      .eq('auth0_user_id', auth.userId)
      .maybeSingle();

    if (findError) {
      return sendInternalError(res, 'Failed to fetch resume', findError);
    }

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (req.method === 'GET') {
      return res.status(200).json(await withSignedUrl(supabase, resume as ResumeRow));
    }

    const { error: dbError } = await supabase.from('resumes').delete().eq('id', id).eq('auth0_user_id', auth.userId);

    if (dbError) {
      return sendInternalError(res, 'Failed to delete resume', dbError);
    }

    await supabase.storage.from(RESUME_BUCKET).remove([(resume as ResumeRow).storage_path]);
    return res.status(204).end();
  } catch (error) {
    return sendError(res, error);
  }
}
