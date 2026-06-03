import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './auth0-config';
import {
  defaultProfileSettings,
  isCampus,
  prepareProfileSettingsForPersistence,
  type Campus,
  type ProfileSettings,
} from '../lib/profile-settings';
import type { ActivityType, ReviewAnalysis, ReviewQuotaStatus, SavedReviewSummary } from '../types/analysis';

export function hasSupabaseConfig() {
  return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
}

function requireSupabaseConfig() {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase client configuration is missing');
  }
  return SUPABASE_CONFIG;
}

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
  campus: Campus | null;
  graduation_year: string;
  prioritize_in_time: boolean;
  show_verification_dates: boolean;
  include_long_term: boolean;
  include_other_campuses: boolean;
  deadline_reminders: boolean;
  roadmap_alerts: boolean;
  resource_updates: boolean;
  email_digest: boolean;
  target_role: ProfileSettings['targetRole'];
  activity_interests: ActivityType[];
  profile_completed_at: string | null;
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

async function throwApiError(response: Response, fallbackMessage: string): Promise<never> {
  const contentType = response.headers.get('content-type') || '';
  let message = fallbackMessage;

  try {
    if (contentType.includes('application/json')) {
      const error = await response.json();
      if (typeof error?.message === 'string' && error.message.trim()) {
        message = error.message.trim();
      }
    } else {
      const text = (await response.text()).replace(/\s+/g, ' ').trim();
      if (text) {
        message = `${fallbackMessage}: ${text.slice(0, 240)}`;
      }
    }
  } catch {
    // Preserve the fallback when the server returns malformed error content.
  }

  if (message === fallbackMessage) {
    message = `${fallbackMessage} (HTTP ${response.status})`;
  }

  throw new Error(message);
}

async function readApiJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    await throwApiError(response, fallbackMessage);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = (await response.text()).replace(/\s+/g, ' ').trim();
    throw new Error(`${fallbackMessage}: expected JSON but received ${response.status} ${response.statusText}${text ? ` (${text.slice(0, 160)})` : ''}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchUserResumes(accessToken: string): Promise<ResumeRecord[]> {
  const response = await fetch('/api/resumes', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return readApiJson<ResumeRecord[]>(response, 'Failed to fetch resumes');
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

  return readApiJson<ResumeRecord>(response, 'Failed to upload resume');
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
    await throwApiError(response, 'Failed to delete resume');
  }
}

export async function analyzeReview(
  accessToken: string,
  input: {
    resumeId: string;
    jobDescription: string;
    jobPostingUrl?: string;
    deadline?: string;
    userApiKey?: string;
  },
): Promise<ReviewAnalysis> {
  const response = await fetch('/api/reviews/analyze', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return readApiJson<ReviewAnalysis>(response, 'Failed to analyze review');
}

export async function fetchReviews(accessToken: string): Promise<SavedReviewSummary[]> {
  const response = await fetch('/api/reviews', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return readApiJson<SavedReviewSummary[]>(response, 'Failed to fetch reviews');
}

export async function fetchReview(accessToken: string, reviewId: string): Promise<ReviewAnalysis> {
  const response = await fetch(`/api/reviews/${reviewId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return readApiJson<ReviewAnalysis>(response, 'Failed to fetch review');
}

export async function deleteReview(accessToken: string, reviewId: string): Promise<void> {
  const response = await fetch(`/api/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await throwApiError(response, 'Failed to delete review');
  }
}

export async function fetchReviewQuota(accessToken: string): Promise<ReviewQuotaStatus> {
  const response = await fetch('/api/reviews/quota', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return readApiJson<ReviewQuotaStatus>(response, 'Failed to fetch review quota');
}

export async function fetchProfile(accessToken: string): Promise<ProfileRecord | null> {
  const response = await fetch('/api/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await readApiJson<{ profile: ProfileRecord | null }>(response, 'Failed to fetch profile');
  return result.profile;
}

export async function saveProfileRecord(accessToken: string, profile: ProfileRecord): Promise<ProfileRecord> {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });

  const result = await readApiJson<{ profile: ProfileRecord }>(response, 'Failed to save profile');
  return result.profile;
}

export async function updateReviewSelections(
  accessToken: string,
  reviewId: string,
  selectedIds: string[],
): Promise<ReviewAnalysis> {
  const response = await fetch(`/api/reviews/${reviewId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ selectedIds }),
  });

  return readApiJson<ReviewAnalysis>(response, 'Failed to update roadmap selections');
}

export function profileRecordToSettings(record: ProfileRecord): ProfileSettings {
  return {
    ...defaultProfileSettings,
    displayName: record.display_name || defaultProfileSettings.displayName,
    major: record.major || defaultProfileSettings.major,
    campus: isCampus(record.campus) ? record.campus : defaultProfileSettings.campus,
    graduationYear: record.graduation_year || defaultProfileSettings.graduationYear,
    prioritizeInTime: typeof record.prioritize_in_time === 'boolean' ? record.prioritize_in_time : defaultProfileSettings.prioritizeInTime,
    showVerificationDates:
      typeof record.show_verification_dates === 'boolean'
        ? record.show_verification_dates
        : defaultProfileSettings.showVerificationDates,
    includeLongTerm: typeof record.include_long_term === 'boolean' ? record.include_long_term : defaultProfileSettings.includeLongTerm,
    includeOtherCampuses:
      typeof record.include_other_campuses === 'boolean'
        ? record.include_other_campuses
        : defaultProfileSettings.includeOtherCampuses,
    deadlineReminders: typeof record.deadline_reminders === 'boolean' ? record.deadline_reminders : defaultProfileSettings.deadlineReminders,
    roadmapAlerts: typeof record.roadmap_alerts === 'boolean' ? record.roadmap_alerts : defaultProfileSettings.roadmapAlerts,
    resourceUpdates: typeof record.resource_updates === 'boolean' ? record.resource_updates : defaultProfileSettings.resourceUpdates,
    emailDigest: typeof record.email_digest === 'boolean' ? record.email_digest : defaultProfileSettings.emailDigest,
    targetRole: record.target_role || defaultProfileSettings.targetRole,
    activityInterests: Array.isArray(record.activity_interests)
      ? record.activity_interests
      : defaultProfileSettings.activityInterests,
    profileCompletedAt: record.profile_completed_at || null,
  };
}

export function settingsToProfileRecord(auth0UserId: string, settings: ProfileSettings): ProfileRecord {
  const persisted = prepareProfileSettingsForPersistence(settings);
  return {
    auth0_user_id: auth0UserId,
    display_name: persisted.displayName,
    major: persisted.major,
    campus: persisted.campus || null,
    graduation_year: persisted.graduationYear,
    prioritize_in_time: persisted.prioritizeInTime,
    show_verification_dates: persisted.showVerificationDates,
    include_long_term: persisted.includeLongTerm,
    include_other_campuses: persisted.includeOtherCampuses,
    deadline_reminders: persisted.deadlineReminders,
    roadmap_alerts: persisted.roadmapAlerts,
    resource_updates: persisted.resourceUpdates,
    email_digest: persisted.emailDigest,
    target_role: persisted.targetRole,
    activity_interests: persisted.activityInterests,
    profile_completed_at: persisted.profileCompletedAt,
  };
}
