import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './auth0-config';

/**
 * Initialize Supabase client for authenticated API calls
 * All row-level security (RLS) policies are applied server-side
 */
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Resume record type (matches Supabase schema)
 */
export interface ResumeRecord {
  id: string;
  user_id: string; // Auth0 'sub' claim
  filename: string;
  file_url: string; // Storage URL or reference
  uploaded_at: string;
  metadata?: {
    parsed_skills?: string[];
    years_experience?: number;
    last_updated?: string;
  };
}

/**
 * Fetch authenticated user's saved resumes via API proxy
 * Proxy endpoint validates Auth0 token and applies RLS
 */
export async function fetchUserResumes(accessToken: string): Promise<ResumeRecord[]> {
  const response = await fetch('/api/resumes', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch resumes');
  }

  return response.json();
}

/**
 * Upload a resume file and metadata via API proxy
 */
export async function uploadResume(
  accessToken: string,
  file: File,
  metadata?: ResumeRecord['metadata']
): Promise<ResumeRecord> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  const response = await fetch('/api/resumes/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: base64,
      filename: file.name,
      metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload resume');
  }

  return response.json();
}

/**
 * Fetch a single resume by ID via API proxy
 * Proxy validates user ownership via RLS
 */
export async function fetchResumeById(accessToken: string, resumeId: string): Promise<ResumeRecord> {
  const response = await fetch(`/api/resumes/${resumeId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch resume');
  }

  return response.json();
}

/**
 * Delete a resume record via API proxy
 */
export async function deleteResume(accessToken: string, resumeId: string): Promise<void> {
  const response = await fetch(`/api/resumes/${resumeId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete resume');
  }
}
