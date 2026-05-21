import type { DragEvent } from 'react';
import { CalendarDays, CheckCircle2, FileCheck2, FileUp, Link2, LockKeyhole, Loader2, WandSparkles } from 'lucide-react';
import { Section } from './layout/section';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { sampleJobDescription, sampleJobPostingUrl } from '../data/mockData';
import type { ReviewStatus } from '../types/analysis';
import { cn, hasJobPostingInput, isValidJobPostingUrl, jobPostingInputProgress } from '../lib/utils';

interface UploadPanelProps {
  status: ReviewStatus;
  fileName: string;
  jobDescription: string;
  jobPostingUrl: string;
  deadline: string;
  isSubmitting?: boolean;
  submitError?: string | null;
  onResumeFileChange: (file: File | null) => void;
  onFileNameChange: (fileName: string) => void;
  onJobDescriptionChange: (description: string) => void;
  onJobPostingUrlChange: (url: string) => void;
  onDeadlineChange: (deadline: string) => void;
  onAnalyze: () => void;
}

const readinessSteps = ['Resume parsing', 'Job requirement comparison', 'Verified UWB retrieval', 'Roadmap generation'];

export function UploadPanel({
  status,
  fileName,
  jobDescription,
  jobPostingUrl,
  deadline,
  isSubmitting = false,
  submitError,
  onResumeFileChange,
  onFileNameChange,
  onJobDescriptionChange,
  onJobPostingUrlChange,
  onDeadlineChange,
  onAnalyze,
}: UploadPanelProps) {
  const isLoading = status === 'loading' || isSubmitting;
  const hasPosting = hasJobPostingInput(jobDescription, jobPostingUrl);
  const canAnalyze = fileName.length > 0 && hasPosting && !isLoading;
  const postingProgress = jobPostingInputProgress(jobDescription, jobPostingUrl);
  const readiness = Math.min(
    100,
    Math.round((fileName ? 45 : 0) + (postingProgress / 100) * 45 + (deadline ? 10 : 0)),
  );

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files.item(0);
    if (droppedFile) {
      onResumeFileChange(droppedFile);
    }
  }

  return (
    <Section id="workflow" className="mx-auto max-w-[86rem] px-5 py-14 sm:px-8 lg:px-12">
      <div className="grid gap-6 lg:grid-cols-[0.74fr_1.26fr]">
        <aside className="relative overflow-hidden rounded-[2rem] bg-husky-purple-dark p-7 text-white shadow-premium sm:p-8">
          <div className="absolute -right-20 -top-20 size-60 rounded-full bg-husky-gold/20 blur-3xl motion-safe:animate-breathe" aria-hidden="true" />
          <Badge tone="gold" className="rounded-full px-4 py-2">Review workspace</Badge>
          <h2 className="mt-6 text-3xl font-black tracking-normal sm:text-4xl">Start with the resume and role you care about.</h2>
          <p className="mt-4 text-base leading-7 text-white/75">
            The mocked frontend keeps the flow local while showing how a targeted review can become a verified UWB action plan.
          </p>
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.08] p-5">
            <div className="flex items-center justify-between text-sm font-semibold text-white/[0.72]">
              <span>Review readiness</span>
              <span className="text-husky-gold-bright">{readiness}%</span>
            </div>
            <Progress value={readiness} className="mt-3 h-2.5 bg-white/10 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-husky-gold [&_[data-slot=progress-indicator]]:to-white" />
          </div>
          <div className="mt-5 grid gap-3">
            {readinessSteps.map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-3 transition hover:bg-white/[0.12]">
                <span className="grid size-9 place-items-center rounded-xl bg-husky-gold/20 text-sm font-black text-husky-gold-bright">
                  {readiness > index * 24 ? <CheckCircle2 className="size-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className="text-sm font-semibold text-white/[0.86]">{item}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="command-panel rounded-[2rem] p-5 sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-primary">Input console</p>
              <h3 className="mt-1 text-2xl font-black tracking-normal text-foreground">Start a New Review</h3>
            </div>
            <Badge tone={canAnalyze ? 'green' : 'gray'} className="w-fit rounded-full px-4 py-2">
              {canAnalyze ? 'Ready to analyze' : 'Needs resume and posting'}
            </Badge>
          </div>

          <div className="grid gap-5">
            <div>
              <Label
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className={cn(
                  'group flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/25 bg-card/80 px-5 py-8 text-center shadow-inner transition hover:-translate-y-0.5 hover:border-husky-gold hover:bg-card dark:border-primary/35 dark:bg-muted/25 dark:hover:bg-muted/35',
                  fileName && 'border-emerald-500/50 bg-emerald-50/90 dark:border-emerald-400/45 dark:bg-emerald-950/35',
                )}
              >
                <input
                  className="sr-only"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  aria-label="Upload resume file"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.item(0);
                    if (selectedFile) {
                      onResumeFileChange(selectedFile);
                    }
                  }}
                />
                <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/12 to-husky-gold/20 text-primary shadow-soft transition group-hover:scale-105">
                  {fileName ? <FileCheck2 className="size-7" aria-hidden="true" /> : <FileUp className="size-7" aria-hidden="true" />}
                </span>
                <span className="mt-4 text-base font-black text-foreground">{fileName || 'Drop your resume here'}</span>
                <span className="mt-1 text-sm font-medium text-muted-foreground">PDF, DOC, or DOCX. Stored when you analyze.</span>
              </Label>
              <Button variant="secondary" className="mt-3 h-11 w-full" onClick={() => onFileNameChange('sample-uwb-resume.pdf')}>
                Use sample resume
              </Button>
            </div>

            <div>
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label htmlFor="job-posting-url" className="text-sm font-black text-foreground">
                    Job posting
                  </Label>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    Paste a posting link or add the full description below—either works.
                  </p>
                </div>
                <button
                  type="button"
                  className="font-ui w-fit rounded-lg px-2 py-1 text-xs font-bold text-primary transition hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:bg-primary/20"
                  onClick={() => {
                    onJobPostingUrlChange(sampleJobPostingUrl);
                    onJobDescriptionChange(sampleJobDescription);
                  }}
                >
                  Use sample posting
                </button>
              </div>

              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-primary" aria-hidden="true" />
                <Input
                  id="job-posting-url"
                  type="url"
                  inputMode="url"
                  value={jobPostingUrl}
                  onChange={(event) => onJobPostingUrlChange(event.target.value)}
                  placeholder="https://careers.uw.edu/jobs/your-role"
                  className="h-12 rounded-xl border-border bg-background pl-11 pr-4 text-sm font-semibold text-foreground focus-visible:border-ring focus-visible:ring-ring/30"
                />
              </div>
              {jobPostingUrl.trim().length > 0 && !isValidJobPostingUrl(jobPostingUrl) ? (
                <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Enter a full link (for example https://linkedin.com/jobs/view/...) or paste the description below instead.
                </p>
              ) : null}

              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
                <span className="text-xs font-black uppercase tracking-[0.08em] text-muted-foreground">or paste description</span>
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>

              <Label htmlFor="job-description" className="sr-only">
                Job description
              </Label>
              <Textarea
                id="job-description"
                value={jobDescription}
                onChange={(event) => onJobDescriptionChange(event.target.value)}
                placeholder="Paste requirements, responsibilities, and preferred qualifications if you do not have a link..."
                className="min-h-36 rounded-3xl border-border bg-background px-4 py-3 text-sm leading-6 text-foreground shadow-inner placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <Progress value={postingProgress} className="h-1.5 flex-1 bg-muted [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-husky-purple [&_[data-slot=progress-indicator]]:to-husky-gold" />
                <p className="text-right text-xs font-semibold text-muted-foreground">
                  {hasPosting ? 'Posting ready' : `${jobDescription.length} characters`}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <Label htmlFor="deadline" className="mb-2 block text-sm font-black text-foreground">
                  Application deadline
                </Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-primary" aria-hidden="true" />
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(event) => onDeadlineChange(event.target.value)}
                    className="h-12 rounded-xl border-border bg-background pl-11 pr-4 text-sm font-semibold text-foreground focus-visible:border-ring focus-visible:ring-ring/30"
                  />
                </div>
              </div>
              <Button
                className="h-12 min-w-44 shadow-premium disabled:opacity-100 disabled:border disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                disabled={!canAnalyze}
                onClick={onAnalyze}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {isSubmitting ? 'Saving' : 'Analyzing'}
                  </>
                ) : (
                  <>
                    <WandSparkles className="size-4" aria-hidden="true" />
                    Analyze
                  </>
                )}
              </Button>
            </div>

            {submitError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-200">
                {submitError}
              </p>
            ) : null}

            <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 p-3 text-xs font-semibold leading-5 text-muted-foreground">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              Resume/session data is designed to be deleted after one hour.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
