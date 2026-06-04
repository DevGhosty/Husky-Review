import { isValidGeminiApiKey, normalizeGeminiApiKey, verifyGeminiApiKey } from './gemini-api.js';
import { requireAuth } from './auth0-verify.js';
import { sendError, setApiHeaders } from './supabase-admin.js';

export default async function handler(req: any, res: any) {
  setApiHeaders(res, 'POST', req.headers?.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await requireAuth(req.headers.authorization);

    const userApiKey = normalizeGeminiApiKey(req.body?.userApiKey);
    if (!userApiKey) {
      return res.status(400).json({ message: 'Paste your Gemini API key before testing.' });
    }

    if (!isValidGeminiApiKey(userApiKey)) {
      return res.status(400).json({
        message: 'Enter a valid Gemini API key from Google AI Studio (aistudio.google.com/apikey).',
      });
    }

    const result = await verifyGeminiApiKey(userApiKey);
    if (!result.ok) {
      return res.status(400).json({
        ok: false,
        keySource: 'user',
        message: result.message,
      });
    }

    return res.status(200).json({
      ok: true,
      keySource: 'user',
      model: result.model,
      message: `Connected to Gemini (${result.model}). Check AI Studio usage for that model after this test.`,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
