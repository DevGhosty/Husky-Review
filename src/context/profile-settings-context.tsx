import { useAuth0 } from '@auth0/auth0-react';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  createAuth0SupabaseClient,
  hasSupabaseConfig,
  profileRecordToSettings,
  settingsToProfileRecord,
  type ProfileRecord,
} from '../auth/supabase-client';
import {
  clearProfileSettings,
  defaultProfileSettings,
  isProfileComplete,
  loadProfileSettings,
  normalizeProfileSettingsDraft,
  prepareProfileSettingsForPersistence,
  saveProfileSettings,
  type Campus,
  type ProfileSettings,
  type TargetRole,
} from '../lib/profile-settings';
import type { ActivityType } from '../types/analysis';

interface ProfileSettingsContextValue {
  settings: ProfileSettings;
  profileComplete: boolean;
  setDisplayName: (displayName: string) => void;
  setMajor: (major: string) => void;
  setCampus: (campus: Campus | '') => void;
  setBooleanPref: (key: BooleanPrefKey, value: boolean) => void;
  setTargetRole: (targetRole: TargetRole) => void;
  toggleActivityInterest: (interest: ActivityType) => void;
  setGraduationYear: (graduationYear: string) => void;
  resetSettings: () => void;
  commitProfileSetup: () => void;
  syncStatus: 'local' | 'loading' | 'synced' | 'error';
  syncError: string | null;
}

type BooleanPrefKey =
  | 'prioritizeInTime'
  | 'showVerificationDates'
  | 'includeLongTerm'
  | 'includeOtherCampuses'
  | 'deadlineReminders'
  | 'roadmapAlerts'
  | 'resourceUpdates'
  | 'emailDigest';

const ProfileSettingsContext = createContext<ProfileSettingsContextValue | null>(null);

interface ProfileSettingsProviderProps {
  children: ReactNode;
}

function authDisplayName(user: { name?: string | null; nickname?: string | null } | undefined): string {
  const candidate = user?.name || user?.nickname || '';
  return typeof candidate === 'string' ? candidate : '';
}

function serializeForRemote(settings: ProfileSettings): string {
  return JSON.stringify(prepareProfileSettingsForPersistence(settings));
}

