import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  GraduationCap,
  LockKeyhole,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useProfileSettings } from '../context/profile-settings-context';
import { useReview } from '../context/review-context';
import { ACTIVITY_INTEREST_OPTIONS, UWB_MAJORS } from '../data/uwb-catalog';
import {
  profileSectionHref,
  profileSections,
  type ProfileSectionId,
  type TargetRole,
} from '../lib/profile-settings';
import { isDarkMode, setTheme } from '../lib/theme';
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
  privacy: ShieldCheck,
} as const;

const targetRoleOptions: { id: TargetRole; label: string }[] = [
  { id: 'internship', label: 'Internship' },
  { id: 'co-op', label: 'Co-op' },
  { id: 'full-time', label: 'Full-time' },
];

const graduationYears = ['2025', '2026', '2027', '2028', '2029'];

const selectClassName =
  'h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm font-semibold text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';

const privacySummaryItems = [
  'Resume and job posting inputs stay in session state for this frontend prototype.',
  'Profile preferences save locally in your browser only.',
  'No authenticated student records or backend APIs are connected yet.',
];

function getActiveSection(hash: string): ProfileSectionId {
  const normalized = hash.replace('#', '') as ProfileSectionId;
  return profileSections.some((section) => section.id === normalized) ? normalized : 'overview';
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
  const activeSection = useProfileSectionNav();
  const { status, fileName, selectedIds, showSampleReview } = useReview();
  const {
    settings,
    setDisplayName,
    setMajor,
    setBooleanPref,
    setTargetRole,
    toggleActivityInterest,
    setGraduationYear,
    resetSettings,
  } = useProfileSettings();
  const [dark, setDark] = useState(() => isDarkMode());

  const completion = Math.min(100, (fileName ? 38 : 0) + (status === 'success' ? 42 : 0) + Math.min(selectedIds.length, 4) * 5);

  const initials = settings.displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const toggleTheme = useCallback(() => {
    const next = !isDarkMode();
    setTheme(next ? 'dark' : 'light');
    setDark(next);
  }, []);

  function handleClearSettings() {
    if (window.confirm('Reset all profile settings to defaults? This only clears local browser preferences.')) {
      resetSettings();
    }
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
                  Student preview
                </Badge>
                <h1 className="type-page-title mt-3 max-w-2xl text-white">{settings.displayName}</h1>
                <p className="mt-2 text-sm font-medium text-white/65">
                  {settings.major} · Class of {settings.graduationYear}
                </p>
              </div>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[20rem]">
              <Button asChild variant="outline" className="h-12 border-white/20 text-white hover:bg-white/10 hover:text-white">
                <Link to="/app#workflow">Start review</Link>
              </Button>
              <Button className="h-12 bg-white text-husky-purple hover:bg-husky-gold/90" onClick={showSampleReview}>
                Load sample profile
              </Button>
            </div>
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
            title="Overview"
            description="Basic student context and workspace readiness for the mocked review flow."
            icon={UserRound}
          >
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={settings.displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="h-11 rounded-xl px-3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <select
                  id="major"
                  value={settings.major}
                  onChange={(event) => setMajor(event.target.value)}
                  className={selectClassName}
                >
                  {UWB_MAJORS.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>
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
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="purple">{settings.major}</Badge>
              <Badge tone="gray">UWB student preview</Badge>
              <Badge tone={status === 'success' ? 'green' : 'gray'}>
                {status === 'success' ? 'Sample review loaded' : 'No active review'}
              </Badge>
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-border bg-muted/30 p-5 dark:bg-muted/20">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-foreground">Readiness workspace</p>
                <p className="text-2xl font-black text-primary">{completion}%</p>
              </div>
              <Progress
                value={completion}
                className="mt-3 h-2.5 bg-muted [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-husky-purple [&_[data-slot=progress-indicator]]:to-husky-gold"
              />
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Completion reflects current mocked review state, selected recommendations, and whether a sample resume has been loaded.
              </p>
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
                description="Highlight when UWB activity records are refreshed."
                checked={settings.resourceUpdates}
                onCheckedChange={(checked) => setBooleanPref('resourceUpdates', checked)}
              />
              <SettingSwitchRow
                label="Weekly email digest"
                description="Requires Google sign-in before email reminders can be enabled."
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
                  Select the kinds of UW Bothell classes, clubs, and activities you want prioritized when we match your resume to campus opportunities.
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
                  These map to the activity types Husky-Review pulls from the UWB catalog—courses, clubs, events, research, fellowships, and projects. Preferences are stored locally and can later inform ranking once authenticated student profiles are connected.
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
            <div className="inset-row flex items-center justify-between gap-4 rounded-2xl p-4">
              <div>
                <p className="text-sm font-black text-foreground">Theme</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Switch between light and dark mode. This uses the same setting as the header toggle.
                </p>
              </div>
              <Button type="button" variant="secondary" className="h-11 gap-2" onClick={toggleTheme} aria-pressed={dark}>
                {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
                {dark ? 'Light mode' : 'Dark mode'}
              </Button>
            </div>
          </SectionPanel>

          <SectionPanel
            id="privacy"
            title="Privacy & data"
            description="Understand what this prototype stores and how to reset your local profile settings."
            icon={ShieldCheck}
          >
            <div className="grid gap-3">
              {privacySummaryItems.map((item) => (
                <div key={item} className="inset-row flex items-start gap-3 rounded-2xl p-4">
                  <LockKeyhole className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-sm font-semibold leading-6 text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="secondary" className="h-12">
                <Link to="/app/privacy">Open full privacy page</Link>
              </Button>
              <Button type="button" variant="destructive" className="h-12 gap-2" onClick={handleClearSettings}>
                <Trash2 className="size-4" aria-hidden />
                Clear local settings
              </Button>
            </div>
          </SectionPanel>
        </div>
      </section>
    </main>
  );
}
