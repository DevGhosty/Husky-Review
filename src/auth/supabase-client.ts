import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './auth0-config';
import { defaultProfileSettings, type ProfileSettings } from '../lib/profile-settings';
import type { ActivityType } from '../types/analysis';

export function hasSupabaseConfig() {
  return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
}

function requireSupabaseConfig() {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase client configuration is missing');
  }
  return SUPABASE_CONFIG;
}

export const supabase = hasSupabaseConfig()
  ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export function createAuth0SupabaseClient(getAuth0IdToken: () => Promise<string | null>): SupabaseClient {
  const config = requireSupabaseConfig();
  return createClient(config.url, config.anonKey, {
    accessToken: getAuth0IdToken,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  auth0_user_id: string;
  filename: string;
  storage_path: string;
  file_url: string;
  download_url: string;
  content_type?: string | null;
  size_bytes?: number | null;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    parsed_skills?: string[];
    years_experience?: number;
    last_updated?: string;
    jobPostingUrl?: string;
    deadline?: string;
  };
}

export interface ProfileRecord {
  auth0_user_id: string;
  display_name: string;
  major: string;
  graduation_year: string;
  prioritize_in_time: boolean;
  show_verification_dates: boolean;
  include_long_term: boolean;
  deadline_reminders: boolean;
  roadmap_alerts: boolean;
  resource_updates: boolean;
  email_digest: boolean;
  target_role: ProfileSettings['targetRole'];
  activity_interests: ActivityType[];
  created_at?: string;
  updated_at?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read resume file'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.readAsDataURL(file);
  });
}

export async function fetchUserResumes(accessToken: string): Promise<ResumeRecord[]> {
  const response = await fetch('/api/resumes', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch resumes');
  }

  return response.json();
}

export async function uploadResume(
  accessToken: string,
  file: File,
  metadata?: ResumeRecord['metadata'],
): Promise<ResumeRecord> {
  const base64 = await fileToBase64(file);

  const response = await fetch('/api/resumes/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: base64,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload resume');
  }

  return response.json();
}

export async function fetchResumeById(accessToken: string, resumeId: string): Promise<ResumeRecord> {
  const response = await fetch(`/api/resumes/${resumeId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch resume');
  }

  return response.json();
}

export async function deleteResume(accessToken: string, resumeId: string): Promise<void> {
  const response = await fetch(`/api/resumes/${resumeId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete resume');
  }
}

export function profileRecordToSettings(record: ProfileRecord): ProfileSettings {
  return {
    ...defaultProfileSettings,
    displayName: record.display_name || defaultProfileSettings.displayName,
    major: record.major || defaultProfileSettings.major,
    graduationYear: record.graduation_year || defaultProfileSettings.graduationYear,
    prioritizeInTime: record.prioritize_in_time,
    showVerificationDates: record.show_verification_dates,
    includeLongTerm: record.include_long_term,
    deadlineReminders: record.deadline_reminders,
    roadmapAlerts: record.roadmap_alerts,
    resourceUpdates: record.resource_updates,
    emailDigest: record.email_digest,
    targetRole: record.target_role || defaultProfileSettings.targetRole,
    activityInterests: Array.isArray(record.activity_interests)
      ? record.activity_interests
      : defaultProfileSettings.activityInterests,
  };
}

export function settingsToProfileRecord(auth0UserId: string, settings: ProfileSettings): ProfileRecord {
  return {
    auth0_user_id: auth0UserId,
    display_name: settings.displayName,
    major: settings.major,
    graduation_year: settings.graduationYear,
    prioritize_in_time: settings.prioritizeInTime,
    show_verification_dates: settings.showVerificationDates,
    include_long_term: settings.includeLongTerm,
    deadline_reminders: settings.deadlineReminders,
    roadmap_alerts: settings.roadmapAlerts,
    resource_updates: settings.resourceUpdates,
    email_digest: settings.emailDigest,
    target_role: settings.targetRole,
    activity_interests: settings.activityInterests,
  };
}
