import { DatabaseZap, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Badge } from './ui/badge';

const trustItems = [
  {
    title: 'Verified UWB opportunities',
    description: 'Recommendations are designed to come from official campus sources and curated student resources.',
    icon: ShieldCheck,
  },
  {
    title: 'Active status tracking',
    description: 'Activities carry status and last-verified dates so stale entries can be flagged or withheld.',
    icon: DatabaseZap,
  },
  {
    title: 'Unverifiable entries withheld',
    description: 'The proposal prioritizes certainty over filler recommendations when a source cannot be checked.',
    icon: EyeOff,
  },
  {
    title: 'Privacy-conscious handling',
    description: 'Resume/session data is designed to expire after one hour once backend storage is added.',
    icon: LockKeyhole,
  },
];

export function TrustSection() {
  return (
    <section id="privacy" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="premium-panel rounded-[2rem] p-6 sm:p-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <Badge tone="green">Trust and verification</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-normal text-husky-purple-dark sm:text-4xl">Built around actionability, not generic advice.</h2>
            <p className="mt-3 text-base leading-7 text-husky-muted">
              Husky-Review is shaped around the project proposal's core promise: every recommendation should be real, current, and useful for UWB students.
            </p>
          </div>
          <div className="rounded-2xl bg-husky-purple-dark p-5 text-white shadow-card">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-husky-gold-bright">Verification ledger</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {['Official source', 'Active status', 'Last verified'].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-sm font-black">{item}</p>
                  <p className="mt-1 text-xs font-semibold text-white/[0.58]">Required before recommendation</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="premium-card animate-fade-up rounded-[1.6rem] p-5 transition hover:-translate-y-1 hover:shadow-premium"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-husky-purple/10 to-husky-gold/20 text-husky-purple shadow-soft">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-black text-husky-purple-dark">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-husky-muted">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
