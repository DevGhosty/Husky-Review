import { Link } from 'react-router-dom';
import { Bell, GraduationCap, LockKeyhole, Settings2, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Surface } from '../components/layout/surface';
import { useReview } from '../context/review-context';

const preferenceItems = [
  { label: 'Prioritize In-Time activities', value: 'On' },
  { label: 'Show source verification dates', value: 'On' },
  { label: 'Include long-term opportunities', value: 'On' },
];

const privacyItems = [
  'Resume/session data is designed to be deleted after one hour.',
  'API keys and backend services are not used in this mocked frontend.',
  'Future authenticated settings should be stored server-side with access controls.',
];

export function ProfilePage() {
  const { status, fileName, selectedIds, showSampleReview } = useReview();
  const completion = Math.min(100, (fileName ? 38 : 0) + (status === 'success' ? 42 : 0) + Math.min(selectedIds.length, 4) * 5);

  return (
    <main>
      <section className="mx-auto max-w-[86rem] px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <Surface variant="dark" className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-husky-gold/20 blur-3xl motion-safe:animate-breathe" aria-hidden="true" />
            <div className="relative flex items-center gap-4">
              <Avatar className="size-20 ring-4 ring-white/10">
                <AvatarFallback className="bg-white text-2xl font-black text-husky-purple">S</AvatarFallback>
              </Avatar>
              <div>
                <Badge tone="gold" className="rounded-full px-4 py-2">
                  Student preview
                </Badge>
                <h1 className="mt-3 text-3xl font-black tracking-normal text-white sm:text-4xl">UWB career profile</h1>
                <p className="mt-2 text-sm font-medium text-white/65">Mock preferences for roadmap personalization.</p>
              </div>
            </div>

            <div className="relative mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.08] p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-white/70">Readiness workspace</p>
                <p className="text-2xl font-black text-husky-gold-bright">{completion}%</p>
              </div>
              <Progress value={completion} className="mt-3 h-2.5 bg-white/10 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-husky-gold [&_[data-slot=progress-indicator]]:to-white" />
              <p className="mt-3 text-sm leading-6 text-white/65">
                Completion reflects current mocked review state, selected recommendations, and whether a sample resume has been loaded.
              </p>
            </div>

            <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
              <Button asChild variant="secondary" className="h-12">
                <Link to="/app#workflow">Start review</Link>
              </Button>
              <Button className="h-12 bg-white text-husky-purple hover:bg-husky-gold/90" onClick={showSampleReview}>
                Load sample profile
              </Button>
            </div>
          </Surface>

          <div className="grid gap-5">
            <Surface variant="premium" className="rounded-[2rem] p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-husky-purple/[0.10] text-husky-purple">
                  <Settings2 className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-2xl font-black text-foreground">Review preferences</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    These controls are display-only in this frontend pass, designed to show where future authenticated settings can connect.
                  </p>
                </div>
              </div>
              <Separator className="my-5 bg-husky-line" />
              <div className="grid gap-3">
                {preferenceItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-husky-line bg-white/80 p-4">
                    <span className="text-sm font-black text-foreground">{item.label}</span>
                    <Badge tone="green">{item.value}</Badge>
                  </div>
                ))}
              </div>
            </Surface>

            <div className="grid gap-5 md:grid-cols-2">
              <Surface variant="card" className="rounded-[1.7rem] p-5">
                <span className="grid size-12 place-items-center rounded-2xl bg-husky-gold/20 text-[#9f7100]">
                  <GraduationCap className="size-6" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-xl font-black text-foreground">Student context</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The UI is tuned for UWB students seeking role-specific resume improvements and campus-connected next steps.
                </p>
              </Surface>
              <Surface variant="card" className="rounded-[1.7rem] p-5">
                <span className="grid size-12 place-items-center rounded-2xl bg-husky-purple/[0.10] text-husky-purple">
                  <Bell className="size-6" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-xl font-black text-foreground">Notifications preview</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Future reminders could help students revisit deadlines, source checks, and saved roadmap items.
                </p>
              </Surface>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[86rem] px-5 pb-16 sm:px-8 lg:px-12">
        <Surface variant="premium" className="rounded-[2rem] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <Badge tone="green" className="rounded-full px-4 py-2">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Privacy posture
              </Badge>
              <h2 className="mt-4 text-3xl font-black tracking-normal text-foreground">Clear boundaries for the mocked product.</h2>
            </div>
            <div className="grid gap-3">
              {privacyItems.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-husky-line bg-white/85 p-4">
                  <LockKeyhole className="mt-0.5 size-5 shrink-0 text-husky-purple" aria-hidden="true" />
                  <p className="text-sm font-semibold leading-6 text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </Surface>
      </section>
    </main>
  );
}
