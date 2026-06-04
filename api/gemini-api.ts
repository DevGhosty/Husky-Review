export const GEMINI_MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'] as const;
export const GEMINI_MODEL = GEMINI_MODEL_CANDIDATES[0];
export const GEMINI_STRUCTURED_JSON_MAX_OUTPUT_TOKENS = 4096;
export const GEMINI_STRUCTURED_JSON_RETRY_MAX_OUTPUT_TOKENS = 8192;

export function structuredJsonGenerationConfig(model: string, maxOutputTokens: number) {
  const config: Record<string, unknown> = {
    temperature: 0.2,
    maxOutputTokens,
    responseMimeType: 'application/json',
  };

  // 2.5 models count "thinking" tokens against maxOutputTokens, which truncates JSON early.
  if (/gemini-2\.5/i.test(model)) {
    config.thinkingConfig = { thinkingBudget: 0 };
  }

  return config;
}

export type GeminiKeySource = 'user' | 'app' | 'none';

export function resolveGeminiApiKey(
  input: { geminiApiKey?: string; apiKeySource?: 'app-key' | 'user-key' },
  appKey = process.env.GEMINI_API_KEY?.trim() || '',
): { apiKey: string; keySource: GeminiKeySource } {
  const userKey = input.geminiApiKey?.trim() || '';

  if (input.apiKeySource === 'user-key') {
    return userKey ? { apiKey: userKey, keySource: 'user' } : { apiKey: '', keySource: 'none' };
  }

  if (userKey) {
    return { apiKey: userKey, keySource: 'user' };
  }

  if (appKey) {
    return { apiKey: appKey, keySource: 'app' };
  }

  return { apiKey: '', keySource: 'none' };
}

export async function verifyGeminiApiKey(apiKey: string): Promise<
  | { ok: true; model: string }
  | { ok: false; message: string }
> {
  let lastMessage = 'No supported Gemini model responded for this API key.';

  for (const model of GEMINI_MODEL_CANDIDATES) {
    const body = {
      contents: [{ role: 'user', parts: [{ text: 'Reply with the JSON object {"ok":true} only.' }] }],
      generationConfig: structuredJsonGenerationConfig(model, 256),
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
      },
    );

    if (response.ok) {
      return { ok: true, model };
    }

    const errorText = await response.text();
    lastMessage = parseGeminiHttpError(response.status, errorText);
    if (!isGeminiModelUnavailable(response.status, errorText)) {
      return { ok: false, message: lastMessage };
    }
  }

  return { ok: false, message: lastMessage };
}

export function normalizeGeminiApiKey(raw: unknown): string {
  if (typeof raw !== 'string') {
    return '';
  }

  let value = raw.trim();
  if (!value) {
    return '';
  }

  if (value.toLowerCase().startsWith('bearer ')) {
    value = value.slice(7).trim();
  }

  value = value.replace(/^['"]|['"]$/g, '').trim();
  return value;
}

export function isValidGeminiApiKey(value: string): boolean {
  const key = value.trim();
  if (key.length < 20 || key.length > 256) {
    return false;
  }

  // Google AI Studio keys: legacy AIzaSy… or newer AQ.… (includes a dot).
  if (/^AIza[A-Za-z0-9_-]{16,}$/.test(key)) {
    return true;
  }
  if (/^AQ\.[A-Za-z0-9._-]{10,}$/.test(key)) {
    return true;
  }

  return /^[A-Za-z0-9._-]{20,}$/.test(key);
}

export function parseGeminiHttpError(status: number, errorText: string): string {
  try {
    const parsed = JSON.parse(errorText) as { error?: { message?: string; status?: string } };
    const message = parsed?.error?.message?.trim();
    if (message) {
      if (/API key not valid|API_KEY_INVALID|invalid api key/i.test(message)) {
        return 'Gemini rejected this API key. Create one at Google AI Studio (aistudio.google.com/apikey), not a Google Cloud console key.';
      }
      if (/permission|PERMISSION_DENIED|Generative Language API/i.test(message)) {
        return 'This API key cannot access the Gemini API. Enable the Generative Language API for the key’s Google Cloud project, or create a new key in Google AI Studio.';
      }
      if (/quota|RESOURCE_EXHAUSTED|rate limit/i.test(message)) {
        return 'Gemini rate limit or quota exceeded for this API key. Try again later or check billing in Google AI Studio.';
      }
      return message;
    }
  } catch {
    // Fall through to status-based messages.
  }

  if (status === 400) {
    return 'Gemini rejected the request. Confirm your key is from Google AI Studio (aistudio.google.com/apikey).';
  }
  if (status === 403) {
    return 'Gemini API key was denied. Use a key from Google AI Studio (aistudio.google.com/apikey).';
  }
  if (status === 404) {
    return 'Gemini model is unavailable for this API key. Try again later or contact support.';
  }
  if (status === 429) {
    return 'Gemini rate limit exceeded for this API key. Wait a few minutes and try again.';
  }

  return `Gemini request failed (HTTP ${status}).`;
}

export function isGeminiModelUnavailable(status: number, errorText: string): boolean {
  if (status === 404) {
    return true;
  }

  return /not found|NOT_FOUND|is not supported|unsupported model/i.test(errorText);
}
