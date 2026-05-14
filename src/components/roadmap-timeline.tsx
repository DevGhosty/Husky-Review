import { CalendarCheck2, CheckCircle2 } from 'lucide-react';
import { recommendations, roadmapWeeks } from '../data/mockData';
import { formatDeadline } from '../lib/utils';
import type { ReviewStatus } from '../types/analysis';
import { Section } from './layout/section';
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
    <Section id="roadmap" className="mx-auto max-w-[86rem] px-5 py-14 sm:px-8 lg:px-12">
      <div className="relative overflow-hidden rounded-[2.2rem] bg-husky-purple-dark p-5 shadow-premium sm:p-8">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-husky-gold/[0.16] blur-3xl motion-safe:animate-breathe" aria-hidden="true" />
        <div className="absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-husky-purple-soft/[0.24] blur-3xl" aria-hidden="true" />
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="text-white">
            <Badge tone="gold">Week-by-week roadmap</Badge>
            <h2 className="mt-5 text-3xl font-black tracking-normal sm:text-4xl">Move from gaps to next actions.</h2>
            <p className="mt-4 text-base leading-7 text-white/75">
              {isReady
                ? `The roadmap is organized around the ${formatDeadline(deadline)} deadline and updates as recommendations are added or removed.`
                : 'Run the mocked review to turn the upload and job posting into a sequenced action plan.'}
            </p>
            <div className="mt-8 rounded-[1.4rem] border border-white/10 bg-white/[0.08] p-5 shadow-inset">
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
                    className="relative motion-safe:animate-slide-in rounded-[1.6rem] border border-white/70 bg-white/[0.96] p-5 shadow-premium"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <div className="flex gap-4">
                      <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-husky-gold text-sm font-black text-husky-purple shadow-soft motion-safe:animate-pulse-ring">
                        {week.week}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">Week {week.week}</p>
                            <h3 className="mt-1 text-xl font-semibold text-foreground">{week.title}</h3>
                          </div>
                          <Badge tone="purple">
                            <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Action plan
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {isReady ? week.summary : 'This week will populate after the analysis connects gaps to verified UWB actions.'}
                        </p>
                        <div className="mt-5 grid gap-3">
                          {isReady ? (
                            week.actions.map((action) => (
                              <div key={action.id} className="rounded-2xl border border-border bg-muted/40 p-4 dark:bg-muted/25">
                                <p className="flex items-start gap-2 text-sm font-semibold text-foreground">
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                                  {action.text}
                                </p>
                                <p className="mt-2 pl-6 text-sm leading-6 text-muted-foreground">{action.detail}</p>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 dark:bg-muted/20">
                              <p className="text-sm font-semibold text-foreground">
                                {status === 'loading' ? 'Building roadmap steps...' : 'Roadmap empty state'}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {status === 'loading'
                                  ? 'Recommendations are being placed into the right week.'
                                  : 'Start a review or view the sample roadmap to preview this section.'}
                              </p>
                            </div>
                          )}
                          {isReady && selectedForWeek.map((recommendation) => (
                            <div key={recommendation.id} className="rounded-2xl border border-husky-gold/30 bg-gradient-to-r from-husky-gold/[0.15] to-card p-4 shadow-soft">
                              <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Added from recommendations</p>
                              <p className="mt-2 text-sm font-semibold text-foreground">{recommendation.name}</p>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">{recommendation.roadmapAction}</p>
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
    </Section>
  );
}
