import {
  orphanRetentionCutoffIso,
  parseOrphanRetentionHours,
  selectOrphanResumesForPurge,
} from '../resume-retention.js';
import { getSupabaseAdmin, RESUME_BUCKET, sendError, sendInternalError } from '../supabase-admin.js';

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

    const retentionHours = parseOrphanRetentionHours(process.env.RESUME_ORPHAN_RETENTION_HOURS);
    const cutoff = orphanRetentionCutoffIso(Date.now(), retentionHours);
    const supabase = getSupabaseAdmin();

    const { data: expired, error: fetchError } = await supabase
      .from('resumes')
      .select('id, storage_path')
      .lt('created_at', cutoff);

    if (fetchError) {
      return sendInternalError(res, 'Failed to list expired resumes', fetchError);
    }

    const { data: linkedReviews, error: linkedError } = await supabase
      .from('reviews')
      .select('resume_id')
      .not('resume_id', 'is', null);

    if (linkedError) {
      return sendInternalError(res, 'Failed to list linked review resumes', linkedError);
    }

    const linkedResumeIds = (linkedReviews || [])
      .map((row) => row.resume_id)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);

    const rows = selectOrphanResumesForPurge(expired || [], linkedResumeIds);
    if (!rows.length) {
      return res.status(200).json({
        purged: 0,
        storageRemoved: 0,
        skippedLinked: (expired || []).length,
        cutoff,
        retentionHours,
      });
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
      skippedLinked: (expired || []).length - rows.length,
      cutoff,
      retentionHours,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
