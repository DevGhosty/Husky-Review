import { Link, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  Clock3,
  Database,
  EyeOff,
  FileText,
  FileWarning,
  LockKeyhole,
  Scale,
  ServerOff,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useEffect } from 'react';
import { Badge } from '../components/ui/badge';
import { Surface } from '../components/layout/surface';
import { cn } from '../lib/utils';

const privacyPrinciples = [
  {
    title: 'Private resume storage',
    detail: 'Uploaded resumes are stored in a private Supabase bucket and scoped to the signed-in Auth0 user.',
    icon: Clock3,
  },
  {
    title: 'Private by design',
    detail: 'The review flow is framed around minimum necessary files, clear status text, and visible privacy reminders.',
    icon: LockKeyhole,
  },
  {
    title: 'Account-scoped profile settings',
    detail: 'Profile preferences sync to Supabase after sign-in, with local browser settings used only as a fallback.',
    icon: EyeOff,
  },
];

const privacyList = [
  { label: 'Resume files', value: 'Private Supabase object paths with short-lived signed links', icon: FileWarning },
  { label: 'Job posting URL', value: 'Stored with the review record for reopening saved analysis', icon: ShieldCheck },
  { label: 'Generated analysis', value: 'Stored in account-scoped review records in Supabase', icon: Database },
  { label: 'Deletion policy', value: 'Saved-review resumes stay until you delete them; unused uploads may purge after 7 days', icon: Trash2 },
  { label: 'External services', value: 'Auth0, Supabase, and optional server-side Gemini analysis are used for the product workflow', icon: ServerOff },
  { label: 'Account data', value: 'Server APIs verify Auth0 tokens before touching Supabase service-role operations', icon: CheckCircle2 },
];

const termsSections = [
  {
    title: 'Educational tool',
    body: 'Husky-Review is a student-built workspace for exploring UW resume feedback and campus opportunities. It is not official UW career advising, legal counsel, or a guarantee of admission or employment outcomes.',
  },
  {
    title: 'Your responsibilities',
    body: 'You are responsible for the accuracy of information you provide, for reviewing AI-generated suggestions before acting on them, and for following employer, course, and university policies when applying to roles or programs.',
  },
  {
    title: 'Acceptable use',
    body: 'Do not upload content you do not have rights to share, attempt to access another student’s data, or use the service to harass, spam, or disrupt campus systems. We may suspend access for abuse or security risk.',
  },
  {
    title: 'Data retention',
    body: 'Resumes linked to a saved review remain in your account until you delete them. Uploads that were never used in a review may be removed automatically after seven days. Profile settings, saved reviews, and analysis outputs remain until you delete them.',
  },
  {
    title: 'Changes',
    body: 'We may update these terms and privacy descriptions as the product evolves. Material changes will be reflected on this page with an updated effective date.',
  },
];

const legalNav = [
  { id: 'privacy', label: 'Privacy policy' },
  { id: 'terms', label: 'Terms of service' },
] as const;

type LegalSectionId = (typeof legalNav)[number]['id'];

function legalHref(sectionId: LegalSectionId, pathname: string): string {
  const base = pathname.startsWith('/app') ? '/app/legal' : '/legal';
  return `${base}#${sectionId}`;
}

export function LegalPage() {
  const location = useLocation();
  const isApp = location.pathname.startsWith('/app');

  useEffect(() => {
    const id = location.hash.replace(/^#/, '') as LegalSectionId;
    if (!id) {
      return;
    }
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return (
    <main>
      <section className="relative mx-auto max-w-[86rem] px-5 pt-10 pb-16 sm:px-8 lg:px-12">
        <Surface variant="dark" className="relative mb-8 overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="absolute -right-24 -top-20 size-72 rounded-full bg-husky-gold/25 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <Badge tone="goldOnDark" className="rounded-full px-4 py-2">
              <Scale className="size-4" aria-hidden="true" />
              Legal
            </Badge>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-black leading-[0.98] tracking-normal text-white sm:text-5xl">
              Privacy, terms, and how Husky-Review handles your data.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-white/70">
              One place for trust boundaries and acceptable use. Profile settings link here instead of duplicating a separate privacy tab in the app shell.
            </p>
            <nav className="mt-8 flex flex-wrap gap-2" aria-label="Legal sections">
              {legalNav.map((item) => (
                <Link
                  key={item.id}
                  to={legalHref(item.id, location.pathname)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-black transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    location.hash === `#${item.id}` || (!location.hash && item.id === 'privacy')
                      ? 'border-white/30 bg-white/15 text-white'
                      : 'border-white/15 text-white/75 hover:border-white/30 hover:text-white',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <p className="mt-4 text-xs font-semibold text-white/50">Effective June 2026</p>
          </div>
        </Surface>

        <section id="privacy" className="scroll-mt-28">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
            <Surface variant="premium" className="rounded-[2rem] p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
                <ShieldCheck className="size-7 text-primary" aria-hidden="true" />
                Privacy policy
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
                How resumes, reviews, and profile data are stored for signed-in UW students using Husky-Review.
              </p>
              <div className="mt-6 grid gap-3">
                {privacyPrinciples.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.title} className="inset-row rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                          <h3 className="text-base font-black text-foreground">{item.title}</h3>
                          <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">{item.detail}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Surface>

            <Surface variant="premium" className="rounded-[2rem] p-5 sm:p-6">
              <h3 className="text-xl font-black text-foreground">Privacy inventory</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                What the current product surface stores or processes.
              </p>
              <div className="mt-5 grid gap-3">
                {privacyList.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.label} className="inset-row flex items-center gap-4 rounded-2xl p-4 shadow-soft">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-foreground">{item.label}</h4>
                        <p className="mt-1 text-sm font-medium leading-5 text-muted-foreground">{item.value}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Surface>
          </div>
        </section>

        <section id="terms" className="scroll-mt-28 mt-10">
          <Surface variant="premium" className="rounded-[2rem] p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
              <FileText className="size-7 text-primary" aria-hidden="true" />
              Terms of service
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-muted-foreground">
              By signing in and using Husky-Review{isApp ? ' in the student workspace' : ''}, you agree to the following terms.
            </p>
            <div className="mt-8 grid gap-4">
              {termsSections.map((section) => (
                <article key={section.title} className="inset-row rounded-2xl p-5">
                  <h3 className="text-base font-black text-foreground">{section.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>
                </article>
              ))}
            </div>
          </Surface>
        </section>
      </section>
    </main>
  );
}
