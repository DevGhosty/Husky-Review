import { requireAuth } from '../auth0-verify.js';
import { getSupabaseAdmin, getRouteId, sendError, sendInternalError, sendSupabaseMutationError, setApiHeaders } from '../supabase-admin.js';

function getReviewId(req: { query?: Record<string, string | string[] | undefined>; url?: string }) {
  return getRouteId(req);
}

function applySelectedIds(analysis: any, selectedIds: string[]) {
  return {
    ...analysis,
    selectedIds,
    recommendations: (analysis.recommendations || []).map((recommendation: any) => ({
      ...recommendation,
      selected: selectedIds.includes(recommendation.id),
    })),
  };
}

export default async function handler(req: any, res: any) {
  setApiHeaders(res, 'GET,PATCH,DELETE', req.headers?.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'PATCH' && req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await requireAuth(req.headers.authorization);
    const id = getReviewId(req);
    if (!id) {
      return res.status(400).json({ message: 'Review ID required' });
    }

    const supabase = getSupabaseAdmin();
    const { data: review, error: findError } = await supabase
      .from('reviews')
      .select('id, auth0_user_id, analysis, selected_recommendation_ids, created_at, updated_at')
      .eq('id', id)
      .eq('auth0_user_id', auth.userId)
      .maybeSingle();

    if (findError) {
      return sendInternalError(res, 'Failed to fetch review', findError);
    }

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (req.method === 'GET') {
      return res.status(200).json(
        applySelectedIds(
          {
            ...(review as any).analysis,
            createdAt: (review as any).created_at,
            updatedAt: (review as any).updated_at,
          },
          (review as any).selected_recommendation_ids || [],
        ),
      );
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('reviews').delete().eq('id', id).eq('auth0_user_id', auth.userId);
      if (error) {
        return sendSupabaseMutationError(res, 'Failed to delete review', error);
      }
      return res.status(204).end();
    }

    const selectedIds = Array.isArray(req.body?.selectedIds)
      ? req.body.selectedIds.filter((value: unknown) => typeof value === 'string').slice(0, 20)
      : null;

    if (!selectedIds) {
      return res.status(400).json({ message: 'selectedIds array required' });
    }

    const nextAnalysis = applySelectedIds((review as any).analysis, selectedIds);
    const { data: updated, error: updateError } = await supabase
      .from('reviews')
      .update({
        selected_recommendation_ids: selectedIds,
        analysis: nextAnalysis,
      })
      .eq('id', id)
      .eq('auth0_user_id', auth.userId)
      .select('updated_at')
      .single();

    if (updateError) {
      return sendInternalError(res, 'Failed to update review selections', updateError);
    }

    const { error: recommendationError } = await supabase
      .from('review_recommendations')
      .update({ selected: false })
      .eq('review_id', id);

    if (recommendationError) {
      return sendInternalError(res, 'Failed to clear recommendation selections', recommendationError);
    }

    if (selectedIds.length) {
      const { error: selectedError } = await supabase
        .from('review_recommendations')
        .update({ selected: true })
        .eq('review_id', id)
        .in('id', selectedIds);

      if (selectedError) {
        return sendInternalError(res, 'Failed to save recommendation selections', selectedError);
      }
    }

    return res.status(200).json({
      ...nextAnalysis,
      updatedAt: updated?.updated_at || new Date().toISOString(),
    });
  } catch (error) {
    return sendError(res, error);
  }
}
