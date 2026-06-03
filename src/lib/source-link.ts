const NON_LINK_LABELS = new Set(['UW catalog source']);

function toAbsoluteUrl(value: string) {
  return new URL(value.includes('://') ? value : `https://${value}`).href;
}

export function resolveSourceLink(sourceLabel: string, sourceUrl?: string): string | null {
  const explicit = sourceUrl?.trim();
  if (explicit) {
    try {
      return toAbsoluteUrl(explicit);
    } catch {
      // Fall back to label-based resolution below.
    }
  }

  const label = sourceLabel.trim();
  if (!label || NON_LINK_LABELS.has(label)) {
    return null;
  }

  try {
    return toAbsoluteUrl(label);
  } catch {
    return null;
  }
}
