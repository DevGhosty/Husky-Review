import { DatabaseZap, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Section } from './layout/section';
import { Surface } from './layout/surface';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

const trustItems = [
  {
    title: 'Verified UWB opportunities',
    description: 'Recommendations open from campus sources and curated student resources so you can verify before you commit.',
    icon: ShieldCheck,
  },
  {
    title: 'Active status tracking',
    description: 'Each activity shows status and last-verified context so outdated entries surface instead of blending in.',
    icon: DatabaseZap,
  },
  {
    title: 'Unverifiable entries withheld',
    description: 'If a source cannot be checked, it stays out of your list so the board stays trustworthy.',
    icon: EyeOff,
  },
  {
    title: 'Privacy-conscious handling',
    description: 'You choose what to upload and save; review data stays scoped to your workspace and the retention choices you apply.',
    icon: LockKeyhole,
  },
];

export function TrustSection() {
  return (
    <Section id="trust" className="mx-auto max-w-[86rem] px-5 py-14 sm:px-8 lg:px-12">
      <Surface variant="premium" className="rounded-[2rem] p-6 sm:p-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <Badge tone="green">Trust and verification</Badge>
            <h2 className="type-section-title type-section-title--brand mt-4">Built around actionability, not generic advice.</h2>
            <p className="type-lead mt-3">
              Husky-Review is built so every recommendation is something you can open, verify, and drop onto your action board—not generic filler.
            </p>
          </div>
          <div className="rounded-2xl bg-husky-purple-dark p-5 text-white shadow-card">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-husky-gold-bright">Verification ledger</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {['Official source', 'Active status', 'Last verified'].map((item, i) => (
                <div
                  key={item}
                  className="motion-safe:animate-fade-up motion-reduce:animate-none rounded-xl border border-white/10 bg-white/[0.08] p-3"
                  style={{ animationDelay: `${Math.min(i * 50, 100)}ms` }}
                >
                  <p className="text-sm font-black">{item}</p>
                  <p className="mt-1 text-xs font-semibold text-white/75">Required before recommendation</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            const staggerMs = Math.min(index * 60, 180);
            return (
              <article
                key={item.title}
                className={cn(
                  'premium-card motion-safe:animate-slide-in motion-reduce:animate-none rounded-[1.6rem] p-5',
                  'transition-[transform,box-shadow] duration-motion-normal ease-brand',
                  'hover:-translate-y-1 hover:shadow-premium',
                  'active:scale-[0.99] motion-safe:active:scale-[0.99]',
                )}
                style={{ animationDelay: `${staggerMs}ms` }}
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/12 to-husky-gold/20 text-primary shadow-soft">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            );
          })}
        </div>
      </Surface>
    </Section>
  );
}
