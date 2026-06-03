export type ProfileCampus = 'seattle' | 'bothell' | 'tacoma';

export interface ProfileCompletionRow {
  display_name: string | null;
  major: string | null;
  campus: string | null;
  profile_completed_at: string | null;
}

const campusValues = new Set<ProfileCampus>(['seattle', 'bothell', 'tacoma']);

export function isProfileCampus(value: unknown): value is ProfileCampus {
  return typeof value === 'string' && campusValues.has(value as ProfileCampus);
}

export function campusNameToCampus(value: unknown): ProfileCampus | null {
  if (isProfileCampus(value)) return value;
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'b' || normalized === 'bothell') return 'bothell';
  if (normalized === 't' || normalized === 'tacoma') return 'tacoma';
  if (normalized === '' || normalized === 'seattle') return 'seattle';
  return null;
}

export function getCompletedProfileCampus(profile: ProfileCompletionRow | null): ProfileCampus | null {
  const campus = campusNameToCampus(profile?.campus);
  const complete = Boolean(
    profile?.profile_completed_at &&
      profile.display_name?.trim() &&
      profile.major?.trim() &&
      campus,
  );

  return complete ? campus : null;
}
