import type { ActivityRow } from './review-analysis.js';
import { campusNameToCampus, type ProfileCampus } from './profile-completion.js';

const BOTHELL_HOSTS = ['gather.uwb.edu', 'bothell.uw.edu'] as const;
const TACOMA_HOSTS = ['dubnet.tacoma.uw.edu', 'tacoma.uw.edu'] as const;
const SEATTLE_HOSTS = ['huskylink.washington.edu'] as const;
const AUTHORITATIVE_HOSTS = [...SEATTLE_HOSTS, ...BOTHELL_HOSTS, ...TACOMA_HOSTS] as const;

function parseHttpSourceUrl(sourceUrl: string | null | undefined): URL | null {
  const trimmed = (sourceUrl || '').trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function hostnameMatches(hostname: string, allowedHost: string): boolean {
  const host = hostname.toLowerCase();
  const allowed = allowedHost.toLowerCase();
  return host === allowed || host.endsWith(`.${allowed}`);
}

function hostnameInSet(hostname: string, allowedHosts: readonly string[]): boolean {
  return allowedHosts.some((allowedHost) => hostnameMatches(hostname, allowedHost));
}

function inferCampusFromTimeschedPath(pathname: string, search: string): ProfileCampus | null {
  const path = pathname.toLowerCase();
  const params = new URLSearchParams(search);

  if (/\/b(\/|$)/.test(path) || params.get('campus')?.toLowerCase() === 'b') {
    return 'bothell';
  }
  if (/\/t(\/|$)/.test(path) || params.get('campus')?.toLowerCase() === 't') {
    return 'tacoma';
  }

  return null;
}

export function inferCampusFromSourceUrl(sourceUrl: string | null | undefined): ProfileCampus | null {
  const parsed = parseHttpSourceUrl(sourceUrl);
  if (!parsed) {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  if (hostnameInSet(hostname, BOTHELL_HOSTS)) {
    return 'bothell';
  }
  if (hostnameMatches(hostname, 'uwb.edu') && pathname.startsWith('/club')) {
    return 'bothell';
  }
  if (hostnameInSet(hostname, TACOMA_HOSTS)) {
    return 'tacoma';
  }
  if (hostnameInSet(hostname, SEATTLE_HOSTS)) {
    return 'seattle';
  }

  if (hostnameMatches(hostname, 'washington.edu') && pathname.includes('/timeschd')) {
    return inferCampusFromTimeschedPath(pathname, parsed.search);
  }

  return null;
}

export function isAuthoritativeCampusSource(sourceUrl: string | null | undefined): boolean {
  const parsed = parseHttpSourceUrl(sourceUrl);
  if (!parsed) {
    return false;
  }

  return hostnameInSet(parsed.hostname.toLowerCase(), AUTHORITATIVE_HOSTS);
}

export function reconcileActivityCampus(
  campus: ProfileCampus | null,
  sourceUrl: string | null | undefined,
): ProfileCampus | null {
  const inferred = inferCampusFromSourceUrl(sourceUrl);
  if (inferred && isAuthoritativeCampusSource(sourceUrl)) {
    return inferred;
  }
  if (inferred && !campus) {
    return inferred;
  }
  return campus;
}

export function isCampusConsistentWithSource(activity: Pick<ActivityRow, 'campus' | 'source_url' | 'category'>): boolean {
  const inferred = inferCampusFromSourceUrl(activity.source_url);
  if (!inferred || !isAuthoritativeCampusSource(activity.source_url)) {
    return true;
  }
  return activity.campus === inferred;
}

export function normalizeCatalogName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function catalogSourcePriority(id: string): number {
  if (id.startsWith('org:')) return 3;
  if (id.startsWith('course:')) return 2;
  return 1;
}

export function dedupeCatalogActivities(rows: ActivityRow[]): ActivityRow[] {
  const reconciled = rows
    .map((row) => {
      const campus = reconcileActivityCampus(campusNameToCampus(row.campus), row.source_url);
      if (!campus || !isCampusConsistentWithSource({ ...row, campus })) {
        return null;
      }
      return { ...row, campus };
    })
    .filter(Boolean) as ActivityRow[];

  const byName = new Map<string, ActivityRow>();
  for (const row of reconciled) {
    const key = normalizeCatalogName(row.name);
    if (!key) continue;
    const existing = byName.get(key);
    if (!existing || catalogSourcePriority(row.id) > catalogSourcePriority(existing.id)) {
      byName.set(key, row);
    }
  }

  return [...byName.values()];
}
