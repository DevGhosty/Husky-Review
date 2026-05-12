import type { CSSProperties } from 'react';
import { CheckCircle2, Gauge, Loader2, SearchCheck, SignalHigh } from 'lucide-react';
import { gapCategories, loadingSteps, matchScore } from '../data/mockData';
import type { ReviewStatus } from '../types/analysis';
import { formatPercent } from '../lib/utils';
import { Badge } from './ui/badge';

interface AnalysisPreviewProps {
  status: ReviewStatus;
  loadingStepIndex: number;
}

export function AnalysisPreview({ status, loadingStepIndex }: AnalysisPreviewProps) {
  const isSuccess = status === 'success';
  const isLoading = status === 'loading';
  const activeStep = loadingSteps[loadingStepIndex] ?? loadingSteps[0];

  return (
    <section id="analysis" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge tone={isSuccess ? 'green' : isLoading ? 'gold' : 'gray'}>
            {isSuccess ? 'Successful analysis state' : isLoading ? 'Loading analysis' : 'Empty state'}
          </Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-husky-purple-dark sm:text-4xl">Analysis preview</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-husky-muted">
            {isSuccess
              ? 'Mock results show how skill gaps, keyword gaps, experience signals, and match scoring will appear.'
              : isLoading
                ? activeStep.description
                : 'Add your resume and a job post to begin. Until then, this area stays intentionally muted.'}
          </p>
        </div>
        {isLoading && (
          <div className="rounded-2xl border border-husky-gold/30 bg-white px-4 py-3 shadow-soft" role="status" aria-live="polite">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-husky-purple" aria-hidden="true" />
              <span className="text-sm font-black text-husky-purple-dark">{activeStep.label}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.84fr_repeat(3,1fr)]">
        <article className="relative overflow-hidden rounded-[2rem] bg-husky-purple-dark p-6 text-white shadow-premium">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-husky-gold/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-center justify-between">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.12] text-husky-gold-bright">
              <Gauge className="h-6 w-6" aria-hidden="true" />
            </span>
            <Badge tone="gold">{isSuccess ? matchScore.label : 'Waiting for input'}</Badge>
          </div>
          <div className="relative mt-7 grid place-items-center">
            <div className="grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(#D8C577_0_76%,rgba(255,255,255,0.12)_76%_100%)] p-2">
              <div className="grid h-full w-full place-items-center rounded-full bg-husky-purple-dark">
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
          <article
            key={category.title}
            className="premium-card animate-fade-up rounded-[2rem] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-premium"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-husky-purple/10 to-husky-gold/20 text-husky-purple shadow-soft">
                {index === 0 ? <SearchCheck className="h-5 w-5" aria-hidden="true" /> : index === 1 ? <SignalHigh className="h-5 w-5" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
              </span>
              <span className="rounded-full bg-husky-purple/[0.08] px-3 py-1 text-sm font-black text-husky-purple">{isSuccess ? formatPercent(category.score) : '--'}</span>
            </div>
            <h3 className="mt-5 text-lg font-black text-husky-ink">{category.title}</h3>
            <p className="mt-2 text-sm leading-6 text-husky-muted">{isSuccess ? category.summary : 'Analysis details will populate here after review.'}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-husky-purple to-husky-gold opacity-80 motion-safe:animate-progress"
                style={{ '--progress-width': isSuccess ? `${category.score}%` : '18%' } as CSSProperties}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {(isSuccess ? category.items : ['Pending', 'Upload resume', 'Paste posting']).map((item) => (
                <Badge key={item} tone={isSuccess ? 'purple' : 'gray'}>
                  {item}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
