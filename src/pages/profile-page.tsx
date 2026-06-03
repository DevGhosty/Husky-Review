import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useBlocker, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  GraduationCap,
  LockKeyhole,
  MapPin,
  Palette,
  Sparkles,
  Target,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useProfileSettings } from '../context/profile-settings-context';
import { sanitizeAppReturnTo } from '../auth/auth0-config';
import { useReview } from '../context/review-context';
import { MajorCombobox } from '../components/major-combobox';
import { ACTIVITY_INTEREST_OPTIONS } from '../data/uwb-catalog';
import {
  campusLabel,
  campusOptions,
  hasRequiredProfileFields,
  profileSectionHref,
  profileSections,
  type ProfileSectionId,
  type TargetRole,
} from '../lib/profile-settings';
import { cn } from '../lib/utils';
import { Surface } from '../components/layout/surface';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Switch } from '../components/ui/switch';

const sectionIcons = {
  overview: UserRound,
  preferences: Sparkles,
  notifications: Bell,
  'career-goals': Target,
  appearance: Palette,
} as const;

const targetRoleOptions: { id: TargetRole; label: string }[] = [
  { id: 'internship', label: 'Internship' },
  { id: 'co-op', label: 'Co-op' },
  { id: 'full-time', label: 'Full-time' },
];

const graduationYears = ['2025', '2026', '2027', '2028', '2029'];

const selectClassName =
  'h-11 w-full rounded-xl border border-input bg-card px-3 text-sm font-semibold text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-card dark:text-foreground [color-scheme:light] dark:[color-scheme:dark]';

const trustSummaryItems = [
  'Resumes and analysis stay scoped to your signed-in account.',
  'Profile preferences sync to Supabase when configured.',
];

function getActiveSection(hash: string): ProfileSectionId {
  const normalized = hash.replace('#', '');
  if (normalized === 'privacy') {
    return 'overview';
  }
  const sectionId = normalized as ProfileSectionId;
  return profileSections.some((section) => section.id === sectionId) ? sectionId : 'overview';
}

function useProfileSectionNav() {
  const location = useLocation();
  const activeSection = useMemo(() => getActiveSection(location.hash), [location.hash]);

  useEffect(() => {
    const sectionId = getActiveSection(location.hash);
    const element = document.getElementById(sectionId);
    if (element) {
      window.setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }, [location.pathname, location.hash]);

  return activeSection;
}

function safeReturnTo(value: string | null) {
  if (!value) {
    return '/app';
  }

  try {
    return sanitizeAppReturnTo(decodeURIComponent(value));
  } catch {
    return sanitizeAppReturnTo(value);
  }
}

function SettingSwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inset-row flex items-start justify-between gap-4 rounded-2xl p-4">
      <div className="min-w-0">
        <p className="text-sm font-black text-foreground">{label}</p>
        {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={label} />
    </div>
  );
}

function SectionPanel({
  id,
  title,
  description,
  icon: Icon,
  children,
}: {
  id: ProfileSectionId;
  title: string;
  description: string;
  icon: typeof UserRound;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <Surface variant="premium" className="rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-black text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-6">{children}</div>
      </Surface>
    </section>
  );
}

