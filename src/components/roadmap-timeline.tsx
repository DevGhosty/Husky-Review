import { CalendarCheck2, CheckCircle2 } from 'lucide-react';
import { recommendations, roadmapWeeks } from '../data/mockData';
import { formatDeadline } from '../lib/utils';
import type { ReviewStatus } from '../types/analysis';
import { Badge } from './ui/badge';

interface RoadmapTimelineProps {
  status: ReviewStatus;
  deadline: string;
  selectedIds: string[];
}

export function RoadmapTimeline({ status, deadline, selectedIds }: RoadmapTimelineProps) {
  const isReady = status === 'success';
  const selectedRecommendations = recommendations.filter((recommendation) => selectedIds.includes(recommendation.id));

  return (
    <section id="roadmap" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-husky-purple-dark p-5 shadow-glow sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="text-white">
            <Badge tone="gold">Week-by-week roadmap</Badge>
            <h2 className="mt-5 text-3xl font-black tracking-normal sm:text-4xl">Move from gaps to next actions.</h2>
            <p className="mt-4 text-base leading-7 text-white/75">
              {isReady
                ? `The roadmap is organized around the ${formatDeadline(deadline)} deadline and updates as recommendations are added or removed.`
                : 'Run the mocked review to turn the upload and job posting into a sequenced action plan.'}
            </p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.08] p-4">
              <p className="text-sm font-semibold text-white/70">Selected recommendation focus</p>
              <p className="mt-2 text-4xl font-black text-husky-gold-bright">{selectedIds.length}</p>
              <p className="mt-1 text-sm text-white/70">Activity actions currently attached to the roadmap.</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-5 top-6 hidden h-[calc(100%-3rem)] w-px bg-white/[0.18] sm:block" aria-hidden="true" />
            <div className="space-y-5">
              {roadmapWeeks.map((week, index) => {
                const selectedForWeek = selectedRecommendations.filter((recommendation) => recommendation.roadmapWeek === week.week);
                return (
                  <article
                    key={week.week}
                    className="relative animate-fade-up rounded-3xl border border-white/10 bg-white p-5 shadow-card"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <div className="flex gap-4">
                      <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-husky-gold text-sm font-black text-husky-purple-dark shadow-soft motion-safe:animate-pulse-ring">
                        {week.week}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-black uppercase tracking-[0.14em] text-husky-purple">Week {week.week}</p>
                            <h3 className="mt-1 text-xl font-black text-husky-purple-dark">{week.title}</h3>
                          </div>
                          <Badge tone="purple">
                            <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Action plan
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-husky-muted">
                          {isReady ? week.summary : 'This week will populate after the analysis connects gaps to verified UWB actions.'}
                        </p>
                        <div className="mt-5 grid gap-3">
                          {isReady ? (
                            week.actions.map((action) => (
                              <div key={action.id} className="rounded-2xl bg-slate-50 p-4">
                                <p className="flex items-start gap-2 text-sm font-black text-husky-ink">
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-husky-success" aria-hidden="true" />
                                  {action.text}
                                </p>
                                <p className="mt-2 pl-6 text-sm leading-6 text-husky-muted">{action.detail}</p>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-black text-husky-ink">
                                {status === 'loading' ? 'Building roadmap steps...' : 'Roadmap empty state'}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-husky-muted">
                                {status === 'loading'
                                  ? 'Recommendations are being placed into the right week.'
                                  : 'Start a review or view the sample roadmap to preview this section.'}
                              </p>
                            </div>
                          )}
                          {isReady && selectedForWeek.map((recommendation) => (
                            <div key={recommendation.id} className="rounded-2xl border border-husky-gold/30 bg-husky-gold/10 p-4">
                              <p className="text-xs font-black uppercase tracking-[0.14em] text-husky-purple">Added from recommendations</p>
                              <p className="mt-2 text-sm font-black text-husky-purple-dark">{recommendation.name}</p>
                              <p className="mt-1 text-sm leading-6 text-husky-muted">{recommendation.roadmapAction}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
