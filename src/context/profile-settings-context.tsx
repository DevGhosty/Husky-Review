import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  clearProfileSettings,
  defaultProfileSettings,
  loadProfileSettings,
  saveProfileSettings,
  type ProfileSettings,
  type TargetRole,
} from '../lib/profile-settings';
import type { ActivityType } from '../types/analysis';

interface ProfileSettingsContextValue {
  settings: ProfileSettings;
  setDisplayName: (displayName: string) => void;
  setMajor: (major: string) => void;
  setBooleanPref: (key: BooleanPrefKey, value: boolean) => void;
  setTargetRole: (targetRole: TargetRole) => void;
  toggleActivityInterest: (interest: ActivityType) => void;
  setGraduationYear: (graduationYear: string) => void;
  resetSettings: () => void;
}

type BooleanPrefKey =
  | 'prioritizeInTime'
  | 'showVerificationDates'
  | 'includeLongTerm'
  | 'deadlineReminders'
  | 'roadmapAlerts'
  | 'resourceUpdates'
  | 'emailDigest';

const ProfileSettingsContext = createContext<ProfileSettingsContextValue | null>(null);

interface ProfileSettingsProviderProps {
  children: ReactNode;
}

export function ProfileSettingsProvider({ children }: ProfileSettingsProviderProps) {
  const [settings, setSettings] = useState<ProfileSettings>(() => loadProfileSettings());

  useEffect(() => {
    saveProfileSettings(settings);
  }, [settings]);

  const value = useMemo<ProfileSettingsContextValue>(
    () => ({
      settings,
      setDisplayName: (displayName) => {
        setSettings((current) => ({ ...current, displayName }));
      },
      setMajor: (major) => {
        setSettings((current) => ({ ...current, major }));
      },
      setBooleanPref: (key, value) => {
        setSettings((current) => ({ ...current, [key]: value }));
      },
      setTargetRole: (targetRole) => {
        setSettings((current) => ({ ...current, targetRole }));
      },
      toggleActivityInterest: (interest) => {
        setSettings((current) => {
          const hasInterest = current.activityInterests.includes(interest);
          const activityInterests = hasInterest
            ? current.activityInterests.filter((item) => item !== interest)
            : [...current.activityInterests, interest];
          return { ...current, activityInterests };
        });
      },
      setGraduationYear: (graduationYear) => {
        setSettings((current) => ({ ...current, graduationYear }));
      },
      resetSettings: () => {
        setSettings(clearProfileSettings());
      },
    }),
    [settings],
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
