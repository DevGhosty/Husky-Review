import { Link } from 'react-router-dom';
import { ArrowLeft, Clock3, MapPinned, Sparkles } from 'lucide-react';
import { RoadmapTimeline } from '../components/roadmap-timeline';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Surface } from '../components/layout/surface';
import { recommendations } from '../data/mockData';
import { useReview } from '../context/review-context';

export function RoadmapPage() {
  const { status, deadline, selectedIds, showSampleReview } = useReview();
  const selectedRecommendations = recommendations.filter((recommendation) => selectedIds.includes(recommendation.id));

  return (
    <main>
      <section className="mx-auto max-w-[86rem] px-5 py-10 sm:px-8 lg:px-12">
        <Surface variant="premium" className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="absolute -right-20 -top-20 size-60 rounded-full bg-husky-gold/20 blur-3xl motion-safe:animate-breathe" aria-hidden="true" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Badge tone="gold" className="rounded-full px-4 py-2">
                <MapPinned className="size-4" aria-hidden="true" />
                Roadmap
              </Badge>
              <h1 className="type-page-title type-page-title--brand mt-4 max-w-3xl">
                Plan the next three weeks with verified actions.
              </h1>
              <p className="type-lead mt-5 max-w-2xl">
                Review the week-by-week action plan and the recommendation cards currently attached to it. This page uses mock data only.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[24rem]">
              <Button asChild variant="secondary" className="h-12" disabled={status === 'loading'}>
                <Link to="/app#workflow">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Start review
                </Link>
              </Button>
              <Button className="h-12" onClick={showSampleReview} disabled={status === 'loading'}>
                <Sparkles className="size-4" aria-hidden="true" />
                Load sample
              </Button>
            </div>
          </div>
        </Surface>
      </section>

      <RoadmapTimeline status={status} deadline={deadline} selectedIds={selectedIds} />

      <section className="mx-auto max-w-[86rem] px-5 pb-16 sm:px-8 lg:px-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {status === 'loading' ? (
            <Surface variant="stroke" className="flex flex-col items-center rounded-[1.6rem] p-8 text-center lg:col-span-3">
              <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/12 to-husky-gold/20 text-primary shadow-soft ring-1 ring-border/50">
                <MapPinned className="size-7 motion-safe:animate-pulse" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-foreground">Building your roadmap</h2>
              <p className="type-body mx-auto mt-2 max-w-lg">
                Recommendations are being placed into the right week. Check back in a moment.
              </p>
            </Surface>
          ) : selectedRecommendations.length > 0 ? (
            <>
            {selectedRecommendations.slice(0, 3).map((recommendation) => (
              <Surface key={recommendation.id} variant="card" className="rounded-[1.6rem] p-5">
                <div className="flex items-start justify-between gap-3">
                  <Badge tone={recommendation.group === 'in-time' ? 'gold' : 'purple'}>{recommendation.group === 'in-time' ? 'In-Time' : 'Next-Time'}</Badge>
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{recommendation.confidence}%</span>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">{recommendation.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation.roadmapAction}</p>
                <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Clock3 className="size-4 text-primary" aria-hidden="true" />
                  Last verified {recommendation.lastVerified}
                </p>
              </Surface>
            ))}
            {selectedIds.length > 3 && (
              <Surface variant="stroke" className="flex items-center justify-center rounded-[1.6rem] p-5 text-center md:col-span-2 lg:col-span-3">
                <p className="text-sm font-semibold text-muted-foreground">
                  +{selectedIds.length - 3} more on{' '}
                  <Link to="/app/resources" className="font-black text-primary underline-offset-2 hover:underline">
                    Resources
                  </Link>
                </p>
              </Surface>
            )}
            </>
          ) : (
            <Surface variant="stroke" className="flex flex-col items-center rounded-[1.6rem] p-8 text-center lg:col-span-3">
              <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/12 to-husky-gold/20 text-primary shadow-soft ring-1 ring-border/50">
                <MapPinned className="size-7" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-foreground">No recommendations selected yet</h2>
              <p className="type-body mx-auto mt-2 max-w-lg">
                Load the sample review or run the mock analysis from the dashboard to attach activities to this roadmap.
              </p>
              <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild className="h-12 sm:min-w-[11rem]">
                  <Link to="/app#workflow">Open workflow</Link>
                </Button>
                <Button variant="secondary" className="h-12 sm:min-w-[11rem]" onClick={showSampleReview}>
                  <Sparkles className="size-4" aria-hidden />
                  Load sample
                </Button>
              </div>
            </Surface>
          )}
        </div>
      </section>
    </main>
  );
}
