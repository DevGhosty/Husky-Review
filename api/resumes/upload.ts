import { requireAuth } from '../auth0-verify';
import { getSupabaseAdmin, RESUME_BUCKET, sendError, setApiHeaders, withSignedUrl, type ResumeRow } from '../supabase-admin';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._=|:-]/g, '_');
}

function safeFilename(value: string) {
  const cleaned = value.replace(/[\\/:*?"<>|]/g, '_').trim();
  return cleaned || 'resume';
}

export default async function handler(req: any, res: any) {
  setApiHeaders(res, 'POST');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await requireAuth(req.headers.authorization);
    const { file, filename, contentType, sizeBytes, metadata } = req.body || {};

    if (!file || !filename) {
      return res.status(400).json({ message: 'File and filename required' });
    }

    const supabase = getSupabaseAdmin();
    const buffer = Buffer.from(file, 'base64');
    const finalContentType = typeof contentType === 'string' && contentType ? contentType : 'application/octet-stream';
    const storagePath = `${safePathSegment(auth.userId)}/${Date.now()}-${safeFilename(filename)}`;

    const { error: uploadError } = await supabase.storage.from(RESUME_BUCKET).upload(storagePath, buffer, {
      contentType: finalContentType,
      upsert: false,
    });

    if (uploadError) {
      return res.status(500).json({ message: 'File upload failed', error: uploadError.message });
    }

    const { data: resume, error: dbError } = await supabase
      .from('resumes')
      .insert({
        auth0_user_id: auth.userId,
        filename,
        storage_path: storagePath,
        content_type: finalContentType,
        size_bytes: typeof sizeBytes === 'number' ? sizeBytes : buffer.byteLength,
        metadata: metadata || {},
      })
      .select('id, auth0_user_id, filename, storage_path, content_type, size_bytes, metadata, created_at, updated_at')
      .single();

    if (dbError) {
      await supabase.storage.from(RESUME_BUCKET).remove([storagePath]);
      return res.status(500).json({ message: 'Failed to save resume record', error: dbError.message });
    }

    return res.status(201).json(await withSignedUrl(supabase, resume as ResumeRow));
  } catch (error) {
    return sendError(res, error);
  }
}
