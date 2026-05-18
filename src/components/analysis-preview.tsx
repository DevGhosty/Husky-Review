import { CheckCircle2, Gauge, Loader2, SearchCheck, SignalHigh, Timer } from 'lucide-react';
import { gapCategories, loadingSteps, matchScore } from '../data/mockData';
import type { ReviewStatus } from '../types/analysis';
import { formatPercent } from '../lib/utils';
import { Section } from './layout/section';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';

interface AnalysisPreviewProps {
  status: ReviewStatus;
  loadingStepIndex: number;
}

export function AnalysisPreview({ status, loadingStepIndex }: AnalysisPreviewProps) {
  const isSuccess = status === 'success';
  const isLoading = status === 'loading';
  const activeStep = loadingSteps[loadingStepIndex] ?? loadingSteps[0];

  return (
    <Section id="analysis" className="mx-auto max-w-[86rem] px-5 py-12 sm:px-8 lg:px-12">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge tone={isSuccess ? 'green' : isLoading ? 'gold' : 'gray'} className="rounded-full px-4 py-2">
            {isSuccess ? 'Successful analysis state' : isLoading ? 'Loading analysis' : 'Empty state'}
          </Badge>
          <h2 className="type-section-title type-section-title--brand mt-4">Analysis preview</h2>
          <p className="type-lead mt-3 max-w-2xl">
            {isSuccess
              ? 'Mock results show how skill gaps, keyword gaps, experience signals, and match scoring will appear.'
              : isLoading
                ? activeStep.description
                : 'Add your resume and a job post to begin. Until then, this area stays intentionally muted.'}
          </p>
        </div>
        {isLoading && (
          <div className="dashboard-card rounded-2xl px-4 py-3" role="status" aria-live="polite">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-foreground">{activeStep.label}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.84fr_repeat(3,1fr)]">
        <article className="relative overflow-hidden rounded-[2rem] bg-husky-purple-dark p-6 text-white shadow-premium">
          <div className="absolute -right-12 -top-12 size-44 rounded-full bg-husky-gold/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/[0.12] text-husky-gold-bright">
              <Gauge className="size-6" aria-hidden="true" />
            </span>
            <Badge tone="gold" className="rounded-full">{isSuccess ? matchScore.label : 'Waiting for input'}</Badge>
          </div>
          <div className="relative mt-7 grid place-items-center">
            <div className="grid size-44 place-items-center rounded-full bg-[conic-gradient(#D8C577_0_76%,rgba(255,255,255,0.12)_76%_100%)] p-2 shadow-progress-track">
              <div className="grid size-full place-items-center rounded-full bg-husky-purple-dark">
                <div className="text-center">
                  <p className="text-sm font-semibold text-white/60">Match Score</p>
                  <p className="mt-1 text-5xl font-black">{isSuccess ? formatPercent(matchScore.score) : '--'}</p>
                </div>
              </div>
            </div>
          </div>
          <p className="relative mt-6 text-center text-sm leading-6 text-white/75">
            {isSuccess ? matchScore.summary : 'The score appears after a mocked analysis run.'}
          </p>
        </article>

        {gapCategories.map((category, index) => (
          <Card
            key={category.title}
            className="dashboard-card motion-safe:animate-slide-in motion-reduce:animate-none rounded-[2rem] border-border/80 p-0 transition-[transform,box-shadow,border-color] duration-motion-normal ease-brand motion-safe:hover:-translate-y-1 hover:shadow-premium active:scale-[0.99] motion-safe:active:scale-[0.99]"
            style={{ animationDelay: `${Math.min(index * 70, 210)}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/12 to-husky-gold/20 text-primary shadow-soft">
                  {index === 0 ? <SearchCheck className="size-5" aria-hidden="true" /> : index === 1 ? <SignalHigh className="size-5" aria-hidden="true" /> : <CheckCircle2 className="size-5" aria-hidden="true" />}
                </span>
                <span className="rounded-full bg-primary/12 px-3 py-1 text-sm font-semibold text-primary dark:bg-white/12 dark:text-foreground">
                  {isSuccess ? formatPercent(category.score) : '--'}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{category.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{isSuccess ? category.summary : 'Analysis details will populate here after review.'}</p>
              <Progress value={isSuccess ? category.score : 18} className="mt-5 h-2 bg-muted [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-husky-purple [&_[data-slot=progress-indicator]]:to-husky-gold" />
              {isSuccess ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {category.items.map((item) => (
                    <Badge key={item} tone="purple">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div
                  className="mt-5 flex items-start gap-2.5 rounded-xl border border-dashed border-border/80 bg-muted/35 px-3 py-3 text-left text-xs font-medium leading-relaxed text-muted-foreground dark:bg-muted/20"
                  role="status"
                  aria-label="Analysis not started"
                >
                  <Timer className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>Waiting for analysis. Gap tags and detail lines will replace this note after you run a review.</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}
