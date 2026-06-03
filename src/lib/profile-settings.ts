import type { ActivityType } from '../types/analysis';

export type TargetRole = 'internship' | 'co-op' | 'full-time';
export type Campus = 'seattle' | 'bothell' | 'tacoma';

export const campusOptions: { id: Campus; label: string; shortLabel: string }[] = [
  { id: 'seattle', label: 'UW Seattle', shortLabel: 'Seattle' },
  { id: 'bothell', label: 'UW Bothell', shortLabel: 'Bothell' },
  { id: 'tacoma', label: 'UW Tacoma', shortLabel: 'Tacoma' },
];

export interface ProfileSettings {
  displayName: string;
  major: string;
  campus: Campus | '';
  graduationYear: string;
  prioritizeInTime: boolean;
  showVerificationDates: boolean;
  includeLongTerm: boolean;
  includeOtherCampuses: boolean;
  deadlineReminders: boolean;
  roadmapAlerts: boolean;
  resourceUpdates: boolean;
  emailDigest: boolean;
  targetRole: TargetRole;
  activityInterests: ActivityType[];
  profileCompletedAt: string | null;
}

export const defaultProfileSettings: ProfileSettings = {
  displayName: '',
  major: '',
  campus: '',
  graduationYear: '2027',
  prioritizeInTime: true,
  showVerificationDates: true,
  includeLongTerm: true,
  includeOtherCampuses: false,
  deadlineReminders: true,
  roadmapAlerts: true,
  resourceUpdates: true,
  emailDigest: false,
  targetRole: 'internship',
  activityInterests: ['club', 'course', 'event'],
  profileCompletedAt: null,
};

const STORAGE_KEY = 'husky-review-profile-settings';

const targetRoleValues: TargetRole[] = ['internship', 'co-op', 'full-time'];
const activityTypeValues = new Set<ActivityType>(['club', 'course', 'event', 'fellowship', 'project', 'research']);
const campusValues = new Set<Campus>(campusOptions.map((option) => option.id));

function isTargetRole(value: unknown): value is TargetRole {
  return typeof value === 'string' && targetRoleValues.includes(value as TargetRole);
}

function isActivityType(value: unknown): value is ActivityType {
  return typeof value === 'string' && activityTypeValues.has(value as ActivityType);
}

export function isCampus(value: unknown): value is Campus {
  return typeof value === 'string' && campusValues.has(value as Campus);
}

export function campusLabel(campus: Campus | '') {
  return campusOptions.find((option) => option.id === campus)?.label || 'Campus not set';
}

function parseCampus(rawCampus: unknown): Campus | '' {
  return isCampus(rawCampus) ? rawCampus : '';
}

function parseProfileCompletedAt(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) ? value : null;
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

export function hasRequiredProfileFields(settings: Pick<ProfileSettings, 'displayName' | 'major' | 'campus'>): boolean {
  return Boolean(settings.displayName.trim() && settings.major.trim() && isCampus(settings.campus));
}

export function isProfileComplete(settings: ProfileSettings): boolean {
  return hasRequiredProfileFields(settings) && Boolean(settings.profileCompletedAt);
}

export function completeProfileSettings(settings: ProfileSettings, completedAt = new Date().toISOString()): ProfileSettings {
  const hasRequiredFields = hasRequiredProfileFields(settings);

  return {
    ...settings,
    displayName: settings.displayName.trim(),
    major: settings.major.trim(),
    campus: parseCampus(settings.campus),
    profileCompletedAt: hasRequiredFields ? settings.profileCompletedAt || completedAt : null,
  };
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
      campus: parseCampus(parsed.campus),
      activityInterests: parseActivityInterests(parsed),
      targetRole: isTargetRole(parsed.targetRole) ? parsed.targetRole : defaultProfileSettings.targetRole,
      includeOtherCampuses:
        typeof parsed.includeOtherCampuses === 'boolean'
          ? parsed.includeOtherCampuses
          : defaultProfileSettings.includeOtherCampuses,
      profileCompletedAt: parseProfileCompletedAt(parsed.profileCompletedAt),
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
