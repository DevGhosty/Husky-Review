import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, FileText, Layers3, Map, Sparkles } from 'lucide-react';
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
      <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-16">
        <div className="max-w-3xl animate-fade-up">
          <Badge tone="gold" className="mb-5 shadow-soft">
            Session-only AI preview
          </Badge>
          <h1 className="max-w-4xl text-[3.25rem] font-black leading-[0.92] tracking-normal text-husky-purple-dark sm:text-6xl lg:text-[5.35rem]">
            Turn your resume gaps into a UWB action plan
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-husky-muted sm:text-xl">
            Husky-Review compares your resume to a job posting, finds skill and keyword gaps, and recommends verified UWB activities that can strengthen your next application.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button className="h-[3.25rem] px-6" onClick={onStartReview}>
              Start Review
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button className="h-[3.25rem] px-6" variant="secondary" onClick={onViewRoadmap}>
              View Sample Roadmap
            </Button>
          </div>
          <dl className="mt-9 grid max-w-2xl grid-cols-3 gap-3">
            {[
              ['50+', 'verified UWB activities'],
              ['1 hr', 'privacy expiry goal'],
              ['80%', 'roadmap task target'],
            ].map(([value, label]) => (
              <div key={label} className="premium-card rounded-2xl p-4">
                <dt className="text-2xl font-black text-husky-purple">{value}</dt>
                <dd className="mt-1 text-[0.68rem] font-black uppercase leading-4 tracking-[0.14em] text-slate-500">{label}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 rounded-2xl border border-husky-purple/10 bg-white/70 p-4 shadow-soft backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-husky-purple-dark">Sample readiness</p>
                <p className="mt-1 text-xs font-semibold text-husky-muted">Gaps mapped to verified campus actions.</p>
              </div>
              <span className="rounded-xl bg-husky-purple px-3 py-2 text-lg font-black text-white">76%</span>
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-[560px] lg:block" aria-label="Husky-Review workflow preview">
          <div className="absolute -right-4 top-1/2 h-[31rem] w-[31rem] -translate-y-1/2 rounded-full border border-husky-gold/20 bg-husky-gold/[0.08] blur-2xl motion-safe:animate-breathe" />
          <div className="premium-panel absolute inset-x-0 top-6 rounded-[2rem] p-5">
            <div className="rounded-[1.45rem] bg-husky-purple-dark p-5 text-white shadow-premium">
              <div className="grid gap-4 xl:grid-cols-[0.7fr_1fr]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-5">
                  <p className="text-sm font-semibold text-husky-gold-bright">Resume readiness</p>
                  <div className="mt-5 grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(#D8C577_0_76%,rgba(255,255,255,0.12)_76%_100%)] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
                    <div className="grid h-full w-full place-items-center rounded-full bg-husky-purple-dark">
                      <div className="text-center">
                        <p className="text-4xl font-black">76%</p>
                        <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-white/50">match</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-white/[0.68]">
                    <CheckCircle2 className="h-4 w-4 text-husky-gold-bright" aria-hidden="true" />
                    6 verified UWB matches
                  </div>
                </div>
                <div className="grid gap-3">
                  {[
                    ['REST API evidence', 68],
                    ['Production keywords', 76],
                    ['Testing signal', 84],
                  ].map(([item, score]) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-white/[0.88]">{item}</span>
                        <span className="font-black text-husky-gold-bright">{score}%</span>
                      </div>
                      <div className="mt-3 h-2.5 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-husky-gold via-white to-husky-gold-bright shadow-[0_0_22px_rgba(216,197,119,0.35)]"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="rounded-2xl border border-husky-gold/25 bg-husky-gold/[0.12] p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.12]">
                        <Layers3 className="h-5 w-5 text-husky-gold-bright" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-black">Week 1 action plan ready</p>
                        <p className="mt-1 text-xs font-semibold text-white/[0.62]">Advisor review, event, bullet rewrite</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {flowCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="glass-card absolute w-48 animate-float rounded-2xl p-4 shadow-card"
                style={{
                  animationDelay: card.delay,
                  left: index === 0 || index === 2 ? '-0.25rem' : undefined,
                  right: index === 1 || index === 3 ? '-0.25rem' : undefined,
                  top: `${36 + index * 116}px`,
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
          <div className="glass-card absolute bottom-4 left-10 right-10 rounded-2xl p-4 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-black text-husky-purple-dark">Session expires in 1 hour</p>
                  <p className="mt-0.5 text-xs font-semibold text-husky-muted">Privacy-first mock session handling</p>
                </div>
              </div>
              <Badge tone="green">Local preview</Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
