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
      sizeLimit: '10mb',
    },
  },
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_METADATA_BYTES = 8 * 1024;
const MAX_METADATA_KEYS = 20;
const UPLOAD_LIMIT_PER_HOUR = 20;

const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const uploadCounts = new Map<string, { count: number; windowStart: number }>();

function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._=|:-]/g, '_');
}

function safeFilename(value: string) {
  const cleaned = value.replace(/[\\/:*?"<>|]/g, '_').trim();
  return cleaned || 'resume';
}

function assertUploadRateLimit(userId: string) {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const entry = uploadCounts.get(userId);

  if (!entry || now - entry.windowStart >= hourMs) {
    uploadCounts.set(userId, { count: 1, windowStart: now });
    return;
  }

  if (entry.count >= UPLOAD_LIMIT_PER_HOUR) {
    const error = new Error('Upload limit reached. Try again later.');
    (error as any).statusCode = 429;
    throw error;
  }

  entry.count += 1;
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
    assertUploadRateLimit(auth.userId);

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
      return res.status(400).json({ message: 'File exceeds the 10 MB upload limit' });
    }

    const safeName = safeFilename(filename);
    const storagePath = `${safePathSegment(auth.userId)}/${Date.now()}-${safeName}`;
    const resumeMetadata = sanitizeMetadata(metadata);

    const supabase = getSupabaseAdmin();
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
