import { getSupabaseAdmin, RESUME_BUCKET, sendError, sendInternalError } from '../supabase-admin.js';

const RETENTION_MS = 60 * 60 * 1000;

function assertCronAuth(authHeader?: string) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    const error = new Error('Cron secret is not configured');
    (error as any).statusCode = 500;
    throw error;
  }

  const [scheme, token] = authHeader?.split(' ') ?? [];
  if (scheme !== 'Bearer' || token !== secret) {
    const error = new Error('Unauthorized');
    (error as any).statusCode = 401;
    throw error;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    assertCronAuth(req.headers?.authorization);

    const cutoff = new Date(Date.now() - RETENTION_MS).toISOString();
    const supabase = getSupabaseAdmin();

    const { data: expired, error: fetchError } = await supabase
      .from('resumes')
      .select('id, storage_path')
      .lt('created_at', cutoff);

    if (fetchError) {
      return sendInternalError(res, 'Failed to list expired resumes', fetchError);
    }

    const rows = expired || [];
    if (!rows.length) {
      return res.status(200).json({ purged: 0, storageRemoved: 0 });
    }

    const storagePaths = rows.map((row) => row.storage_path).filter(Boolean);
    if (storagePaths.length) {
      const { error: storageError } = await supabase.storage.from(RESUME_BUCKET).remove(storagePaths);
      if (storageError) {
        return sendInternalError(res, 'Failed to remove expired resume files', storageError);
      }
    }

    const ids = rows.map((row) => row.id);
    const { error: deleteError } = await supabase.from('resumes').delete().in('id', ids);

    if (deleteError) {
      return sendInternalError(res, 'Failed to delete expired resume records', deleteError);
    }

    return res.status(200).json({
      purged: ids.length,
      storageRemoved: storagePaths.length,
      cutoff,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
