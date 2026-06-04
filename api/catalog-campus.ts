import type { ActivityRow } from './review-analysis.js';
import { campusNameToCampus, type ProfileCampus } from './profile-completion.js';

export function inferCampusFromSourceUrl(sourceUrl: string | null | undefined): ProfileCampus | null {
  const url = (sourceUrl || '').toLowerCase();
  if (!url) return null;

  if (url.includes('gather.uwb.edu') || url.includes('uwb.edu/club') || url.includes('bothell.uw.edu')) {
    return 'bothell';
  }
  if (url.includes('dubnet.tacoma') || url.includes('tacoma.uw.edu')) {
    return 'tacoma';
  }
  if (url.includes('huskylink.washington.edu')) {
    return 'seattle';
  }

  if (url.includes('timeschd')) {
    if (/\/b\//i.test(url) || url.includes('campus=b')) return 'bothell';
    if (/\/t\//i.test(url) || url.includes('campus=t')) return 'tacoma';
    if (/\/b$/i.test(url) || url.endsWith('/b')) return 'bothell';
    if (/\/t$/i.test(url) || url.endsWith('/t')) return 'tacoma';
  }

  return null;
}

export function isAuthoritativeCampusSource(sourceUrl: string | null | undefined): boolean {
  const url = (sourceUrl || '').toLowerCase();
  return (
    url.includes('huskylink.washington.edu') ||
    url.includes('gather.uwb.edu') ||
    url.includes('dubnet.tacoma') ||
    url.includes('tacoma.uw.edu')
  );
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
