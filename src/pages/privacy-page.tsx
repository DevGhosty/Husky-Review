import { CheckCircle2, Clock3, Database, EyeOff, FileWarning, LockKeyhole, ServerOff, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Surface } from '../components/layout/surface';

const privacyPrinciples = [
  {
    title: 'Session-only resume review',
    detail: 'Resume and job posting inputs are represented as session data in this frontend prototype.',
    icon: Clock3,
  },
  {
    title: 'Private by design',
    detail: 'The review flow is framed around minimum necessary files, clear status text, and visible privacy reminders.',
    icon: LockKeyhole,
  },
  {
    title: 'No hidden profile storage',
    detail: 'Saved preferences in this mock UI are local product state, not authenticated student records.',
    icon: EyeOff,
  },
];

const privacyList = [
  { label: 'Resume files', value: 'Mock upload only', icon: FileWarning },
  { label: 'Job posting URL', value: 'Used to demonstrate matching workflow', icon: ShieldCheck },
  { label: 'Generated analysis', value: 'Stored only in shared frontend state', icon: Database },
  { label: 'Deletion policy', value: 'Designed around one-hour session expiry language', icon: Trash2 },
  { label: 'External services', value: 'No live AI, storage, or backend APIs are called here', icon: ServerOff },
  { label: 'Future account data', value: 'Should use server-side access controls before launch', icon: CheckCircle2 },
];

export function PrivacyPage() {
  return (
    <main>
      <section className="relative mx-auto max-w-[86rem] px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <Surface variant="dark" className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
            <div className="absolute -right-24 -top-20 size-72 rounded-full bg-husky-gold/25 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <Badge tone="gold" className="rounded-full border-white/15 bg-white/[0.08] px-4 py-2 text-white">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Privacy command center
              </Badge>
              <h1 className="mt-5 max-w-xl font-display text-4xl font-black leading-[0.98] tracking-normal text-white sm:text-6xl">
                Clear handling for every resume signal.
              </h1>
              <p className="mt-5 max-w-xl text-base font-medium leading-7 text-white/70">
                This tab gathers the privacy-related product boundaries in one place, matching the dashboard promise that files stay private and scoped to the current review session.
              </p>
            </div>

            <div className="relative mt-8 grid gap-3">
              {privacyPrinciples.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-husky-purple">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="text-base font-black text-white">{item.title}</h2>
                        <p className="mt-1 text-sm font-medium leading-6 text-white/65">{item.detail}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </Surface>

          <Surface variant="premium" className="rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 border-b border-husky-line pb-5 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-black tracking-normal text-foreground sm:text-3xl">Privacy inventory</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-muted-foreground">
                  The items below list what the current product surface says or implies about student data.
                </p>
              </div>
              <Badge tone="green" className="w-fit rounded-full px-4 py-2">
                Frontend mock
              </Badge>
            </div>

            <div className="mt-5 grid gap-3">
              {privacyList.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.label} className="flex items-center gap-4 rounded-2xl border border-husky-line bg-white/85 p-4 shadow-soft">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-husky-purple/[0.08] text-husky-purple">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-foreground">{item.label}</h3>
                      <p className="mt-1 text-sm font-medium leading-5 text-muted-foreground">{item.value}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </Surface>
        </div>
      </section>
    </main>
  );
}
