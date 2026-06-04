import { Link } from 'react-router-dom';
import { ClipboardList, Loader2, Sparkles } from 'lucide-react';
import type { ActivityType, Recommendation, ReviewStatus } from '../types/analysis';
import { ACTIVITY_INTEREST_OPTIONS } from '../data/uwb-catalog';
import { formatDeadline } from '../lib/utils';
import { Section } from './layout/section';
import { Surface } from './layout/surface';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RecommendationCard } from './recommendation-card';
import { Skeleton } from './ui/skeleton';

interface RecommendationDashboardProps {
  status: ReviewStatus;
  deadline: string;
  selectedIds: string[];
  recommendations: Recommendation[];
  showVerificationDates?: boolean;
  onToggleRecommendation: (id: string) => void;
  layout?: 'byUrgency' | 'byType';
  activityTypeOrder?: ActivityType[];
}

const groups = [
  {
    id: 'in-time',
    title: 'In-Time Activities',
    summary: 'Actions that can realistically improve this application before the deadline.',
  },
  {
    id: 'next-time',
    title: 'Next-Time Activities',
    summary: 'Longer-term resume builders to save for the next recruiting cycle.',
  },
] as const;

const typeLabels = Object.fromEntries(ACTIVITY_INTEREST_OPTIONS.map((option) => [option.id, option.label])) as Record<
  ActivityType,
  string
>;

function RecommendationPlaceholder({ isLoading }: { isLoading: boolean }) {
  return (
    <Surface
      variant="stroke"
      className="rounded-[1.6rem] p-6 text-center"
      role={isLoading ? 'status' : undefined}
      aria-busy={isLoading || undefined}
      aria-live={isLoading ? 'polite' : undefined}
    >
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/12 to-husky-gold/20 text-primary shadow-soft ring-1 ring-border/60 dark:from-primary/20 dark:to-amber-400/15">
        {isLoading ? <Loader2 className="size-7 animate-spin" aria-hidden /> : <ClipboardList className="size-7" aria-hidden />}
      </span>
      <h4 className="mt-4 text-lg font-semibold text-foreground">
        {isLoading ? 'Ranking verified matches' : 'Recommendations unlock after analysis'}
      </h4>
      <p className="type-body mx-auto mt-2 max-w-md">
        {isLoading
          ? 'Husky-Review is sorting activity fit, urgency, verification dates, and confidence scores.'
          : 'Upload a resume, add a job description, and run the review.'}
      </p>
      {!isLoading && (
        <Button asChild className="mt-6 h-11">
          <Link to="/app#workflow">
            <Sparkles className="size-4" aria-hidden />
            Go to workflow
          </Link>
        </Button>
      )}
      {isLoading && (
        <div className="mt-5 flex flex-col gap-2">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-3 rounded-full" />
          ))}
        </div>
      )}
    </Surface>
  );
}

export function RecommendationDashboard({
  status,
  deadline,
  selectedIds,
  recommendations,
  showVerificationDates = true,
  onToggleRecommendation,
  layout = 'byUrgency',
  activityTypeOrder = [],
}: RecommendationDashboardProps) {
  const isReady = status === 'success';
  const isLoading = status === 'loading';
  const typeOrder =
    activityTypeOrder.length > 0
      ? activityTypeOrder
      : (Array.from(new Set(recommendations.map((item) => item.type))) as ActivityType[]);

  const leadCopy =
    layout === 'byType'
      ? isReady
        ? `Top matches per activity type for your ${formatDeadline(deadline)} timeline. Each card includes a time-commitment note — use filters above to focus on one category.`
        : 'Run a review to unlock up to five ranked matches per activity type from your profile interests.'
      : isReady
        ? `Verified UW activities are grouped around the ${formatDeadline(deadline)} deadline so students can separate immediate application moves from longer-term resume building.`
        : 'Run a review to unlock ranked UW recommendations grouped by urgency.';

  return (
    <Section id="recommendations" className="mx-auto max-w-[86rem] px-5 py-14 sm:px-8 lg:px-12">
      <div className="section-enter mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge tone={isReady ? 'green' : 'gray'}>{isReady ? 'Ranked recommendations' : 'Recommendation area'}</Badge>
          <h2 className="type-section-title type-section-title--brand mt-4">Recommendation dashboard</h2>
          <p className="type-lead mt-3 max-w-2xl">{leadCopy}</p>
        </div>
        <Surface variant="card" className="rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground">
          <span className="text-2xl font-black text-primary">{selectedIds.length}</span> recommendations added to roadmap
        </Surface>
      </div>

      {layout === 'byType' ? (
        <div className="grid gap-8">
          {typeOrder.map((type) => {
            const typeRecommendations = recommendations
              .filter((recommendation) => recommendation.type === type)
              .sort((left, right) => right.confidence - left.confidence);
            if (!typeRecommendations.length && isReady) {
              return null;
            }
            return (
              <Surface key={type} variant="premium" className="section-enter rounded-[2rem] p-4">
                <div className="mb-4 rounded-[1.35rem] bg-husky-purple-dark p-5 text-white shadow-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black">{typeLabels[type] || type}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        Up to five verified {typeLabels[type]?.toLowerCase() || type} matches ranked for this posting.
                      </p>
                    </div>
                    <Badge tone="onDark">{typeRecommendations.length} matches</Badge>
                  </div>
                </div>
                <div className="grid gap-4">
                  {isReady ? (
                    typeRecommendations.map((recommendation, cardIndex) => (
                      <RecommendationCard
                        key={recommendation.id}
                        recommendation={recommendation}
                        selected={selectedIds.includes(recommendation.id)}
                        showVerificationDates={showVerificationDates}
                        staggerIndex={cardIndex}
                        onToggle={onToggleRecommendation}
                      />
                    ))
                  ) : (
                    <RecommendationPlaceholder isLoading={isLoading} />
                  )}
                </div>
              </Surface>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-2">
          {groups.map((group) => {
            const groupRecommendations = recommendations.filter((recommendation) => recommendation.group === group.id);
            return (
              <Surface key={group.id} variant="premium" className="section-enter rounded-[2rem] p-4">
                <div className="mb-4 rounded-[1.35rem] bg-husky-purple-dark p-5 text-white shadow-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black">{group.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">{group.summary}</p>
                    </div>
                    <Badge tone="onDark">{groupRecommendations.length} matches</Badge>
                  </div>
                </div>
                <div className="grid gap-4">
                  {isReady ? (
                    groupRecommendations.map((recommendation, cardIndex) => (
                      <RecommendationCard
                        key={recommendation.id}
                        recommendation={recommendation}
                        selected={selectedIds.includes(recommendation.id)}
                        showVerificationDates={showVerificationDates}
                        staggerIndex={cardIndex}
                        onToggle={onToggleRecommendation}
                      />
                    ))
                  ) : (
                    <RecommendationPlaceholder isLoading={isLoading} />
                  )}
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </Section>
  );
}
