import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookmarkCheck, CalendarDays, FileText, Loader2, Trash2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Surface } from '../components/layout/surface';
import { formatDeadline } from '../lib/utils';
import { useReview } from '../context/review-context';
import { useResumes } from '../hooks/useResumes';
import { useReviews } from '../hooks/useReviews';

export function SavedReviewsPage() {
  const navigate = useNavigate();
  const { analysis, loadReviewById, resetReview, selectSavedResume } = useReview();
  const { reviews, loading: reviewsLoading, error: reviewsError, deleteReview } = useReviews();
  const { resumes, loading: resumesLoading, error: resumesError, deleteResume } = useResumes();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [deleteResumeErrors, setDeleteResumeErrors] = useState<Record<string, string>>({});
  const [deleteReviewErrors, setDeleteReviewErrors] = useState<Record<string, string>>({});
  const [openingReviewId, setOpeningReviewId] = useState<string | null>(null);
  const [openReviewErrors, setOpenReviewErrors] = useState<Record<string, string>>({});

  const handleDeleteResume = async (id: string) => {
    setDeletingId(id);
    setDeleteResumeErrors((prev) => ({ ...prev, [id]: '' }));
    try {
      await deleteResume(id);
    } catch (err) {
      setDeleteResumeErrors((prev) => ({ ...prev, [id]: (err as Error).message || 'Delete failed' }));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteReview = async (id: string) => {
    setDeletingReviewId(id);
    setDeleteReviewErrors((prev) => ({ ...prev, [id]: '' }));
    try {
      await deleteReview(id);
      if (analysis?.id === id) {
        resetReview();
      }
    } catch (err) {
      setDeleteReviewErrors((prev) => ({ ...prev, [id]: (err as Error).message || 'Delete failed' }));
    } finally {
      setDeletingReviewId(null);
    }
  };

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
                Uploaded resumes and completed reviews are stored in your account-backed Supabase workspace.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[25rem]">
              <Button asChild variant="secondary" className="h-12">
                <Link to="/app#workflow">Start new review</Link>
              </Button>
              <Button asChild className="h-12">
                <Link to="/app/roadmap">Open roadmap</Link>
              </Button>
            </div>
          </div>
        </Surface>
      </section>

      <section className="mx-auto max-w-[86rem] px-5 pb-16 sm:px-8 lg:px-12">
        {reviewsLoading ? (
          <Surface variant="stroke" className="flex flex-col items-center rounded-[1.8rem] p-8 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/12 to-husky-gold/20 text-primary shadow-soft ring-1 ring-border/50">
              <BookmarkCheck className="size-7 motion-safe:animate-pulse" aria-hidden />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-foreground">Loading saved reviews</h2>
            <p className="type-body mx-auto mt-2 max-w-lg">Fetching your account-scoped review history.</p>
          </Surface>
        ) : reviewsError ? (
          <Surface variant="stroke" className="rounded-[1.6rem] border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm font-semibold text-red-600">{reviewsError}</p>
          </Surface>
        ) : reviews.length === 0 ? (
          <Surface variant="stroke" className="flex flex-col items-center rounded-[1.8rem] p-8 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/12 to-husky-gold/20 text-primary shadow-soft ring-1 ring-border/50">
              <BookmarkCheck className="size-7" aria-hidden />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-foreground">No saved reviews yet</h2>
            <p className="type-body mx-auto mt-2 max-w-lg">
              Run a review from the dashboard to build your first saved record.
            </p>
            <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild className="h-12 sm:min-w-[11rem]">
                <Link to="/app#workflow">Start new review</Link>
              </Button>
            </div>
          </Surface>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {reviews.map((review) => (
              <Surface key={review.id} variant="card" className="relative overflow-hidden rounded-[1.8rem] p-5 transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-premium">
                <div className="absolute -right-14 -top-14 size-32 rounded-full bg-husky-gold/20 blur-2xl" aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <FileText className="size-6" aria-hidden="true" />
                  </span>
                  <Badge tone={analysis?.id === review.id ? 'green' : 'gray'}>
                    {analysis?.id === review.id ? 'Current review' : 'Saved review'}
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
                    <p className="mt-1 text-2xl font-black text-foreground">{review.selectedCount}</p>
                  </div>
                </div>
                <p className="relative mt-5 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                  Deadline {review.deadline ? formatDeadline(review.deadline) : 'not set'}
                </p>
                <p className="relative mt-2 text-xs font-bold text-muted-foreground">
                  Resume {review.resumeFilename || 'not recorded'} - Updated {new Date(review.updatedAt).toLocaleDateString()}
                </p>
                <div className="relative mt-5 flex gap-2">
                  <Button
                    type="button"
                    variant={analysis?.id === review.id ? 'primary' : 'secondary'}
                    className="flex-1"
                    disabled={openingReviewId === review.id}
                    aria-busy={openingReviewId === review.id}
                    onClick={async () => {
                      setOpenReviewErrors((prev) => ({ ...prev, [review.id]: '' }));
                      setOpeningReviewId(review.id);
                      try {
                        const opened = await loadReviewById(review.id);
                        if (opened) {
                          navigate('/app/roadmap');
                        } else {
                          setOpenReviewErrors((prev) => ({
                            ...prev,
                            [review.id]: 'Could not open this review. Try again.',
                          }));
                        }
                      } finally {
                        setOpeningReviewId(null);
                      }
                    }}
                  >
                    {openingReviewId === review.id ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        Opening...
                      </>
                    ) : (
                      <>
                        Open roadmap
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={deletingReviewId === review.id}
                    className="px-3"
                    aria-label={`Delete review ${review.title}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                {openReviewErrors[review.id] && (
                  <p className="relative mt-2 text-xs font-medium text-red-600">{openReviewErrors[review.id]}</p>
                )}
                {deleteReviewErrors[review.id] && (
                  <p className="relative mt-2 text-xs font-medium text-red-600">{deleteReviewErrors[review.id]}</p>
                )}
              </Surface>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[86rem] px-5 pb-16 sm:px-8 lg:px-12">
        <h2 className="mb-4 text-2xl font-bold text-foreground">Your Saved Resumes</h2>

        {resumesLoading && (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-2 text-muted-foreground">Loading resumes...</p>
          </div>
        )}

        {resumesError && (
          <Surface variant="stroke" className="rounded-[1.6rem] border border-red-200 bg-red-50 p-5 text-center">
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
                  <Badge tone="green">Account file</Badge>
                </div>
                <h3 className="relative mt-5 truncate text-xl font-black text-foreground">{resume.filename}</h3>
                <p className="relative mt-2 text-sm leading-6 text-muted-foreground">
                  {new Date(resume.uploaded_at).toLocaleDateString()}
                </p>

                <div className="relative mt-5 flex gap-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      selectSavedResume(resume.id, resume.filename);
                      navigate('/app#workflow');
                    }}
                  >
                    Use
                  </Button>
                  <Button asChild variant="secondary" className="flex-1">
                    <a href={resume.download_url || resume.file_url} target="_blank" rel="noopener noreferrer">
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
                {deleteResumeErrors[resume.id] && (
                  <p className="relative mt-2 text-xs font-medium text-red-600">{deleteResumeErrors[resume.id]}</p>
                )}
              </Surface>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
