import { requireAuth } from './auth0-verify.js';
import { parseActivityInterests } from './catalog-filters.js';
import { attachAvatarUrl, getSupabaseAdmin, sendError, sendInternalError, setApiHeaders } from './supabase-admin.js';

type TargetRole = 'internship' | 'co-op' | 'full-time';
type ProfileCampus = 'seattle' | 'bothell' | 'tacoma';

interface ProfileApiInput {
  display_name?: unknown;
  major?: unknown;
  campus?: unknown;
  graduation_year?: unknown;
  prioritize_in_time?: unknown;
  show_verification_dates?: unknown;
  include_long_term?: unknown;
  include_other_campuses?: unknown;
  deadline_reminders?: unknown;
  roadmap_alerts?: unknown;
  resource_updates?: unknown;
  email_digest?: unknown;
  target_role?: unknown;
  activity_interests?: unknown;
  profile_completed_at?: unknown;
}

const targetRoles = new Set<TargetRole>(['internship', 'co-op', 'full-time']);

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function targetRoleValue(value: unknown): TargetRole {
  return typeof value === 'string' && targetRoles.has(value as TargetRole) ? (value as TargetRole) : 'internship';
}

function campusValue(value: unknown): ProfileCampus | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'b' || normalized === 'bothell') return 'bothell';
  if (normalized === 't' || normalized === 'tacoma') return 'tacoma';
  if (normalized === 'seattle') return 'seattle';
  return null;
}

function completedAtValue(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  return Number.isFinite(Date.parse(value)) ? value : null;
}

function normalizeProfilePayload(auth0UserId: string, body: ProfileApiInput) {
  const campus = campusValue(body.campus);
  const displayName = stringValue(body.display_name);
  const major = stringValue(body.major);
  const hasRequiredFields = Boolean(displayName && major && campus);

  return {
    auth0_user_id: auth0UserId,
    display_name: displayName,
    major,
    campus,
    graduation_year: stringValue(body.graduation_year, '2027') || '2027',
    prioritize_in_time: booleanValue(body.prioritize_in_time, true),
    show_verification_dates: booleanValue(body.show_verification_dates, true),
    include_long_term: booleanValue(body.include_long_term, true),
    include_other_campuses: booleanValue(body.include_other_campuses, false),
    deadline_reminders: booleanValue(body.deadline_reminders, true),
    roadmap_alerts: booleanValue(body.roadmap_alerts, true),
    resource_updates: booleanValue(body.resource_updates, true),
    email_digest: booleanValue(body.email_digest, false),
    target_role: targetRoleValue(body.target_role),
    activity_interests: parseActivityInterests(body.activity_interests),
    profile_completed_at: hasRequiredFields ? completedAtValue(body.profile_completed_at) || new Date().toISOString() : null,
  };
}

export default async function handler(req: any, res: any) {
  setApiHeaders(res, 'GET,PUT', req.headers?.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await requireAuth(req.headers.authorization);
    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth0_user_id', auth.userId)
        .maybeSingle();

      if (error) {
        return sendInternalError(res, 'Failed to fetch profile', error);
      }

      return res.status(200).json({ profile: await attachAvatarUrl(supabase, data || null) });
    }

    const profile = normalizeProfilePayload(auth.userId, req.body || {});
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'auth0_user_id' })
      .select('*')
      .single();

    if (error) {
      return sendInternalError(res, 'Failed to save profile', error);
    }

    return res.status(200).json({ profile: await attachAvatarUrl(supabase, data) });
  } catch (error) {
    return sendError(res, error);
  }
}
