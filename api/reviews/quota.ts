import { requireAuth } from '../auth0-verify';
import { deterministicQuotaStatus, getAppAnthropicKey, getAppKeyQuotaStatus } from '../review-quota';
import { getSupabaseAdmin, sendError, setApiHeaders } from '../supabase-admin';

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

    if (!getAppAnthropicKey()) {
      return res.status(200).json(deterministicQuotaStatus());
    }

    const quota = await getAppKeyQuotaStatus(getSupabaseAdmin(), auth.userId);
    return res.status(200).json(quota);
  } catch (error) {
    return sendError(res, error);
  }
}
