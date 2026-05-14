import { Link } from 'react-router-dom';
import { ArrowRight, Chrome, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Surface } from '../components/layout/surface';

export function LoginPage() {
  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-[86rem] items-center gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
        <Surface variant="dark" className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="absolute -right-24 -top-20 size-72 rounded-full bg-husky-gold/25 blur-3xl" aria-hidden="true" />
          <Badge tone="gold" className="relative rounded-full border-white/15 bg-white/[0.08] px-4 py-2 text-white">
            Sign-in preview
          </Badge>
          <h1 className="relative mt-5 font-display text-4xl font-black leading-[0.98] text-white sm:text-6xl">
            Google access will protect the review workspace.
          </h1>
          <p className="relative mt-5 max-w-xl text-base font-medium leading-7 text-white/70">
            This screen is front-end only. It shows the intended sign-in entry point without adding OAuth providers, database setup, or real account state.
          </p>
          <div className="relative mt-8 grid gap-3">
            {[
              'Use Google login before accessing saved reviews.',
              'Keep resume and job-posting data scoped to the student session.',
              'Add real auth later behind the same product flow.',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                <ShieldCheck className="size-5 shrink-0 text-husky-gold-bright" aria-hidden="true" />
                <span className="text-sm font-semibold leading-6 text-white/75">{item}</span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface variant="premium" className="rounded-[2rem] p-6 sm:p-8">
          <div className="mx-auto max-w-lg">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10">
              <LockKeyhole className="size-7" aria-hidden="true" />
            </span>
            <h2 className="type-section-title type-section-title--brand mt-5">Sign in to Husky-Review</h2>
            <p className="type-body mt-3">
              Continue to the tool preview. The Google button is intentionally non-functional until auth is added.
            </p>

            <button
              type="button"
              className="font-ui mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm font-black text-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-disabled="true"
            >
              <Chrome className="size-5 text-primary" aria-hidden="true" />
              Continue with Google
              <span className="rounded-full bg-muted px-2 py-1 text-[0.7rem] font-black text-muted-foreground">UI only</span>
            </button>

            <div className="my-6 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              preview access
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button asChild className="w-full">
              <Link to="/app">
                Open app preview without auth
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>

            <p className="mt-4 text-center text-xs font-semibold leading-5 text-muted-foreground">
              No OAuth request, account creation, or data persistence is performed in this pass.
            </p>
          </div>
        </Surface>
      </section>
    </main>
  );
}
