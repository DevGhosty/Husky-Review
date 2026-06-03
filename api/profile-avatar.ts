import { requireAuth } from './auth0-verify.js';
import {
  AVATAR_BUCKET,
  createSignedAvatarUrl,
  getSupabaseAdmin,
  safePathSegment,
  sendError,
  sendInternalError,
  setApiHeaders,
} from './supabase-admin.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '3mb',
    },
  },
};

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function safeFilename(value: string) {
  const cleaned = value.replace(/[\\/:*?"<>|]/g, '_').trim();
  return cleaned || 'avatar';
}

function extensionForContentType(contentType: string) {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'jpg';
}

function normalizeContentType(contentType: unknown, filename: string) {
  if (typeof contentType === 'string' && ALLOWED_CONTENT_TYPES.has(contentType)) {
    return contentType;
  }

  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return null;
}

function hasAllowedImageSignature(buffer: Buffer, contentType: string) {
  if (contentType === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (contentType === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  if (contentType === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString() === 'RIFF' &&
      buffer.subarray(8, 12).toString() === 'WEBP'
    );
  }

  return false;
}

async function removeAvatarObject(supabase: ReturnType<typeof getSupabaseAdmin>, storagePath: string | null | undefined) {
  if (!storagePath) {
    return;
  }

  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
  if (error) {
    console.warn('Failed to remove previous avatar object', { storagePath, error });
  }
}

async function readProfileAvatarPath(supabase: ReturnType<typeof getSupabaseAdmin>, auth0UserId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_storage_path')
    .eq('auth0_user_id', auth0UserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return typeof data?.avatar_storage_path === 'string' ? data.avatar_storage_path : null;
}

export default async function handler(req: any, res: any) {
  const requestOrigin = req.headers?.origin;
  setApiHeaders(res, 'POST,DELETE', requestOrigin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await requireAuth(req.headers.authorization);
    const supabase = getSupabaseAdmin();

    if (req.method === 'DELETE') {
      const previousPath = await readProfileAvatarPath(supabase, auth.userId);
      await removeAvatarObject(supabase, previousPath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_storage_path: null })
        .eq('auth0_user_id', auth.userId);

      if (updateError) {
        return sendInternalError(res, 'Failed to clear profile avatar', updateError);
      }

      return res.status(200).json({ avatar_url: null });
    }

    const { file, filename, contentType } = req.body || {};
    if (!file || !filename || typeof filename !== 'string') {
      return res.status(400).json({ message: 'File and filename required' });
    }

    const finalContentType = normalizeContentType(contentType, filename);
    if (!finalContentType) {
      return res.status(400).json({ message: 'Only JPEG, PNG, and WebP images are allowed' });
    }

    const buffer = Buffer.from(file, 'base64');
    if (!buffer.byteLength) {
      return res.status(400).json({ message: 'Uploaded image is empty' });
    }

    if (buffer.byteLength > MAX_AVATAR_BYTES) {
      return res.status(400).json({ message: 'Image exceeds the 2 MB upload limit' });
    }

    if (!hasAllowedImageSignature(buffer, finalContentType)) {
      return res.status(400).json({ message: 'Image contents do not match the declared file type' });
    }

    const previousPath = await readProfileAvatarPath(supabase, auth.userId);
    const storagePath = `${safePathSegment(auth.userId)}/avatar.${extensionForContentType(finalContentType)}`;

    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(storagePath, buffer, {
      contentType: finalContentType,
      upsert: true,
    });

    if (uploadError) {
      return sendInternalError(res, 'Avatar upload failed', uploadError);
    }

    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ avatar_storage_path: storagePath })
      .eq('auth0_user_id', auth.userId)
      .select('auth0_user_id')
      .maybeSingle();

    if (profileUpdateError) {
      await removeAvatarObject(supabase, storagePath);
      return sendInternalError(res, 'Failed to save profile avatar', profileUpdateError);
    }

    if (!updatedProfile) {
      const { error: profileInsertError } = await supabase.from('profiles').insert({
        auth0_user_id: auth.userId,
        avatar_storage_path: storagePath,
      });

      if (profileInsertError) {
        await removeAvatarObject(supabase, storagePath);
        return sendInternalError(res, 'Failed to save profile avatar', profileInsertError);
      }
    }

    if (previousPath && previousPath !== storagePath) {
      await removeAvatarObject(supabase, previousPath);
    }

    const avatarUrl = await createSignedAvatarUrl(supabase, storagePath);
    return res.status(200).json({ avatar_url: avatarUrl });
  } catch (error) {
    return sendError(res, error);
  }
}
