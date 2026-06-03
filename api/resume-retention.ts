export const DEFAULT_ORPHAN_RETENTION_HOURS = 168;

export function parseOrphanRetentionHours(raw: string | undefined): number {
  const parsed = Number(raw?.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_ORPHAN_RETENTION_HOURS;
  }

  return parsed;
}

export function orphanRetentionCutoffIso(nowMs: number, retentionHours: number): string {
  return new Date(nowMs - retentionHours * 60 * 60 * 1000).toISOString();
}

export function selectOrphanResumesForPurge<T extends { id: string }>(
  candidates: T[],
  linkedResumeIds: Iterable<string>,
): T[] {
  const linked = new Set(linkedResumeIds);
  return candidates.filter((row) => !linked.has(row.id));
}
