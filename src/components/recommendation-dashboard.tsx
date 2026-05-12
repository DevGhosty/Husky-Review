import type { Recommendation, ReviewStatus } from '../types/analysis';
import { recommendations } from '../data/mockData';
import { formatDeadline } from '../lib/utils';
import { Badge } from './ui/badge';
import { RecommendationCard } from './recommendation-card';

interface RecommendationDashboardProps {
  status: ReviewStatus;
  deadline: string;
  selectedIds: string[];
  onToggleRecommendation: (id: string) => void;
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

export function RecommendationDashboard({ status, deadline, selectedIds, onToggleRecommendation }: RecommendationDashboardProps) {
  const isReady = status === 'success';
  const isLoading = status === 'loading';

  return (
    <section id="recommendations" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge tone={isReady ? 'green' : 'gray'}>{isReady ? 'Ranked recommendations' : 'Sample recommendation area'}</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-husky-purple-dark sm:text-4xl">Recommendation dashboard</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-husky-muted">
            {isReady
              ? `Verified UWB activities are grouped around the ${formatDeadline(deadline)} deadline so students can separate immediate application moves from longer-term resume building.`
              : 'Run the mocked analysis to unlock ranked UWB recommendations grouped by urgency.'}
          </p>
        </div>
        <div className="premium-card rounded-2xl px-4 py-3 text-sm font-semibold text-husky-muted">
          <span className="text-2xl font-black text-husky-purple">{selectedIds.length}</span> recommendations added to roadmap
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        {groups.map((group) => {
          const groupRecommendations = recommendations.filter((recommendation) => recommendation.group === group.id);
          return (
            <div key={group.id} className="premium-panel rounded-[2rem] p-4">
              <div className="mb-4 rounded-[1.35rem] bg-husky-purple-dark p-5 text-white shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black">{group.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">{group.summary}</p>
                  </div>
                  <Badge tone={group.id === 'in-time' ? 'gold' : 'purple'}>{groupRecommendations.length} matches</Badge>
                </div>
              </div>
              <div className="grid gap-4">
                {isReady ? (
                  groupRecommendations.map((recommendation) => (
                    <RecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      selected={selectedIds.includes(recommendation.id)}
                      onToggle={onToggleRecommendation}
                    />
                  ))
                ) : (
                  <div className="rounded-[1.6rem] border border-dashed border-husky-purple/20 bg-white/75 p-6 text-center shadow-soft">
                    <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-husky-purple/10 to-husky-gold/20 shadow-soft" />
                    <h4 className="mt-4 text-lg font-black text-husky-purple-dark">
                      {isLoading ? 'Ranking verified matches' : 'Recommendations unlock after analysis'}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-husky-muted">
                      {isLoading
                        ? 'Husky-Review is sorting activity fit, urgency, verification dates, and confidence scores.'
                        : 'Upload or select a sample resume, add a job description, and run the mocked review.'}
                    </p>
                    <div className="mt-5 space-y-2">
                      {[0, 1, 2].map((item) => (
                        <div
                          key={item}
                          className="h-3 rounded-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:220%_100%] motion-safe:animate-shimmer"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
