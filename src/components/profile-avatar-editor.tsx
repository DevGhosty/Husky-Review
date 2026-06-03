import { useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { getAccessTokenRequestOptions } from '../auth/auth0-config';
import { useProfileSettings } from '../context/profile-settings-context';
import { resolveProfilePictureUrl } from '../lib/profile-picture';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function validateAvatarFile(file: File): string | null {
  const contentType = file.type || '';
  if (!ACCEPTED_TYPES.has(contentType) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    return 'Choose a JPEG, PNG, or WebP image.';
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return 'Images must be 2 MB or smaller.';
  }

  return null;
}

export function ProfileAvatarEditor() {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const { settings, uploadAvatar, removeAvatar } = useProfileSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const displayName = settings.displayName || user?.name || user?.nickname || 'UW student';
  const pictureUrl = resolveProfilePictureUrl(settings.avatarUrl, user?.picture);
  const hasCustomAvatar = Boolean(settings.avatarUrl?.trim());
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isAuthenticated) {
      setError('Sign in to upload a profile picture.');
      return;
    }

    setPending(true);
    setError(null);

    try {
      const token = await getAccessTokenSilently(getAccessTokenRequestOptions());
      await uploadAvatar(token, file);
    } catch (uploadError) {
      setError((uploadError as Error).message || 'Profile picture upload failed.');
    } finally {
      setPending(false);
    }
  }

  async function handleRemove() {
    if (!isAuthenticated || !hasCustomAvatar) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const token = await getAccessTokenSilently(getAccessTokenRequestOptions());
      await removeAvatar(token);
    } catch (removeError) {
      setError((removeError as Error).message || 'Could not remove profile picture.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inset-row flex flex-col gap-5 rounded-2xl p-4 sm:flex-row sm:items-center">
      <Avatar size="lg" className="size-20">
        {pictureUrl ? <AvatarImage src={pictureUrl} alt={displayName} /> : null}
        <AvatarFallback className="bg-primary/10 text-xl font-black text-primary">{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-foreground">Profile picture</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Upload a photo for the navigation menu and your workspace. Without a custom photo, your Google account image is used when available.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(event) => {
              void handleFileChange(event);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="h-10"
            disabled={pending || !isAuthenticated}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
            {hasCustomAvatar ? 'Change photo' : 'Upload photo'}
          </Button>
          {hasCustomAvatar ? (
            <Button type="button" variant="outline" className="h-10" disabled={pending} onClick={() => void handleRemove()}>
              <Trash2 className="size-4" aria-hidden="true" />
              Remove
            </Button>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-xs font-semibold text-amber-800 dark:text-amber-200">{error}</p> : null}
      </div>
    </div>
  );
}
