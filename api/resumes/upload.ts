import { requireAuth } from '../auth0-verify';
import {
  getSupabaseAdmin,
  RESUME_BUCKET,
  sendError,
  sendInternalError,
  setApiHeaders,
  withSignedUrl,
  type ResumeRow,
} from '../supabase-admin';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_METADATA_BYTES = 8 * 1024;
const MAX_METADATA_KEYS = 20;
const UPLOAD_LIMIT_PER_HOUR = 20;

const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._=|:-]/g, '_');
}

function safeFilename(value: string) {
  const cleaned = value.replace(/[\\/:*?"<>|]/g, '_').trim();
  return cleaned || 'resume';
}

async function assertUploadRateLimit(supabase: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const { data, error } = await supabase
    .from('review_upload_limits')
    .select('window_start, upload_count')
    .eq('auth0_user_id', userId)
    .maybeSingle();

  if (error) {
    return sendRateLimitConfigError(error);
  }

  const windowStart = data?.window_start ? new Date(data.window_start).getTime() : 0;
  const currentCount = data?.upload_count || 0;
  const resetWindow = !windowStart || now - windowStart >= windowMs;

  if (!resetWindow && currentCount >= UPLOAD_LIMIT_PER_HOUR) {
    const error = new Error('Upload limit reached. Try again later.');
    (error as any).statusCode = 429;
    throw error;
  }

  const { error: upsertError } = await supabase.from('review_upload_limits').upsert(
    {
      auth0_user_id: userId,
      window_start: resetWindow ? new Date(now).toISOString() : new Date(windowStart).toISOString(),
      upload_count: resetWindow ? 1 : currentCount + 1,
      updated_at: new Date(now).toISOString(),
    },
    { onConflict: 'auth0_user_id' },
  );

  if (upsertError) {
    return sendRateLimitConfigError(upsertError);
  }
}

function sendRateLimitConfigError(cause: unknown): never {
  console.error('Upload rate limit check failed', cause);
  const error = new Error('Upload rate limiting is not configured');
  (error as any).statusCode = 500;
  throw error;
}

function normalizeContentType(contentType: unknown, filename: string) {
  if (typeof contentType === 'string' && ALLOWED_CONTENT_TYPES.has(contentType)) {
    return contentType;
  }

  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) {
    return 'application/pdf';
  }
  if (lower.endsWith('.doc')) {
    return 'application/msword';
  }
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  return null;
}

function sanitizeMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const entries = Object.entries(metadata as Record<string, unknown>).slice(0, MAX_METADATA_KEYS);
  const sanitized = Object.fromEntries(entries);

  if (JSON.stringify(sanitized).length > MAX_METADATA_BYTES) {
    const error = new Error('Metadata is too large');
    (error as any).statusCode = 400;
    throw error;
  }

  return sanitized;
}

function hasAllowedSignature(buffer: Buffer, contentType: string) {
  const header4 = buffer.subarray(0, 4);
  const header8 = buffer.subarray(0, 8);

  if (contentType === 'application/pdf') {
    return header4.toString() === '%PDF';
  }

  if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return header4[0] === 0x50 && header4[1] === 0x4b && header4[2] === 0x03 && header4[3] === 0x04;
  }

  if (contentType === 'application/msword') {
    return header8.equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  }

  return false;
}

export default async function handler(req: any, res: any) {
  const requestOrigin = req.headers?.origin;
  setApiHeaders(res, 'POST', requestOrigin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await requireAuth(req.headers.authorization);
    const supabase = getSupabaseAdmin();
    await assertUploadRateLimit(supabase, auth.userId);

    const { file, filename, contentType, metadata } = req.body || {};

    if (!file || !filename || typeof filename !== 'string') {
      return res.status(400).json({ message: 'File and filename required' });
    }

    const finalContentType = normalizeContentType(contentType, filename);
    if (!finalContentType) {
      return res.status(400).json({ message: 'Only PDF and Word documents are allowed' });
    }

    const buffer = Buffer.from(file, 'base64');
    if (!buffer.byteLength) {
      return res.status(400).json({ message: 'Uploaded file is empty' });
    }

    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ message: 'File exceeds the 3 MB upload limit' });
    }

    if (!hasAllowedSignature(buffer, finalContentType)) {
      return res.status(400).json({ message: 'File contents do not match the declared resume type' });
    }

    const safeName = safeFilename(filename);
    const storagePath = `${safePathSegment(auth.userId)}/${Date.now()}-${safeName}`;
    const resumeMetadata = sanitizeMetadata(metadata);

    const { error: uploadError } = await supabase.storage.from(RESUME_BUCKET).upload(storagePath, buffer, {
      contentType: finalContentType,
      upsert: false,
    });

    if (uploadError) {
      return sendInternalError(res, 'File upload failed', uploadError);
    }

    const { data: resume, error: dbError } = await supabase
      .from('resumes')
      .insert({
        auth0_user_id: auth.userId,
        filename: safeName,
        storage_path: storagePath,
        content_type: finalContentType,
        size_bytes: buffer.byteLength,
        metadata: resumeMetadata,
      })
      .select('id, auth0_user_id, filename, storage_path, content_type, size_bytes, metadata, created_at, updated_at')
      .single();

    if (dbError) {
      await supabase.storage.from(RESUME_BUCKET).remove([storagePath]);
      return sendInternalError(res, 'Failed to save resume record', dbError);
    }

    return res.status(201).json(await withSignedUrl(supabase, resume as ResumeRow));
  } catch (error) {
    return sendError(res, error);
  }
}
