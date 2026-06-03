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

const STORAGE_KEY_PREFIX = 'husky-review-profile-settings';
const LEGACY_STORAGE_KEY = 'husky-review-profile-settings';

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

  if (Array.isArray(raw.focusAreas)) {
    return defaultProfileSettings.activityInterests;
  }

  return defaultProfileSettings.activityInterests;
}

function parseStoredSettings(raw: Partial<ProfileSettings> & { focusAreas?: unknown[] }): ProfileSettings {
  return {
    ...defaultProfileSettings,
    ...raw,
    campus: parseCampus(raw.campus),
    activityInterests: parseActivityInterests(raw),
    targetRole: isTargetRole(raw.targetRole) ? raw.targetRole : defaultProfileSettings.targetRole,
    includeOtherCampuses:
      typeof raw.includeOtherCampuses === 'boolean'
        ? raw.includeOtherCampuses
        : defaultProfileSettings.includeOtherCampuses,
    profileCompletedAt: parseProfileCompletedAt(raw.profileCompletedAt),
  };
}

export function profileStorageKey(auth0UserId?: string | null): string {
  if (auth0UserId?.trim()) {
    return `${STORAGE_KEY_PREFIX}:${auth0UserId}`;
  }
  return LEGACY_STORAGE_KEY;
}

export function hasRequiredProfileFields(settings: Pick<ProfileSettings, 'displayName' | 'major' | 'campus'>): boolean {
  return Boolean(settings.displayName.trim() && settings.major.trim() && isCampus(settings.campus));
}

export function isProfileComplete(settings: ProfileSettings): boolean {
  return hasRequiredProfileFields(settings) && Boolean(settings.profileCompletedAt);
}

/** Live edits: preserve spaces while typing; only normalize campus. */
export function normalizeProfileSettingsDraft(settings: ProfileSettings): ProfileSettings {
  return {
    ...settings,
    campus: parseCampus(settings.campus),
  };
}

/** Persisted snapshot (localStorage + Supabase): trim text fields and stamp completion. */
/** Stable serialization for dirty-state comparison and remote sync. */
export function profileSettingsBaseline(settings: ProfileSettings): string {
  return JSON.stringify(prepareProfileSettingsForPersistence(settings));
}

export function parseProfileSettingsBaseline(serialized: string): ProfileSettings {
  try {
    return parseStoredSettings(JSON.parse(serialized) as Partial<ProfileSettings>);
  } catch {
    return defaultProfileSettings;
  }
}

export function prepareProfileSettingsForPersistence(
  settings: ProfileSettings,
  completedAt = new Date().toISOString(),
): ProfileSettings {
  const draft = normalizeProfileSettingsDraft(settings);
  const hasRequiredFields = hasRequiredProfileFields(draft);

  return {
    ...draft,
    displayName: draft.displayName.trim(),
    major: draft.major.trim(),
    profileCompletedAt: hasRequiredFields ? draft.profileCompletedAt || completedAt : null,
  };
}

/** @deprecated Use prepareProfileSettingsForPersistence for saves; normalizeProfileSettingsDraft for live edits. */
export function completeProfileSettings(settings: ProfileSettings, completedAt = new Date().toISOString()): ProfileSettings {
  return prepareProfileSettingsForPersistence(settings, completedAt);
}

export function loadProfileSettings(auth0UserId?: string | null): ProfileSettings {
  if (typeof window === 'undefined') {
    return defaultProfileSettings;
  }

  try {
    const scopedKey = profileStorageKey(auth0UserId);
    let raw = localStorage.getItem(scopedKey);

    if (!raw && auth0UserId) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(scopedKey, raw);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }

    if (!raw && !auth0UserId) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }

    if (!raw) {
      return defaultProfileSettings;
    }

    return parseStoredSettings(JSON.parse(raw) as Partial<ProfileSettings> & { focusAreas?: unknown[] });
  } catch {
    return defaultProfileSettings;
  }
}

export function saveProfileSettings(settings: ProfileSettings, auth0UserId?: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  const key = profileStorageKey(auth0UserId);
  localStorage.setItem(key, JSON.stringify(prepareProfileSettingsForPersistence(settings)));
}

export function clearProfileSettings(auth0UserId?: string | null): ProfileSettings {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(profileStorageKey(auth0UserId));
    if (!auth0UserId) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }
  return defaultProfileSettings;
}

const profileSectionIds = {
  overview: 'overview',
  preferences: 'preferences',
  notifications: 'notifications',
  careerGoals: 'career-goals',
  appearance: 'appearance',
} as const;

export type ProfileSectionId = (typeof profileSectionIds)[keyof typeof profileSectionIds];

export const profileSections = [
  { id: profileSectionIds.overview, label: 'Overview' },
  { id: profileSectionIds.preferences, label: 'Review preferences' },
  { id: profileSectionIds.notifications, label: 'Notifications' },
  { id: profileSectionIds.careerGoals, label: 'Career goals' },
  { id: profileSectionIds.appearance, label: 'Appearance' },
] as const;

export function profileSectionHref(sectionId: ProfileSectionId): string {
  return `/app/profile#${sectionId}`;
}
