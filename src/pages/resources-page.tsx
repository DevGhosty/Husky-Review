import { Link } from 'react-router-dom';
import { DatabaseZap, Filter, ShieldCheck } from 'lucide-react';
import { RecommendationDashboard } from '../components/recommendation-dashboard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Surface } from '../components/layout/surface';
import { useReview } from '../context/review-context';

export function ResourcesPage() {
  const { status, deadline, selectedIds, analysis, toggleRecommendation } = useReview();
  const recommendations = analysis?.recommendations || [];
  const resourceStats = [
    { label: 'Verified matches', value: recommendations.length.toString(), icon: ShieldCheck },
    { label: 'In-Time options', value: recommendations.filter((item) => item.group === 'in-time').length.toString(), icon: Filter },
    { label: 'Source metadata', value: recommendations.length ? 'On' : 'Pending', icon: DatabaseZap },
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
              Browse UW activity recommendations with active status, last-verified dates, source labels, and roadmap selection controls.
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
          <div className="grid gap-4">
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
      <RecommendationDashboard
        status={status}
        deadline={deadline}
        selectedIds={selectedIds}
        recommendations={recommendations}
        onToggleRecommendation={toggleRecommendation}
      />
    </main>
  );
}
