import { Check, Clock3, ExternalLink, Plus, Star, X } from 'lucide-react';
import type { Recommendation } from '../types/analysis';
import { resolveSourceLink } from '../lib/source-link';
import { cn, formatPercent } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface RecommendationCardProps {
  recommendation: Recommendation;
  selected: boolean;
  showVerificationDates?: boolean;
  onToggle: (id: string) => void;
  staggerIndex?: number;
}

const typeLabels: Record<Recommendation['type'], string> = {
  club: 'Club',
  course: 'Course',
  event: 'Event',
  fellowship: 'Fellowship',
  project: 'Project',
  research: 'Research',
};

const campusLabels: Record<Recommendation['campus'], string> = {
  seattle: 'UW Seattle',
  bothell: 'UW Bothell',
  tacoma: 'UW Tacoma',
};

export function RecommendationCard({
  recommendation,
  selected,
  showVerificationDates = true,
  onToggle,
  staggerIndex,
}: RecommendationCardProps) {
  const sourceHref = resolveSourceLink(recommendation.sourceLabel, recommendation.sourceUrl);

  return (
    <Card
      className={cn(
        'relative dashboard-card group rounded-[1.6rem] border-border/80 p-0 transition-[transform,box-shadow,border-color] duration-motion-normal ease-brand motion-safe:hover:-translate-y-1 hover:shadow-premium active:scale-[0.99] motion-safe:active:scale-[0.99]',
        selected && 'ring-2 ring-husky-gold/60',
        staggerIndex !== undefined && 'motion-safe:animate-slide-in motion-reduce:animate-none',
      )}
      style={staggerIndex !== undefined ? { animationDelay: `${Math.min(staggerIndex * 72, 216)}ms` } : undefined}
    >
      <CardContent className="p-5">
        <div className="absolute inset-x-5 top-0 h-1 rounded-b-full bg-gradient-to-r from-husky-purple via-husky-gold to-husky-purple opacity-70" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={recommendation.group === 'in-time' ? 'gold' : 'purple'}>
                {recommendation.group === 'in-time' ? 'In-Time' : 'Next-Time'}
              </Badge>
              <Badge tone="gray">{typeLabels[recommendation.type]}</Badge>
              <Badge tone="gray">{campusLabels[recommendation.campus]}</Badge>
            </div>
            <h3 className="mt-4 text-xl font-semibold leading-tight tracking-normal text-foreground">{recommendation.name}</h3>
          </div>
          <div className="rounded-2xl bg-primary/10 px-3 py-2 text-center shadow-inner dark:bg-white/10">
            <Star className="mx-auto size-4 fill-husky-gold text-husky-gold" aria-hidden="true" />
            <span className="mt-1 block text-sm font-black text-foreground">{formatPercent(recommendation.confidence)}</span>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">{recommendation.whyItHelps}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {recommendation.tags.map((tag) => (
            <Badge key={tag} tone="purple">
              {tag}
            </Badge>
          ))}
        </div>

        <div
          className={cn(
            'mt-5 grid gap-3 rounded-2xl border border-border bg-muted/45 p-4 text-sm dark:bg-muted/20',
            showVerificationDates ? 'sm:grid-cols-2' : 'sm:grid-cols-1',
          )}
        >
          <div>
            <p className="font-semibold text-foreground">Active status</p>
            <p className="mt-1 flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
              <Check className="size-4" aria-hidden="true" />
              {recommendation.active ? 'Active' : 'Inactive'}
            </p>
          </div>
          {showVerificationDates && (
            <div>
              <p className="font-semibold text-foreground">Last verified</p>
              <p className="mt-1 flex items-center gap-1.5 font-semibold text-muted-foreground">
                <Clock3 className="size-4 text-primary" aria-hidden="true" />
                {recommendation.lastVerified}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {sourceHref ? (
            <a
              href={sourceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary underline-offset-2 hover:underline"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              {recommendation.sourceLabel}
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <ExternalLink className="size-3.5" aria-hidden="true" />
              {recommendation.sourceLabel}
            </span>
          )}
          <Button
            variant={selected ? 'dark' : 'secondary'}
            className="h-10 px-4 text-sm shadow-soft"
            aria-pressed={selected}
            onClick={() => onToggle(recommendation.id)}
          >
            {selected ? <X className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            {selected ? 'Remove from roadmap' : 'Add to roadmap'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
