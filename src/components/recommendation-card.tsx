import { Check, ExternalLink, Plus, Star, X } from 'lucide-react';
import type { Recommendation } from '../types/analysis';
import { formatPercent } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface RecommendationCardProps {
  recommendation: Recommendation;
  selected: boolean;
  onToggle: (id: string) => void;
}

const typeLabels: Record<Recommendation['type'], string> = {
  club: 'Club',
  course: 'Course',
  event: 'Event',
  fellowship: 'Fellowship',
  project: 'Project',
  research: 'Research',
};

export function RecommendationCard({ recommendation, selected, onToggle }: RecommendationCardProps) {
  return (
    <article className="group rounded-3xl border border-white/70 bg-white/[0.86] p-5 shadow-soft backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={recommendation.group === 'in-time' ? 'gold' : 'purple'}>
              {recommendation.group === 'in-time' ? 'In-Time' : 'Next-Time'}
            </Badge>
            <Badge tone="gray">{typeLabels[recommendation.type]}</Badge>
          </div>
          <h3 className="mt-4 text-xl font-black leading-tight text-husky-purple-dark">{recommendation.name}</h3>
        </div>
        <div className="rounded-2xl bg-husky-purple/[0.08] px-3 py-2 text-center">
          <Star className="mx-auto h-4 w-4 fill-husky-gold text-husky-gold" aria-hidden="true" />
          <span className="mt-1 block text-sm font-black text-husky-purple">{formatPercent(recommendation.confidence)}</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-husky-muted">{recommendation.whyItHelps}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {recommendation.tags.map((tag) => (
          <Badge key={tag} tone="purple">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="font-black text-husky-ink">Active status</p>
          <p className="mt-1 flex items-center gap-1.5 font-semibold text-emerald-700">
            <Check className="h-4 w-4" aria-hidden="true" />
            {recommendation.active ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div>
          <p className="font-black text-husky-ink">Last verified</p>
          <p className="mt-1 font-semibold text-husky-muted">{recommendation.lastVerified}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-husky-muted">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          {recommendation.sourceLabel}
        </span>
        <Button
          variant={selected ? 'dark' : 'secondary'}
          className="px-4 py-2.5"
          aria-pressed={selected}
          onClick={() => onToggle(recommendation.id)}
        >
          {selected ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {selected ? 'Remove from roadmap' : 'Add to roadmap'}
        </Button>
      </div>
    </article>
  );
}
