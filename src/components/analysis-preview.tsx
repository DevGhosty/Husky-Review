import { CheckCircle2, Gauge, Loader2, SearchCheck, SignalHigh, Timer } from 'lucide-react';
import { loadingSteps } from '../data/reviewFlow';
import type { ReviewAnalysis, ReviewStatus } from '../types/analysis';
import { formatPercent } from '../lib/utils';
import { Section } from './layout/section';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';

interface AnalysisPreviewProps {
  status: ReviewStatus;
  loadingStepIndex: number;
  analysis?: ReviewAnalysis | null;
  error?: string | null;
}

export function AnalysisPreview({ status, loadingStepIndex, analysis, error }: AnalysisPreviewProps) {
  const isSuccess = status === 'success';
  const isLoading = status === 'loading';
  const activeStep = loadingSteps[loadingStepIndex] ?? loadingSteps[0];
  const categories = analysis?.gapCategories || [];
  const score = analysis?.matchScore;

  return (
    <Section id="analysis" className="mx-auto max-w-[86rem] px-5 py-12 sm:px-8 lg:px-12">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge tone={isSuccess ? 'green' : isLoading ? 'gold' : 'gray'} className="rounded-full px-4 py-2">
            {isSuccess ? 'Analysis complete' : isLoading ? 'Loading analysis' : status === 'error' ? 'Analysis needs attention' : 'Empty state'}
          </Badge>
          <h2 className="type-section-title type-section-title--brand mt-4">Analysis preview</h2>
          <p className="type-lead mt-3 max-w-2xl">
            {isSuccess
              ? 'Skill gaps, keyword gaps, experience signals, and match scoring are based on the saved review.'
              : isLoading
                ? activeStep.description
                : status === 'error'
                  ? error || 'The review could not be completed.'
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
        {isSuccess && analysis?.quota ? (
          <div className="dashboard-card rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {analysis.quota.source === 'app-key' && analysis.quota.remaining !== null
                ? `${analysis.quota.remaining} app-key AI review${analysis.quota.remaining === 1 ? '' : 's'} left this week`
                : analysis.quota.source === 'user-key'
                  ? 'Analyzed with your Gemini API key'
                  : analysis.fallbackReason === 'no_api_key'
                    ? 'Local catalog matching — add GEMINI_API_KEY on Vercel for AI analysis'
                    : analysis.fallbackReason === 'gemini_error'
                      ? 'Gemini scoring unavailable — used local catalog matching for this review'
                      : 'Analyzed with local catalog matching'}
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.84fr_repeat(3,1fr)]">
        <article className="relative overflow-hidden rounded-[2rem] bg-husky-purple-dark p-6 text-white shadow-premium">
          <div className="absolute -right-12 -top-12 size-44 rounded-full bg-husky-gold/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/[0.12] text-husky-gold-bright">
              <Gauge className="size-6" aria-hidden="true" />
            </span>
            <Badge tone="gold" className="rounded-full">{isSuccess ? score?.label : 'Waiting for input'}</Badge>
          </div>
          <div className="relative mt-7 grid place-items-center">
            <div className="grid size-44 place-items-center rounded-full bg-[conic-gradient(#D8C577_0_76%,rgba(255,255,255,0.12)_76%_100%)] p-2 shadow-progress-track">
              <div className="grid size-full place-items-center rounded-full bg-husky-purple-dark">
                <div className="text-center">
                  <p className="text-sm font-semibold text-white/60">Match Score</p>
                  <p className="mt-1 text-5xl font-black">{isSuccess && score ? formatPercent(score.score) : '--'}</p>
                </div>
              </div>
            </div>
          </div>
          <p className="relative mt-6 text-center text-sm leading-6 text-white/75">
            {isSuccess ? score?.summary : 'The score appears after a review run.'}
          </p>
        </article>

        {(isSuccess && categories.length ? categories : [0, 1, 2].map((item) => ({
          title: ['Missing Skills', 'Keyword Gaps', 'Experience Signals'][item],
          summary: '',
          items: [],
          score: 0,
        }))).map((category, index) => (
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
              <Progress value={isSuccess ? category.score : isLoading ? 18 : 0} className="mt-5 h-2 bg-muted [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-husky-purple [&_[data-slot=progress-indicator]]:to-husky-gold" />
              {isSuccess ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {category.items.map((item) => (
                    <Badge key={item} tone="purple">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : isLoading ? (
                <div className="mt-5 flex flex-col gap-2" role="status" aria-live="polite">
                  {[0, 1, 2].map((item) => (
                    <Skeleton key={item} className="h-3 rounded-full" />
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
