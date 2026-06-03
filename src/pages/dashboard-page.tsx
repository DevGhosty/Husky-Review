import { useAuth0 } from '@auth0/auth0-react';
import { getAccessTokenRequestOptions } from '../auth/auth0-config';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Gauge,
  LockKeyhole,
  Map,
  Sparkles,
} from 'lucide-react';
import { AnalysisPreview } from '../components/analysis-preview';
import { UploadPanel } from '../components/upload-panel';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Surface } from '../components/layout/surface';
import { analyzeReview as analyzeReviewRequest, uploadResume } from '../auth/supabase-client';
import { useReview } from '../context/review-context';
import { useResumes } from '../hooks/useResumes';
import { useReviewQuota } from '../hooks/useReviewQuota';
import { hasJobPostingInput, jobPostingInputProgress } from '../lib/utils';

const activityItems = [
  { label: 'Resume workspace', value: 'Ready', detail: 'Private upload path available', icon: FileText },
  { label: 'Privacy status', value: 'Private', detail: 'Resumes are removed by scheduled cleanup', icon: LockKeyhole },
];

export function DashboardPage() {
  const workflowRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { getAccessTokenSilently } = useAuth0();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);
  const { resumes, loading: resumesLoading } = useResumes();
  const { quota, loading: quotaLoading, error: quotaError } = useReviewQuota(quotaRefreshKey);
  const {
    status,
    loadingStepIndex,
    resumeFile,
    resumeId,
    fileName,
    jobDescription,
    jobPostingUrl,
    deadline,
    selectedIds,
    analysis,
    error,
    setResumeFile,
    setResumeId,
    selectSavedResume,
    setJobDescription,
    setJobPostingUrl,
    setDeadline,
    startAnalysis,
    completeAnalysis,
    failAnalysis,
  } = useReview();

  const postingProgress = jobPostingInputProgress(jobDescription, jobPostingUrl);
  const readiness = Math.min(
    100,
    (fileName ? 38 : 0) + (postingProgress / 100) * 42 + (status === 'success' ? 20 : 0),
  );

  useEffect(() => {
    if (location.hash === '#workflow') {
      window.setTimeout(() => workflowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }, [location.hash]);

  function scrollToWorkflow() {
    workflowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function analyzeReview() {
    setSubmitError(null);

    try {
      startAnalysis();
      let activeResumeId = resumeId;

      if (resumeFile) {
        setIsSubmitting(true);
        const token = await getAccessTokenSilently(getAccessTokenRequestOptions());
        const uploadedResume = await uploadResume(token, resumeFile, {
          jobPostingUrl,
          deadline,
          last_updated: new Date().toISOString(),
        });
        activeResumeId = uploadedResume.id;
        setResumeId(uploadedResume.id);
      }

      if (!activeResumeId) {
        throw new Error('Upload a resume file before running a review.');
      }

      const token = await getAccessTokenSilently(getAccessTokenRequestOptions());
      const analysis = await analyzeReviewRequest(token, {
        resumeId: activeResumeId,
        jobDescription,
        jobPostingUrl,
        deadline,
        userApiKey: userApiKey.trim() || undefined,
      });
      completeAnalysis(analysis);
      setQuotaRefreshKey((current) => current + 1);
    } catch (error) {
      setSubmitError((error as Error).message);
      failAnalysis((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <section className="section-enter mx-auto max-w-[86rem] px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <Surface variant="premium" className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
            <div className="absolute -right-20 -top-20 size-60 rounded-full bg-husky-gold/20 blur-3xl" aria-hidden="true" />
            <div className="relative flex flex-col justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="purple" className="rounded-full px-4 py-2">
                    Career command center
                  </Badge>
                  <Badge tone={status === 'success' ? 'green' : 'gray'} className="rounded-full px-4 py-2">
                    {status === 'success' ? 'Review ready' : 'Review workspace'}
                  </Badge>
                </div>
                <h1 className="type-page-title type-page-title--brand mt-5 max-w-3xl">
                  Review, compare, and plan from one working dashboard.
                </h1>
                <p className="type-lead mt-4 max-w-2xl">
                  This is the tool surface. The public homepage explains Husky-Review; this workspace keeps the resume review flow, analysis preview, roadmap, and privacy status in task-first panels.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ...activityItems,
                  {
                    label: 'Next deadline',
                    value: deadline ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${deadline}T12:00:00`)) : 'Not set',
                    detail: 'Current application planning date',
                    icon: CalendarDays,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.label}
                      className="rounded-2xl border border-border bg-card/80 p-4 shadow-soft transition-[box-shadow,transform] duration-motion-normal ease-brand active:scale-[0.99] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-card dark:bg-card/90"
                    >
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <p className="mt-3 text-xs font-bold text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{item.value}</p>
                      <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">{item.detail}</p>
                    </article>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="h-12" onClick={scrollToWorkflow}>
                  <Sparkles className="size-4" aria-hidden="true" />
                  Start new review
                </Button>
                <Button asChild variant="secondary" className="h-12">
                  <Link to="/app/saved-reviews">
                    Saved reviews
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="h-12">
                  <Link to="/app/roadmap">
                    Open roadmap
                  <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </Surface>

          <div className="section-enter grid gap-5 lg:grid-cols-[0.8fr_1.2fr]" style={{ animationDelay: '90ms' }}>
            <Surface variant="dark" className="rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white/65">Readiness score</p>
                  <p className="mt-1 text-5xl font-black text-white">{Math.round(readiness)}%</p>
                </div>
                <span className="grid size-14 place-items-center rounded-2xl bg-white/[0.10] text-husky-gold-bright">
                  <Gauge className="size-7" aria-hidden="true" />
                </span>
              </div>
              <Progress value={readiness} className="mt-5 h-2.5 bg-white/10 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-husky-gold [&_[data-slot=progress-indicator]]:to-white" />
              <p className="mt-4 text-sm font-medium leading-6 text-white/70">
                Readiness reacts to the current resume, job posting, and analysis state.
              </p>
            </Surface>

            <div className="grid gap-5 md:grid-cols-2">
              <Surface variant="card" className="rounded-[1.6rem] p-5">
                <ClipboardCheck className="size-7 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Input console</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {hasJobPostingInput(jobDescription, jobPostingUrl)
                    ? 'Resume and posting are in place. Scroll down to run or update your review.'
                    : 'Add your resume plus a posting link or pasted job description in the workflow panel below.'}
                </p>
              </Surface>
              <Surface variant="card" className="rounded-[1.6rem] p-5">
                <Map className="size-7 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">{selectedIds.length || 4} roadmap items</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Selected recommendations feed into the planning timeline.</p>
              </Surface>
              <Surface variant="card" className="rounded-[1.6rem] p-5 md:col-span-2">
                <BellRing className="size-7 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Authenticated workspace</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Resume uploads are saved to the account-backed storage path when you run an analysis.</p>
              </Surface>
            </div>
          </div>
        </div>
      </section>

      <div ref={workflowRef}>
        <UploadPanel
          status={status}
          fileName={fileName}
          jobDescription={jobDescription}
          jobPostingUrl={jobPostingUrl}
          deadline={deadline}
          userApiKey={userApiKey}
          savedResumes={resumes}
          selectedResumeId={resumeId}
          resumesLoading={resumesLoading}
          quota={quota}
          quotaLoading={quotaLoading}
          quotaError={quotaError}
          isSubmitting={isSubmitting}
          submitError={submitError}
          hasAnalyzableResume={Boolean(resumeFile || resumeId)}
          onResumeFileChange={setResumeFile}
          onSavedResumeSelect={selectSavedResume}
          onJobDescriptionChange={setJobDescription}
          onJobPostingUrlChange={setJobPostingUrl}
          onDeadlineChange={setDeadline}
          onUserApiKeyChange={setUserApiKey}
          onAnalyze={analyzeReview}
        />
      </div>

      <AnalysisPreview status={status} loadingStepIndex={loadingStepIndex} analysis={analysis} error={error} />

      <section className="section-enter mx-auto max-w-[86rem] px-5 pb-16 sm:px-8 lg:px-12">
        <Surface variant="premium" className="grid gap-5 rounded-[2rem] p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="type-eyebrow">Workspace pages</p>
            <h2 className="type-section-title type-section-title--brand mt-2">Continue through the tool navigation.</h2>
            <p className="type-body mt-3 max-w-2xl sm:text-[0.9375rem] sm:leading-relaxed">
              The app shell separates roadmap planning, resources, saved reviews, and profile settings around the current review.
            </p>
          </div>
          <div className="grid min-w-0 w-full gap-3 sm:grid-cols-3">
            <Button asChild variant="secondary" className="h-12">
              <Link to="/app/resources">
                <ClipboardCheck className="size-4" aria-hidden="true" />
                Resources
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-12">
              <Link to="/app/roadmap">
                <Map className="size-4" aria-hidden="true" />
                Roadmap
              </Link>
            </Button>
            <Button asChild className="h-12">
              <Link to="/app/saved-reviews">
              <Sparkles className="size-4" aria-hidden="true" />
              Saved reviews
              <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Surface>
      </section>
    </main>
  );
}
