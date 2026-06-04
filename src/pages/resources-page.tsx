import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DatabaseZap, Filter, Layers, ShieldCheck } from 'lucide-react';
import { RecommendationDashboard } from '../components/recommendation-dashboard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Surface } from '../components/layout/surface';
import { useReview } from '../context/review-context';
import { useProfileSettings } from '../context/profile-settings-context';
import { ACTIVITY_INTEREST_OPTIONS } from '../data/uwb-catalog';
import {
  filterRecommendationsByType,
  filterRecommendationsForDisplay,
  type RecommendationTypeFilter,
} from '../lib/recommendation-display';
import type { ActivityType } from '../types/analysis';

export function ResourcesPage() {
  const { status, deadline, selectedIds, analysis, toggleRecommendation } = useReview();
  const { settings } = useProfileSettings();
  const [typeFilter, setTypeFilter] = useState<RecommendationTypeFilter>('all');

  const baseRecommendations = useMemo(
    () => filterRecommendationsForDisplay(analysis?.recommendations || [], settings),
    [analysis?.recommendations, settings],
  );

  const recommendations = useMemo(
    () => filterRecommendationsByType(baseRecommendations, typeFilter),
    [baseRecommendations, typeFilter],
  );

  const typesCovered = useMemo(
    () => new Set(baseRecommendations.map((item) => item.type)).size,
    [baseRecommendations],
  );

  const filterOptions = useMemo(() => {
    const interests = settings.activityInterests.length
      ? settings.activityInterests
      : (['club', 'course', 'event'] as ActivityType[]);
    return [
      { id: 'all' as const, label: 'All types' },
      ...ACTIVITY_INTEREST_OPTIONS.filter((option) => interests.includes(option.id)).map((option) => ({
        id: option.id,
        label: option.label,
      })),
    ];
  }, [settings.activityInterests]);

  const resourceStats = [
    { label: 'Verified matches', value: baseRecommendations.length.toString(), icon: ShieldCheck },
    { label: 'Types covered', value: typesCovered.toString(), icon: Layers },
    {
      label: 'In-Time options',
      value: baseRecommendations.filter((item) => item.group === 'in-time').length.toString(),
      icon: Filter,
    },
    { label: 'Source metadata', value: baseRecommendations.length ? 'On' : 'Pending', icon: DatabaseZap },
  ];

  return (
    <main>
      <section className="mx-auto max-w-[86rem] px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-stretch">
          <Surface variant="premium" className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
            <div className="absolute -left-16 -top-16 size-52 rounded-full bg-husky-purple/10 blur-3xl" aria-hidden="true" />
            <Badge tone="green" className="relative rounded-full px-4 py-2">
              Verified resource workspace
            </Badge>
            <h1 className="relative mt-4 max-w-3xl type-page-title type-page-title--brand">
              Campus-connected activities without filler recommendations.
            </h1>
            <p className="relative mt-5 max-w-2xl type-lead">
              Browse up to five top matches per activity type from your profile interests, with time-commitment context,
              verification dates, and roadmap selection controls.
            </p>
            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12">
                <Link to="/app#workflow">Start review</Link>
              </Button>
              <Button asChild variant="secondary" className="h-12">
                <Link to="/app/roadmap">Open roadmap</Link>
              </Button>
            </div>
          </Surface>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {resourceStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Surface key={stat.label} variant="card" className="flex items-center justify-between gap-4 rounded-[1.6rem] p-5">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-3xl font-black text-foreground">{stat.value}</p>
                  </div>
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-husky-purple/10 to-husky-gold/20 text-primary dark:text-husky-gold-bright">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                </Surface>
              );
            })}
          </div>
        </div>
      </section>

      {status === 'success' && baseRecommendations.length > 0 && (
        <section className="mx-auto max-w-[86rem] px-5 pb-4 sm:px-8 lg:px-12">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={typeFilter === option.id ? 'primary' : 'outline'}
                className="h-10"
                aria-pressed={typeFilter === option.id}
                onClick={() => setTypeFilter(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </section>
      )}

      <RecommendationDashboard
        status={status}
        deadline={deadline}
        selectedIds={selectedIds}
        recommendations={recommendations}
        showVerificationDates={settings.showVerificationDates}
        onToggleRecommendation={toggleRecommendation}
        layout="byType"
        activityTypeOrder={
          settings.activityInterests.length ? settings.activityInterests : ['club', 'course', 'event']
        }
      />
    </main>
  );
}
