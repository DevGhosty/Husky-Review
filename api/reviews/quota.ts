import { requireAuth } from '../auth0-verify.js';
import { deterministicQuotaStatus, getAppGeminiKey, getAppKeyQuotaStatus } from '../review-quota.js';
import { getSupabaseAdmin, sendError, setApiHeaders } from '../supabase-admin.js';

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

    if (!getAppGeminiKey()) {
      return res.status(200).json(deterministicQuotaStatus());
    }

    const quota = await getAppKeyQuotaStatus(getSupabaseAdmin(), auth.userId);
    return res.status(200).json(quota);
  } catch (error) {
    return sendError(res, error);
  }
}
