/**
 * Vercel serverless function for resume uploads
 * Path: /api/resumes/upload
 * 
 * POST /api/resumes/upload - Upload a resume file and save metadata
 */

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../auth0-verify';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: { persistSession: false },
  }
);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 10MB max file size
    },
  },
};

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await requireAuth(req.headers.authorization);

    // Parse multipart form data (simplified - in production use busboy or formidable)
    // For this implementation, we'll expect JSON with base64-encoded file
    const { file, filename, metadata } = req.body;

    if (!file || !filename) {
      return res.status(400).json({ message: 'File and filename required' });
    }

    // Decode base64 file
    const buffer = Buffer.from(file, 'base64');

    // Upload to Supabase Storage
    const uniqueFilename = `${auth.userId}/${Date.now()}-${filename}`;
    const { error: uploadError, data } = await supabase.storage
      .from('resumes')
      .upload(uniqueFilename, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({ message: 'File upload failed', error: uploadError.message });
    }

    // Create resume record in database
    const { data: resume, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: auth.userId,
        filename,
        file_url: `${supabaseUrl}/storage/v1/object/public/resumes/${uniqueFilename}`,
        metadata,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      return res.status(500).json({ message: 'Failed to save resume record', error: dbError.message });
    }

    return res.status(201).json(resume);
  } catch (error) {
    const statusCode = (error as any).statusCode || 500;
    const message = (error as any).message || 'Internal server error';
    return res.status(statusCode).json({ message });
  }
}
