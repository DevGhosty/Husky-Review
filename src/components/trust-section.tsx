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
    <section id="privacy" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <Badge tone="green">Trust and verification</Badge>
        <h2 className="mt-4 text-3xl font-black tracking-normal text-husky-purple-dark sm:text-4xl">Built around actionability, not generic advice.</h2>
        <p className="mt-3 text-base leading-7 text-husky-muted">
          Husky-Review is shaped around the project proposal's core promise: every recommendation should be real, current, and useful for UWB students.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="glass-card animate-fade-up rounded-3xl p-5 shadow-soft"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-husky-purple/10 text-husky-purple">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-black text-husky-purple-dark">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-husky-muted">{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
