import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers['authorization'] ?? '';
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(200).json({ ok: false, error: 'GEMINI_API_KEY not set' });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
  );

  if (!response.ok) {
    const body = await response.text();
    return res.status(200).json({
      ok: false,
      httpStatus: response.status,
      error: body.replace(/\s+/g, ' ').slice(0, 200),
    });
  }

  const data: any = await response.json();
  const models: string[] = (data?.models ?? [])
    .slice(0, 5)
    .map((m: any) => m?.name ?? '');

  return res.status(200).json({ ok: true, httpStatus: response.status, models });
}
