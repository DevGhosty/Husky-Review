import { ArrowRight, BriefcaseBusiness, FileText, Map, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { GradientBackground } from './gradient-background';

interface HeroSectionProps {
  onStartReview: () => void;
  onViewRoadmap: () => void;
}

const flowCards = [
  { label: 'Resume', detail: 'PDF or DOCX', icon: FileText, delay: '0s' },
  { label: 'Job Posting', detail: 'Target role', icon: BriefcaseBusiness, delay: '0.6s' },
  { label: 'Gap Analysis', detail: 'Skills and signals', icon: Sparkles, delay: '1.2s' },
  { label: 'UWB Roadmap', detail: 'Verified next steps', icon: Map, delay: '1.8s' },
];

export function HeroSection({ onStartReview, onViewRoadmap }: HeroSectionProps) {
  return (
    <section id="top" className="relative overflow-hidden">
      <GradientBackground />
      <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-20">
        <div className="max-w-3xl animate-fade-up">
          <Badge tone="gold" className="mb-5">
            Mocked frontend prototype
          </Badge>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-normal text-husky-purple-dark sm:text-6xl lg:text-7xl">
            Turn your resume gaps into a UWB action plan
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-husky-muted">
            Husky-Review compares your resume to a job posting, finds skill and keyword gaps, and recommends verified UWB activities that can strengthen your next application.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button onClick={onStartReview}>
              Start Review
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="secondary" onClick={onViewRoadmap}>
              View Sample Roadmap
            </Button>
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {[
              ['50+', 'verified activities'],
              ['1 hr', 'session expiry goal'],
              ['80%', 'roadmap QA target'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-white/70 bg-white/75 p-4 shadow-soft backdrop-blur">
                <dt className="text-2xl font-black text-husky-purple">{value}</dt>
                <dd className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative min-h-[440px] lg:min-h-[560px]" aria-label="Husky-Review workflow preview">
          <div className="absolute inset-x-4 top-14 rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-glow backdrop-blur-xl sm:inset-x-10 lg:inset-x-4">
            <div className="rounded-2xl bg-husky-purple-dark p-5 text-white shadow-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-husky-gold-bright">Resume readiness</p>
                  <p className="mt-1 text-4xl font-black">76%</p>
                </div>
                <div className="hidden rounded-xl bg-white/[0.12] px-3 py-2 text-right text-xs font-semibold text-white/80 2xl:block">
                  Verified UWB matches
                  <span className="block text-2xl text-white">6</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {['REST API evidence', 'Production keywords', 'Testing signal'].map((item, index) => (
                  <div key={item} className="rounded-xl bg-white/10 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item}</span>
                      <span className="text-husky-gold-bright">{68 + index * 8}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-husky-gold to-white"
                        style={{ width: `${68 + index * 8}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {flowCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="glass-card absolute w-44 animate-float rounded-2xl p-4 shadow-card"
                style={{
                  animationDelay: card.delay,
                  left: index % 2 === 0 ? '0.25rem' : undefined,
                  right: index % 2 === 1 ? '0.25rem' : undefined,
                  top: `${index * 104}px`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-husky-purple/10 text-husky-purple">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-husky-ink">{card.label}</span>
                    <span className="block text-xs font-semibold text-husky-muted">{card.detail}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
