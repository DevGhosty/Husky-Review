import { isActivityType } from '../data/uwb-catalog';
import type { ActivityType } from '../types/analysis';

export type TargetRole = 'internship' | 'co-op' | 'full-time';

export interface ProfileSettings {
  displayName: string;
  major: string;
  graduationYear: string;
  prioritizeInTime: boolean;
  showVerificationDates: boolean;
  includeLongTerm: boolean;
  deadlineReminders: boolean;
  roadmapAlerts: boolean;
  resourceUpdates: boolean;
  emailDigest: boolean;
  targetRole: TargetRole;
  activityInterests: ActivityType[];
}

export const defaultProfileSettings: ProfileSettings = {
  displayName: 'Sam Husky',
  major: 'Business Administration',
  graduationYear: '2027',
  prioritizeInTime: true,
  showVerificationDates: true,
  includeLongTerm: true,
  deadlineReminders: true,
  roadmapAlerts: true,
  resourceUpdates: true,
  emailDigest: false,
  targetRole: 'internship',
  activityInterests: ['club', 'course', 'event'],
};

const STORAGE_KEY = 'husky-review-profile-settings';

const targetRoleValues: TargetRole[] = ['internship', 'co-op', 'full-time'];

function isTargetRole(value: unknown): value is TargetRole {
  return typeof value === 'string' && targetRoleValues.includes(value as TargetRole);
}

function parseActivityInterests(raw: Partial<ProfileSettings> & { focusAreas?: unknown[] }): ActivityType[] {
  if (Array.isArray(raw.activityInterests)) {
    const valid = raw.activityInterests.filter(isActivityType);
    return valid.length > 0 ? valid : defaultProfileSettings.activityInterests;
  }

  // Legacy SWE focusAreas are ignored — fall back to inclusive defaults
  if (Array.isArray(raw.focusAreas)) {
    return defaultProfileSettings.activityInterests;
  }

  return defaultProfileSettings.activityInterests;
}

export function loadProfileSettings(): ProfileSettings {
  if (typeof window === 'undefined') {
    return defaultProfileSettings;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultProfileSettings;
    }

    const parsed = JSON.parse(raw) as Partial<ProfileSettings> & { focusAreas?: unknown[] };
    return {
      ...defaultProfileSettings,
      ...parsed,
      activityInterests: parseActivityInterests(parsed),
      targetRole: isTargetRole(parsed.targetRole) ? parsed.targetRole : defaultProfileSettings.targetRole,
    };
  } catch {
    return defaultProfileSettings;
  }
}

export function saveProfileSettings(settings: ProfileSettings): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function clearProfileSettings(): ProfileSettings {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return defaultProfileSettings;
}

const profileSectionIds = {
  overview: 'overview',
  preferences: 'preferences',
  notifications: 'notifications',
  careerGoals: 'career-goals',
  appearance: 'appearance',
  privacy: 'privacy',
} as const;

export type ProfileSectionId = (typeof profileSectionIds)[keyof typeof profileSectionIds];

export const profileSections = [
  { id: profileSectionIds.overview, label: 'Overview' },
  { id: profileSectionIds.preferences, label: 'Review preferences' },
  { id: profileSectionIds.notifications, label: 'Notifications' },
  { id: profileSectionIds.careerGoals, label: 'Career goals' },
  { id: profileSectionIds.appearance, label: 'Appearance' },
  { id: profileSectionIds.privacy, label: 'Privacy & data' },
] as const;

export function profileSectionHref(sectionId: ProfileSectionId): string {
  return `/app/profile#${sectionId}`;
}
