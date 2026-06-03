import { useAuth0 } from '@auth0/auth0-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  fetchProfile as fetchProfileRequest,
  profileRecordToSettings,
  saveProfileRecord,
  settingsToProfileRecord,
  type ProfileRecord,
} from '../auth/supabase-client';
import { getAccessTokenRequestOptions } from '../auth/auth0-config';
import {
  clearProfileSettings,
  defaultProfileSettings,
  isProfileComplete,
  loadProfileSettings,
  normalizeProfileSettingsDraft,
  parseProfileSettingsBaseline,
  prepareProfileSettingsForPersistence,
  profileSettingsBaseline,
  reconcileProfileSettings,
  saveProfileSettings,
  type Campus,
  type ProfileSettings,
  type TargetRole,
} from '../lib/profile-settings';
import type { ActivityType } from '../types/analysis';

interface ProfileSettingsContextValue {
  settings: ProfileSettings;
  profileComplete: boolean;
  isDirty: boolean;
  setDisplayName: (displayName: string) => void;
  setMajor: (major: string) => void;
  setCampus: (campus: Campus | '') => void;
  setBooleanPref: (key: BooleanPrefKey, value: boolean) => void;
  setTargetRole: (targetRole: TargetRole) => void;
  toggleActivityInterest: (interest: ActivityType) => void;
  setGraduationYear: (graduationYear: string) => void;
  resetSettings: () => void;
  saveProfile: () => Promise<void>;
  revertToSavedBaseline: () => void;
  isProfileDirty: () => boolean;
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
  return profileSettingsBaseline(settings);
}

export function ProfileSettingsProvider({ children }: ProfileSettingsProviderProps) {
  const { getAccessTokenSilently, isAuthenticated, isLoading, user } = useAuth0();
  const userId = user?.sub;
  const [settings, setSettings] = useState<ProfileSettings>(defaultProfileSettings);
  const [savedBaseline, setSavedBaseline] = useState('');
  const [syncStatus, setSyncStatus] = useState<ProfileSettingsContextValue['syncStatus']>('local');
  const [syncError, setSyncError] = useState<string | null>(null);
  const lastRemoteSettingsRef = useRef('');
  const savedBaselineRef = useRef('');
  const settingsRef = useRef(defaultProfileSettings);
  const activeUserIdRef = useRef<string | undefined>(undefined);

  settingsRef.current = settings;

  function updateSettings(updater: (current: ProfileSettings) => ProfileSettings) {
    setSettings((current) => normalizeProfileSettingsDraft(updater(current)));
  }

  const syncBaseline = useCallback((next: ProfileSettings) => {
    const persisted = prepareProfileSettingsForPersistence(next);
    const baseline = serializeForRemote(persisted);
    savedBaselineRef.current = baseline;
    setSavedBaseline(baseline);
    return persisted;
  }, []);

  const isProfileDirty = useCallback(() => {
    const baseline = savedBaselineRef.current;
    if (!baseline) {
      return false;
    }
    return serializeForRemote(settingsRef.current) !== baseline;
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !userId) {
      activeUserIdRef.current = undefined;
      setSyncStatus('local');
      setSyncError(null);
      lastRemoteSettingsRef.current = '';
      savedBaselineRef.current = '';
      setSavedBaseline('');
      setSettings(defaultProfileSettings);
      return;
    }

    if (activeUserIdRef.current === userId) {
      return;
    }

    activeUserIdRef.current = userId;
    setSyncError(null);
    lastRemoteSettingsRef.current = '';
    const loaded = loadProfileSettings(userId);
    syncBaseline(loaded);
    setSettings(loaded);
  }, [isAuthenticated, isLoading, syncBaseline, userId]);

  useEffect(() => {
    if (!userId || !isAuthenticated) {
      return;
    }

    saveProfileSettings(settings, userId);
  }, [isAuthenticated, settings, userId]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !userId) {
      return;
    }

    let cancelled = false;

    async function loadRemoteProfile(activeUserId: string) {
      setSyncStatus('loading');
      setSyncError(null);

      let data: ProfileRecord | null = null;
      try {
        const token = await getAccessTokenSilently(getAccessTokenRequestOptions());
        data = await fetchProfileRequest(token);
      } catch (error) {
        if (!cancelled) {
          setSyncStatus('error');
          setSyncError((error as Error).message || 'Profile sync failed.');
        }
        return;
      }

      if (cancelled) {
        return;
      }

      if (data) {
        const remoteSettings = profileRecordToSettings(data);
        const localSettings = settingsRef.current;
        const merged = reconcileProfileSettings(localSettings, remoteSettings);
        lastRemoteSettingsRef.current = serializeForRemote(remoteSettings);
        syncBaseline(merged);
        settingsRef.current = merged;
        setSettings(merged);
      } else {
        const localSettings = settingsRef.current;
        let merged = reconcileProfileSettings(localSettings, null);
        if (!merged.displayName.trim()) {
          const suggestedName = authDisplayName(user);
          if (suggestedName) {
            merged = normalizeProfileSettingsDraft({ ...merged, displayName: suggestedName });
          }
        }
        lastRemoteSettingsRef.current = '';
        syncBaseline(merged);
        settingsRef.current = merged;
        setSettings(merged);
      }

      setSyncStatus(serializeForRemote(settingsRef.current) === lastRemoteSettingsRef.current ? 'synced' : 'local');
    }

    void loadRemoteProfile(userId);

    return () => {
      cancelled = true;
    };
  }, [getAccessTokenSilently, isAuthenticated, isLoading, user, userId]);

  const isDirty = useMemo(() => isProfileDirty(), [isProfileDirty, savedBaseline, settings]);

  const revertToSavedBaseline = useCallback(() => {
    const baseline = savedBaselineRef.current;
    if (!baseline) {
      return;
    }
    const restored = parseProfileSettingsBaseline(baseline);
    settingsRef.current = restored;
    setSettings(restored);
  }, []);

  const saveProfile = useCallback(async () => {
    if (!userId) {
      const message = 'Sign in before saving your profile.';
      setSyncStatus('error');
      setSyncError(message);
      throw new Error(message);
    }

    const persisted = prepareProfileSettingsForPersistence(settingsRef.current, { stampCompletion: true });

    setSyncStatus('loading');
    setSyncError(null);

    try {
      const token = await getAccessTokenSilently(getAccessTokenRequestOptions());
      const savedProfile = await saveProfileRecord(token, settingsToProfileRecord(userId, persisted));
      const savedSettings = profileRecordToSettings(savedProfile);
      const nextSettings = reconcileProfileSettings(persisted, savedSettings);

      syncBaseline(nextSettings);
      saveProfileSettings(nextSettings, userId);
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      lastRemoteSettingsRef.current = serializeForRemote(nextSettings);
      setSyncStatus('synced');
    } catch (error) {
      const message = (error as Error).message || 'Profile sync failed.';
      setSyncStatus('error');
      setSyncError(message);
      throw error;
    }
  }, [getAccessTokenSilently, syncBaseline, userId]);

  const value = useMemo<ProfileSettingsContextValue>(
    () => ({
      settings,
      profileComplete: isProfileComplete(settings),
      isDirty,
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
        syncBaseline(cleared);
        settingsRef.current = cleared;
        setSettings(cleared);
      },
      saveProfile,
      revertToSavedBaseline,
      isProfileDirty,
      syncStatus,
      syncError,
    }),
    [isDirty, isProfileDirty, saveProfile, revertToSavedBaseline, settings, syncBaseline, syncError, syncStatus, userId],
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
