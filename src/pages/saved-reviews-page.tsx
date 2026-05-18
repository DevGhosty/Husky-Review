import { Link } from 'react-router-dom';
import { ArrowRight, BookmarkCheck, CalendarDays, FileText, Sparkles } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Surface } from '../components/layout/surface';
import { formatDeadline } from '../lib/utils';
import { defaultDeadline, matchScore, recommendations } from '../data/mockData';
import { useReview } from '../context/review-context';

const savedReviews = [
  {
    id: 'frontend-internship',
    title: 'Frontend Internship Review',
    role: 'React accessibility internship',
    deadline: defaultDeadline,
    score: matchScore.score,
    selectedCount: 4,
  },
  {
    id: 'product-engineering',
    title: 'Product Engineering Draft',
    role: 'Full-stack product role',
    deadline: '2026-06-14',
    score: 71,
    selectedCount: 3,
  },
  {
    id: 'research-assistant',
    title: 'Research Assistant Prep',
    role: 'Data and faculty collaboration',
    deadline: '2026-07-02',
    score: 68,
    selectedCount: 2,
  },
];

export function SavedReviewsPage() {
  const { status, selectedIds, showSampleReview } = useReview();

  return (
    <main>
      <section className="mx-auto max-w-[86rem] px-5 py-10 sm:px-8 lg:px-12">
        <Surface variant="premium" className="rounded-[2rem] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Badge tone="purple" className="rounded-full px-4 py-2">
                <BookmarkCheck className="size-4" aria-hidden="true" />
                Saved Reviews
              </Badge>
              <h1 className="mt-4 max-w-3xl font-display text-4xl font-black leading-[0.98] tracking-normal text-foreground sm:text-6xl">
                Review history for planning the next application.
              </h1>
              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-muted-foreground">
                These saved reviews are mocked navigation examples. No browser storage, backend persistence, or real resume analysis is implemented in this frontend version.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[25rem]">
              <Button asChild variant="secondary" className="h-12">
                <Link to="/app#workflow">Start new review</Link>
              </Button>
              <Button className="h-12" onClick={showSampleReview}>
                <Sparkles className="size-4" aria-hidden="true" />
                Load sample
              </Button>
            </div>
          </div>
        </Surface>
      </section>

      <section className="mx-auto max-w-[86rem] px-5 pb-16 sm:px-8 lg:px-12">
        <div className="grid gap-5 lg:grid-cols-3">
          {savedReviews.map((review, index) => (
            <Surface key={review.id} variant="card" className="relative overflow-hidden rounded-[1.8rem] p-5 transition hover:-translate-y-1 hover:shadow-premium">
              <div className="absolute -right-14 -top-14 size-32 rounded-full bg-husky-gold/20 blur-2xl" aria-hidden="true" />
              <div className="relative flex items-start justify-between gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <FileText className="size-6" aria-hidden="true" />
                </span>
                <Badge tone={index === 0 && status === 'success' ? 'green' : 'gray'}>
                  {index === 0 && status === 'success' ? 'Current sample' : 'Mock record'}
                </Badge>
              </div>
              <h2 className="relative mt-5 text-xl font-black text-foreground">{review.title}</h2>
              <p className="relative mt-2 text-sm leading-6 text-muted-foreground">{review.role}</p>
              <div className="relative mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-husky-purple/[0.06] p-4">
                  <p className="text-xs font-bold text-muted-foreground">Match score</p>
                  <p className="mt-1 text-2xl font-black text-primary">{review.score}%</p>
                </div>
                <div className="rounded-2xl bg-husky-gold/[0.14] p-4">
                  <p className="text-xs font-bold text-muted-foreground">Roadmap items</p>
                  <p className="mt-1 text-2xl font-black text-foreground">
                    {index === 0 && selectedIds.length > 0 ? selectedIds.length : review.selectedCount}
                  </p>
                </div>
              </div>
              <p className="relative mt-5 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                Deadline {formatDeadline(review.deadline)}
              </p>
              <Button asChild variant={index === 0 ? 'primary' : 'secondary'} className="relative mt-5 w-full">
                <Link to={index === 0 ? '/app/roadmap' : '/app/resources'}>
                  {index === 0 ? 'Open roadmap' : 'View related resources'}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </Surface>
          ))}
        </div>

        <Surface variant="stroke" className="mt-6 rounded-[1.6rem] p-5 text-center">
          <p className="text-sm font-semibold leading-6 text-muted-foreground">
            Saved review data is illustrative. A future backend can replace these cards with authenticated review history.
          </p>
          <p className="mt-2 text-sm font-black text-husky-purple">{recommendations.length} mocked recommendation records available for preview.</p>
        </Surface>
      </section>
    </main>
  );
}
