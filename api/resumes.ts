/**
 * Vercel serverless function for resume CRUD operations
 * Path: /api/resumes
 * 
 * Handles:
 * - GET /api/resumes - List user's saved resumes
 * - POST /api/resumes/upload - Upload and save a resume
 * - DELETE /api/resumes/[id] - Delete a resume
 */

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from './auth0-verify';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: { persistSession: false },
  }
);

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const auth = await requireAuth(req.headers.authorization);

    if (req.method === 'GET') {
      // List resumes for authenticated user
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', auth.userId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        return res.status(500).json({ message: 'Failed to fetch resumes', error: error.message });
      }

      return res.status(200).json(data || []);
    }

    if (req.method === 'DELETE') {
      // Extract resume ID from query or path
      const id = req.query.id || req.body?.id;

      if (!id) {
        return res.status(400).json({ message: 'Resume ID required' });
      }

      // Delete resume (RLS ensures user owns it)
      const { error } = await supabase.from('resumes').delete().eq('id', id).eq('user_id', auth.userId);

      if (error) {
        return res.status(500).json({ message: 'Failed to delete resume', error: error.message });
      }

      return res.status(204).end();
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    const statusCode = (error as any).statusCode || 500;
    const message = (error as any).message || 'Internal server error';
    return res.status(statusCode).json({ message });
  }
}
