export function resolveProfilePictureUrl(
  customAvatarUrl: string | null | undefined,
  auth0Picture: string | null | undefined,
): string | null {
  const custom = customAvatarUrl?.trim();
  if (custom) {
    return custom;
  }

  const auth0 = auth0Picture?.trim();
  return auth0 || null;
}