export function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeSection = useProfileSectionNav();
  const { status, fileName, selectedIds } = useReview();
  const {
    settings,
    profileComplete,
    isDirty,
    setDisplayName,
    setMajor,
    setCampus,
    setBooleanPref,
    setTargetRole,
    toggleActivityInterest,
    setGraduationYear,
    resetSettings,
    saveProfile,
    revertToSavedBaseline,
    isProfileDirty,
    syncStatus,
    syncError,
  } = useProfileSettings();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const isSetupMode = searchParams.get('setup') === '1';
  const requiredProfileFields = [
    Boolean(settings.displayName.trim()),
    Boolean(settings.major.trim()),
    Boolean(settings.campus),
  ];
  const profileCompletion = Math.round((requiredProfileFields.filter(Boolean).length / requiredProfileFields.length) * 100);
  const profileReady = hasRequiredProfileFields(settings);
  const workspaceCompletion = Math.min(100, (fileName ? 38 : 0) + (status === 'success' ? 42 : 0) + Math.min(selectedIds.length, 4) * 5);
  const isSaving = syncStatus === 'loading';
  const showSetupBanner = isSetupMode;
  const showOverviewSaveBar = isSetupMode || !profileComplete || isDirty;
  const overviewSaveDisabled = isSetupMode || !profileComplete ? !profileReady || isSaving : !isDirty || isSaving;
  const overviewSaveLabel = isSaving
    ? 'Saving…'
    : isSetupMode
      ? 'Save & continue'
      : !profileComplete
        ? 'Save profile'
        : 'Save changes';

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isProfileDirty() &&
      currentLocation.pathname === '/app/profile' &&
      nextLocation.pathname !== '/app/profile',
  );

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return;
    }

    const leave = window.confirm(
      'You have unsaved profile changes. Leave without saving? Your edits will be discarded.',
    );
    if (leave) {
      revertToSavedBaseline();
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker.state, revertToSavedBaseline]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isProfileDirty()) {
        return;
      }
      event.preventDefault();
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProfileDirty]);

  const initials = (settings.displayName || 'UW')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function handleClearSettings() {
    if (window.confirm('Reset all profile settings to defaults? This only clears local browser preferences.')) {
      resetSettings();
    }
  }

  async function handleCompleteProfile() {
    if (!profileReady) {
      return;
    }

    await saveProfile();
    if (isSetupMode) {
      navigate(returnTo, { replace: true });
    }
  }

  async function handleOverviewSave() {
    if (isSetupMode || !profileComplete) {
      await handleCompleteProfile();
      return;
    }

    await saveProfile();
  }

  const handleSaveProfile = useCallback(() => {
    void saveProfile();
  }, [saveProfile]);

  function renderHeroAction() {
    if (isSetupMode) {
      return (
        <Button
          type="button"
          className="h-12 bg-husky-gold text-husky-purple hover:bg-husky-gold/90"
          disabled={!profileReady || isSaving}
          onClick={() => {
            void handleCompleteProfile();
          }}
        >
          {isSaving ? 'Saving…' : 'Save & continue'}
        </Button>
      );
    }

    if (!profileComplete) {
      return (
        <Button
          type="button"
          className="h-12 bg-husky-gold text-husky-purple hover:bg-husky-gold/90"
          disabled={!profileReady || isSaving}
          onClick={() => {
            void handleCompleteProfile();
          }}
        >
          {isSaving ? 'Saving…' : 'Save profile'}
        </Button>
      );
    }

    return (
      <Button
        type="button"
        variant="outline"
        className="h-12 border-white/20 text-white hover:bg-white/10 hover:text-white"
        disabled={!isDirty || isSaving}
        onClick={handleSaveProfile}
      >
        {isSaving ? 'Saving…' : 'Save changes'}
      </Button>
    );
  }

  return (
    <main>
      <section className="mx-auto max-w-[86rem] px-5 py-10 sm:px-8 lg:px-12">
        <Surface variant="dark" className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-husky-gold/20 blur-3xl motion-safe:animate-breathe" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <span className="grid size-20 place-items-center rounded-full bg-white text-2xl font-black text-husky-purple ring-4 ring-white/10">
                {initials}
              </span>
              <div>
                <Badge tone="gold" className="rounded-full px-4 py-2">
                  {profileComplete ? 'Student workspace' : 'Profile setup'}
                </Badge>
                <h1 className="type-page-title mt-3 max-w-2xl text-white">
                  {settings.displayName.trim() || 'Build your UW profile'}
                </h1>
                <p className="mt-2 text-sm font-medium text-white/65">
                  {settings.major.trim() || 'Major not set'} - {campusLabel(settings.campus)}
                </p>
                {isDirty ? (
                  <p className="mt-2 text-xs font-semibold text-husky-gold">
                    {profileComplete ? 'Unsaved changes' : 'Save your profile to continue'}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid w-full gap-3 lg:w-auto lg:min-w-[12rem]">{renderHeroAction()}</div>
          </div>
        </Surface>

        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {profileSections.map((section) => (
            <Link
              key={section.id}
              to={profileSectionHref(section.id)}
              className={cn(
                'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-black transition-[color,background-color,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                activeSection === section.id
                  ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                  : 'border-border bg-card/85 text-muted-foreground hover:border-husky-gold hover:text-primary dark:hover:border-primary/50',
              )}
            >
              {section.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[86rem] gap-6 px-5 pb-16 sm:px-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-12">
        <nav className="sticky top-6 hidden lg:block" aria-label="Profile sections">
          <Surface variant="card" className="rounded-[1.6rem] p-3">
            <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-muted-foreground">Settings</p>
            <ul className="space-y-1">
              {profileSections.map((section) => {
                const Icon = sectionIcons[section.id];
                const isActive = activeSection === section.id;
                return (
                  <li key={section.id}>
                    <Link
                      to={profileSectionHref(section.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {section.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Surface>
        </nav>

        <div className="grid gap-6">
          <SectionPanel
            id="overview"
            title={isSetupMode ? 'Complete your profile' : 'Overview'}
            description="Name, major, and campus are required so recommendations start with the right UW opportunities."
            icon={UserRound}
          >
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={settings.displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name"
                  className="h-11 rounded-xl px-3"
                />
              </div>
              <MajorCombobox
                id="major"
                value={settings.major}
                onChange={setMajor}
                placeholder="Search majors — Computer Science, Informatics, Nursing..."
              />
              <div className="space-y-2">
                <Label htmlFor="campus">Campus</Label>
                <select
                  id="campus"
                  value={settings.campus}
                  onChange={(event) => setCampus(event.target.value as typeof settings.campus)}
                  className={selectClassName}
                >
                  <option value="">Select campus</option>
                  {campusOptions.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="graduation-year">Graduation year</Label>
                <select
                  id="graduation-year"
                  value={settings.graduationYear}
                  onChange={(event) => setGraduationYear(event.target.value)}
                  className={selectClassName}
                >
                  {graduationYears.map((year) => (
                    <option key={year} value={year}>
                      Class of {year}
                    </option>
                  ))}
                </select>
              </div>
              {profileComplete ? (
                <p className="text-sm leading-6 text-muted-foreground lg:col-span-2 lg:self-center">
                  Campus scope for recommendations is configured in{' '}
                  <Link to={profileSectionHref('preferences')} className="font-semibold text-primary hover:underline">
                    Review preferences
                  </Link>
                  .
                </p>
              ) : null}
            </div>

            {showOverviewSaveBar ? (
              <div className="mt-6 rounded-[1.4rem] border border-primary/25 bg-primary/5 p-5 dark:bg-primary/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-foreground">
                      {isSetupMode ? 'Save to finish setup' : profileComplete ? 'Unsaved changes' : 'Save your profile'}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {profileReady
                        ? isSetupMode
                          ? 'Save your basics once, then continue to the workspace.'
                          : 'Save name, major, and campus so recommendations use the right UW context.'
                        : 'Fill in display name, major, and campus to enable save.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="h-11 min-w-[10rem] shrink-0"
                    disabled={overviewSaveDisabled}
                    onClick={() => {
                      void handleOverviewSave();
                    }}
                  >
                    {overviewSaveLabel}
                  </Button>
                </div>
              </div>
            ) : null}

            {showSetupBanner ? (
              <div className="mt-5 rounded-[1.4rem] border border-husky-gold/35 bg-husky-gold/10 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-black text-foreground">
                      {profileReady ? <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" /> : <MapPin className="size-5 text-primary" aria-hidden="true" />}
                      {profileReady ? 'Profile ready' : 'Profile required'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {profileReady
                        ? 'Required fields are filled. Use Save & continue above or below to finish setup.'
                        : 'Complete these basics once, then Husky-Review can filter campus opportunities on every review.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="h-11"
                    disabled={!profileReady || isSaving}
                    onClick={() => {
                      void handleCompleteProfile();
                    }}
                  >
                    {isSaving ? 'Saving…' : profileReady ? 'Save & continue' : 'Complete required fields'}
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {profileComplete ? (
                <>
                  <Badge tone="green">Profile complete</Badge>
                  <Badge tone="purple">{settings.major.trim() || 'Major not set'}</Badge>
                  <Badge tone="gray">{campusLabel(settings.campus)}</Badge>
                  <Badge tone={syncStatus === 'synced' ? 'green' : syncStatus === 'error' ? 'gold' : 'gray'}>
                    {syncStatus === 'synced' ? 'Profile synced' : syncStatus === 'loading' ? 'Syncing profile' : 'Local fallback'}
                  </Badge>
                </>
              ) : (
                <>
                  <Badge tone="gold">{`${profileCompletion}% profile`}</Badge>
                  <Badge tone="purple">{settings.major.trim() || 'Major not set'}</Badge>
                  <Badge tone="gray">{campusLabel(settings.campus)}</Badge>
                  <Badge tone={syncStatus === 'synced' ? 'green' : syncStatus === 'error' ? 'gold' : 'gray'}>
                    {syncStatus === 'synced' ? 'Profile synced' : syncStatus === 'loading' ? 'Syncing profile' : 'Local fallback'}
                  </Badge>
                  <Badge tone={status === 'success' ? 'green' : 'gray'}>
                    {status === 'success' ? 'Review loaded' : 'No active review'}
                  </Badge>
                </>
              )}
            </div>
            {syncError ? <p className="mt-3 text-sm font-semibold text-amber-700 dark:text-amber-300">{syncError}</p> : null}

            {!profileComplete ? (
              <div className="mt-6 rounded-[1.4rem] border border-border bg-muted/30 p-5 dark:bg-muted/20">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">Readiness workspace</p>
                  <p className="text-2xl font-black text-primary">{workspaceCompletion}%</p>
                </div>
                <Progress
                  value={workspaceCompletion}
                  className="mt-3 h-2.5 bg-muted [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-husky-purple [&_[data-slot=progress-indicator]]:to-husky-gold"
                />
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Completion reflects current review state, selected recommendations, and whether a resume has been loaded.
                </p>
              </div>
            ) : null}

            <div className="mt-6 rounded-[1.4rem] border border-border bg-muted/30 p-5 dark:bg-muted/20">
              <p className="text-sm font-black text-foreground">Data & trust</p>
              <ul className="mt-3 space-y-2">
                {trustSummaryItems.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                    <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="secondary" className="h-11">
                  <Link to="/app/legal#privacy">View legal & privacy</Link>
                </Button>
                <Button type="button" variant="destructive" className="h-11 gap-2" onClick={handleClearSettings}>
                  <Trash2 className="size-4" aria-hidden />
                  Clear local settings
                </Button>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel
            id="preferences"
            title="Review preferences"
            description="Choose how recommendations and roadmap actions should be prioritized in the workspace."
            icon={Sparkles}
          >
            <div className="grid gap-3">
              <SettingSwitchRow
                label="Recommend from other campuses"
                description="Expand beyond your home campus when an opportunity is a strong fit."
                checked={settings.includeOtherCampuses}
                onCheckedChange={(checked) => setBooleanPref('includeOtherCampuses', checked)}
                disabled={!settings.campus}
              />
              <SettingSwitchRow
                label="Prioritize In-Time activities"
                description="Surface deadline-friendly actions before longer-term resume builders."
                checked={settings.prioritizeInTime}
                onCheckedChange={(checked) => setBooleanPref('prioritizeInTime', checked)}
              />
              <SettingSwitchRow
                label="Show source verification dates"
                description="Display last-verified metadata on recommendation cards."
                checked={settings.showVerificationDates}
                onCheckedChange={(checked) => setBooleanPref('showVerificationDates', checked)}
              />
              <SettingSwitchRow
                label="Include long-term opportunities"
                description="Keep Next-Time activities visible for future recruiting cycles."
                checked={settings.includeLongTerm}
                onCheckedChange={(checked) => setBooleanPref('includeLongTerm', checked)}
              />
            </div>
          </SectionPanel>

          <SectionPanel
            id="notifications"
            title="Notifications"
            description="Control which workspace updates appear in the bell menu and future reminder channels."
            icon={Bell}
          >
            <div className="grid gap-3">
              <SettingSwitchRow
                label="Deadline reminders"
                description="Alert when an application deadline is approaching."
                checked={settings.deadlineReminders}
                onCheckedChange={(checked) => setBooleanPref('deadlineReminders', checked)}
              />
              <SettingSwitchRow
                label="Roadmap update alerts"
                description="Notify when recommendations are attached to your plan."
                checked={settings.roadmapAlerts}
                onCheckedChange={(checked) => setBooleanPref('roadmapAlerts', checked)}
              />
              <SettingSwitchRow
                label="New verified resources"
                description="Highlight when UW activity records are refreshed."
                checked={settings.resourceUpdates}
                onCheckedChange={(checked) => setBooleanPref('resourceUpdates', checked)}
              />
              <SettingSwitchRow
                label="Weekly email digest"
                description="Coming soon."
                checked={settings.emailDigest}
                onCheckedChange={(checked) => setBooleanPref('emailDigest', checked)}
                disabled
              />
            </div>
          </SectionPanel>

          <SectionPanel
            id="career-goals"
            title="Career goals"
            description="Tell Husky-Review what kind of roles and campus opportunities you want prioritized."
            icon={Target}
          >
            <div className="space-y-6">
              <div>
                <p className="text-sm font-black text-foreground">Target role type</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {targetRoleOptions.map((option) => (
                    <Button
                      key={option.id}
                      type="button"
                      variant={settings.targetRole === option.id ? 'primary' : 'secondary'}
                      className="h-10"
                      onClick={() => setTargetRole(option.id)}
                      aria-pressed={settings.targetRole === option.id}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-black text-foreground">Activity interests</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select the kinds of UW classes, clubs, and activities you want prioritized when we match your resume to campus opportunities.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ACTIVITY_INTEREST_OPTIONS.map((option) => {
                    const selected = settings.activityInterests.includes(option.id);
                    return (
                      <Button
                        key={option.id}
                        type="button"
                        variant={selected ? 'primary' : 'outline'}
                        className="h-10"
                        onClick={() => toggleActivityInterest(option.id)}
                        aria-pressed={selected}
                        title={option.description}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="inset-row flex items-start gap-3 rounded-2xl p-4">
                <GraduationCap className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm leading-6 text-muted-foreground">
                  These map to the activity types Husky-Review pulls from the UW catalog: courses, clubs, events, research, fellowships, and projects. Saved interests filter catalog retrieval and recommendations during review analysis.
                </p>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel
            id="appearance"
            title="Appearance"
            description="Adjust how the workspace looks on your device."
            icon={Palette}
          >
            <div className="inset-row rounded-2xl p-4">
              <p className="text-sm font-black text-foreground">Theme</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use the sun/moon control in the top navigation bar to switch between light and dark mode on any page.
              </p>
            </div>
          </SectionPanel>
        </div>
      </section>
    </main>
  );
}
