import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_MODEL = 'gemini-2.5-flash-lite';

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
    return res.status(200).json({ ok: false, stage: 'env', error: 'GEMINI_API_KEY not set' });
  }

  const listResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
  );

  if (!listResponse.ok) {
    const body = await listResponse.text();
    return res.status(200).json({
      ok: false,
      stage: 'list-models',
      httpStatus: listResponse.status,
      error: body.replace(/\s+/g, ' ').slice(0, 200),
    });
  }

  const listData: any = await listResponse.json();
  const models: string[] = (listData?.models ?? [])
    .slice(0, 5)
    .map((model: any) => model?.name ?? '');

  const generateResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Return {"ok":true}' }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  const generateData: any = await generateResponse.json().catch(() => null);
  const candidate = generateData?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text || '';
  const finishReason = candidate?.finishReason || null;
  let parseOk = false;
  let parseError: string | null = null;

  if (generateResponse.ok && text.trim()) {
    try {
      JSON.parse(text);
      parseOk = true;
    } catch (error) {
      parseError = (error as Error).message;
    }
  }

  if (!generateResponse.ok) {
    return res.status(200).json({
      ok: false,
      stage: 'generate-content',
      httpStatus: generateResponse.status,
      models,
      error: JSON.stringify(generateData?.error || generateData).replace(/\s+/g, ' ').slice(0, 240),
    });
  }

  return res.status(200).json({
    ok: parseOk,
    stage: parseOk ? 'ready' : 'invalid-json',
    httpStatus: generateResponse.status,
    models,
    model: GEMINI_MODEL,
    finishReason,
    textLength: text.length,
    parseError,
  });
}