export function ProfileSettingsProvider({ children }: ProfileSettingsProviderProps) {
  const { getIdTokenClaims, isAuthenticated, isLoading, user } = useAuth0();
  const userId = user?.sub;
  const [settings, setSettings] = useState<ProfileSettings>(defaultProfileSettings);
  const [remoteReady, setRemoteReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<ProfileSettingsContextValue['syncStatus']>('local');
  const [syncError, setSyncError] = useState<string | null>(null);
  const lastRemoteSettingsRef = useRef('');
  const activeUserIdRef = useRef<string | undefined>(undefined);

  function updateSettings(updater: (current: ProfileSettings) => ProfileSettings) {
    setSettings((current) => normalizeProfileSettingsDraft(updater(current)));
  }

  const supabase = useMemo(() => {
    if (!hasSupabaseConfig()) {
      return null;
    }

    return createAuth0SupabaseClient(async () => {
      const claims = await getIdTokenClaims();
      return claims?.__raw ?? null;
    });
  }, [getIdTokenClaims]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !userId) {
      activeUserIdRef.current = undefined;
      setRemoteReady(false);
      setSyncStatus('local');
      setSyncError(null);
      lastRemoteSettingsRef.current = '';
      setSettings(defaultProfileSettings);
      return;
    }

    if (activeUserIdRef.current === userId) {
      return;
    }

    activeUserIdRef.current = userId;
    setRemoteReady(false);
    setSyncError(null);
    lastRemoteSettingsRef.current = '';
    setSettings(loadProfileSettings(userId));
  }, [isAuthenticated, isLoading, userId]);

  useEffect(() => {
    if (!userId || !isAuthenticated) {
      return;
    }

    const persisted = prepareProfileSettingsForPersistence(settings);
    saveProfileSettings(settings, userId);

    if (persisted.profileCompletedAt && !settings.profileCompletedAt) {
      setSettings(persisted);
    }
  }, [isAuthenticated, settings, userId]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const client = supabase;

    if (!isAuthenticated || !userId || !client) {
      return;
    }

    let cancelled = false;

    async function loadRemoteProfile(activeClient: NonNullable<typeof client>, activeUserId: string) {
      setSyncStatus('loading');
      setSyncError(null);

      const { data, error } = await activeClient
        .from('profiles')
        .select('*')
        .eq('auth0_user_id', activeUserId)
        .maybeSingle<ProfileRecord>();

      if (cancelled) {
        return;
      }

      if (error) {
        setSyncStatus('error');
        setSyncError(error.message);
        setRemoteReady(false);
        return;
      }

      if (data) {
        const remoteSettings = profileRecordToSettings(data);
        lastRemoteSettingsRef.current = serializeForRemote(remoteSettings);
        setSettings(remoteSettings);
      } else {
        lastRemoteSettingsRef.current = serializeForRemote(defaultProfileSettings);
        setSettings((current) => {
          if (current.displayName.trim()) {
            return current;
          }

          const suggestedName = authDisplayName(user);
          if (!suggestedName) {
            return current;
          }

          return normalizeProfileSettingsDraft({ ...current, displayName: suggestedName });
        });
      }

      setRemoteReady(true);
      setSyncStatus('synced');
    }

    void loadRemoteProfile(client, userId);

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, supabase, user, userId]);

  useEffect(() => {
    const client = supabase;

    if (!isAuthenticated || !userId || !client || !remoteReady) {
      return;
    }

    const serialized = serializeForRemote(settings);
    if (serialized === lastRemoteSettingsRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      async function saveRemoteProfile(activeClient: NonNullable<typeof client>, activeUserId: string) {
        setSyncStatus('loading');
        setSyncError(null);

        const persisted = prepareProfileSettingsForPersistence(settings);
        const { error } = await activeClient
          .from('profiles')
          .upsert(settingsToProfileRecord(activeUserId, persisted), { onConflict: 'auth0_user_id' });

        if (error) {
          setSyncStatus('error');
          setSyncError(error.message);
          return;
        }

        lastRemoteSettingsRef.current = serializeForRemote(persisted);
        setSettings(persisted);
        setSyncStatus('synced');
      }

      void saveRemoteProfile(client, userId);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, remoteReady, settings, supabase, userId]);

  const value = useMemo<ProfileSettingsContextValue>(
    () => ({
      settings,
      profileComplete: isProfileComplete(settings),
      setDisplayName: (displayName) => {
        updateSettings((current) => ({ ...current, displayName }));
      },
      setMajor: (major) => {
        updateSettings((current) => ({ ...current, major }));
      },
      setCampus: (campus) => {
        updateSettings((current) => ({ ...current, campus }));
      },
      setBooleanPref: (key, value) => {
        updateSettings((current) => ({ ...current, [key]: value }));
      },
      setTargetRole: (targetRole) => {
        updateSettings((current) => ({ ...current, targetRole }));
      },
      toggleActivityInterest: (interest) => {
        updateSettings((current) => {
          const hasInterest = current.activityInterests.includes(interest);
          const activityInterests = hasInterest
            ? current.activityInterests.filter((item) => item !== interest)
            : [...current.activityInterests, interest];
          return { ...current, activityInterests };
        });
      },
      setGraduationYear: (graduationYear) => {
        updateSettings((current) => ({ ...current, graduationYear }));
      },
      resetSettings: () => {
        const cleared = clearProfileSettings(userId);
        lastRemoteSettingsRef.current = serializeForRemote(cleared);
        setSettings(cleared);
      },
      commitProfileSetup: () => {
        setSettings((current) => prepareProfileSettingsForPersistence(current));
      },
      syncStatus,
      syncError,
    }),
    [settings, syncError, syncStatus, userId],
  );

  return <ProfileSettingsContext.Provider value={value}>{children}</ProfileSettingsContext.Provider>;
}

export function useProfileSettings(): ProfileSettingsContextValue {
  const context = useContext(ProfileSettingsContext);
  if (!context) {
    throw new Error('useProfileSettings must be used within ProfileSettingsProvider');
  }
  return context;
}

export { defaultProfileSettings };
