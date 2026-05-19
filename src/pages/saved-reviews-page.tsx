import { Link } from 'react-router-dom';
import { ArrowRight, BookmarkCheck, CalendarDays, FileText, Sparkles, Trash2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Surface } from '../components/layout/surface';
import { formatDeadline } from '../lib/utils';
import { defaultDeadline, matchScore, recommendations } from '../data/mockData';
import { useReview } from '../context/review-context';
import { useResumes } from '../hooks/useResumes';
import { useState } from 'react';


const mockSavedReviews = [
  {
    id: 'healthcare-admin-internship',
    title: 'Healthcare Admin Internship Review',
    role: 'Program coordinator intern — community wellness',
    deadline: defaultDeadline,
    score: matchScore.score,
    selectedCount: 4,
  },
  {
    id: 'marketing-coordinator',
    title: 'Marketing Coordinator Draft',
    role: 'Campus communications and outreach role',
    deadline: '2026-06-14',
    score: 71,
    selectedCount: 3,
  },
  {
    id: 'research-assistant',
    title: 'Research Assistant Prep',
    role: 'Faculty lab collaboration and data support',
    deadline: '2026-07-02',
    score: 68,
    selectedCount: 2,
  },
];

export function SavedReviewsPage() {
  const { status, selectedIds, showSampleReview } = useReview();
  const { resumes, loading: resumesLoading, error: resumesError, deleteResume } = useResumes();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteResume = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteResume(id);
    } finally {
      setDeletingId(null);
    }
  };

  const savedReviews = mockSavedReviews;

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
              <h1 className="mt-4 max-w-3xl type-page-title type-page-title--brand">
                Review history and saved resumes.
              </h1>
              <p className="mt-5 max-w-2xl type-lead">
                Access your saved reviews and uploaded resumes. Your data is securely stored and scoped to your account.
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
        {savedReviews.length === 0 ? (
          <Surface variant="stroke" className="flex flex-col items-center rounded-[1.8rem] p-8 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/12 to-husky-gold/20 text-primary shadow-soft ring-1 ring-border/50">
              <BookmarkCheck className="size-7" aria-hidden />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-foreground">No saved reviews yet</h2>
            <p className="type-body mx-auto mt-2 max-w-lg">
              Run a review from the dashboard to build your first saved record. This frontend uses mock data only.
            </p>
            <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild className="h-12 sm:min-w-[11rem]">
                <Link to="/app#workflow">Start new review</Link>
              </Button>
              <Button className="h-12 sm:min-w-[11rem]" onClick={showSampleReview}>
                <Sparkles className="size-4" aria-hidden />
                Load sample
              </Button>
            </div>
          </Surface>
        ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {savedReviews.map((review, index) => (
            <Surface key={review.id} variant="card" className="relative overflow-hidden rounded-[1.8rem] p-5 transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-premium">
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
                <div className="stat-tile rounded-2xl p-4">
                  <p className="text-xs font-bold text-muted-foreground">Match score</p>
                  <p className="mt-1 text-2xl font-black text-primary">{review.score}%</p>
                </div>
                <div className="stat-tile rounded-2xl p-4">
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
        )}

        <Surface variant="stroke" className="mt-6 rounded-[1.6rem] p-5 text-center">
          <p className="text-sm font-semibold leading-6 text-muted-foreground">
            {recommendations.length} mocked recommendation records available for preview.
          </p>
        </Surface>
      </section>

      {/* Saved Resumes Section */}
      <section className="mx-auto max-w-[86rem] px-5 pb-16 sm:px-8 lg:px-12">
        <h2 className="text-2xl font-bold text-foreground mb-4">Your Saved Resumes</h2>

        {resumesLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="mt-2 text-muted-foreground">Loading resumes...</p>
          </div>
        )}

        {resumesError && (
          <Surface variant="stroke" className="rounded-[1.6rem] p-5 text-center border border-red-200 bg-red-50">
            <p className="text-sm font-semibold text-red-600">{resumesError}</p>
          </Surface>
        )}

        {!resumesLoading && resumes.length === 0 && !resumesError && (
          <Surface variant="stroke" className="rounded-[1.6rem] p-8 text-center">
            <p className="text-sm font-semibold leading-6 text-muted-foreground">
              No saved resumes yet. Upload your first resume to get started.
            </p>
          </Surface>
        )}

        {!resumesLoading && resumes.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-3">
            {resumes.map((resume) => (
              <Surface key={resume.id} variant="card" className="relative overflow-hidden rounded-[1.8rem] p-5 transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-premium">
                <div className="absolute -right-14 -top-14 size-32 rounded-full bg-husky-gold/20 blur-2xl" aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <FileText className="size-6" aria-hidden="true" />
                  </span>
                  <Badge tone="green">Saved</Badge>
                </div>
                <h3 className="relative mt-5 text-xl font-black text-foreground truncate">{resume.filename}</h3>
                <p className="relative mt-2 text-sm leading-6 text-muted-foreground">
                  {new Date(resume.uploaded_at).toLocaleDateString()}
                </p>

                <div className="relative mt-5 flex gap-2">
                  <Button asChild variant="secondary" className="flex-1">
                    <a href={resume.file_url} target="_blank" rel="noopener noreferrer">
                      Open
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDeleteResume(resume.id)}
                    disabled={deletingId === resume.id}
                    className="px-3"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </Surface>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
