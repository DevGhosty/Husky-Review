import { requireAuth } from './auth0-verify';
import { getSupabaseAdmin, sendError, sendInternalError, setApiHeaders } from './supabase-admin';

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
      .from('reviews')
      .select('id, title, role, deadline, match_score, selected_recommendation_ids, created_at, updated_at, resumes(filename)')
      .eq('auth0_user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return sendInternalError(res, 'Failed to fetch reviews', error);
    }

    return res.status(200).json(
      (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        role: row.role,
        deadline: row.deadline || '',
        score: row.match_score,
        selectedCount: row.selected_recommendation_ids?.length || 0,
        resumeFilename: row.resumes?.filename || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    );
  } catch (error) {
    return sendError(res, error);
  }
}
