import type { DragEvent } from 'react';
import { CalendarDays, CheckCircle2, FileCheck2, FileUp, LockKeyhole, Loader2, WandSparkles } from 'lucide-react';
import { Section } from './layout/section';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { sampleJobDescription } from '../data/mockData';
import type { ReviewStatus } from '../types/analysis';
import { cn } from '../lib/utils';

interface UploadPanelProps {
  status: ReviewStatus;
  fileName: string;
  jobDescription: string;
  deadline: string;
  onFileNameChange: (fileName: string) => void;
  onJobDescriptionChange: (description: string) => void;
  onDeadlineChange: (deadline: string) => void;
  onAnalyze: () => void;
}

const readinessSteps = ['Resume parsing', 'Job requirement comparison', 'Verified UWB retrieval', 'Roadmap generation'];

export function UploadPanel({
  status,
  fileName,
  jobDescription,
  deadline,
  onFileNameChange,
  onJobDescriptionChange,
  onDeadlineChange,
  onAnalyze,
}: UploadPanelProps) {
  const isLoading = status === 'loading';
  const canAnalyze = fileName.length > 0 && jobDescription.trim().length >= 80 && !isLoading;
  const readiness = Math.min(100, Math.round((fileName ? 45 : 0) + Math.min(jobDescription.length / 220, 1) * 45 + (deadline ? 10 : 0)));

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files.item(0);
    if (droppedFile) {
      onFileNameChange(droppedFile.name);
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
              {canAnalyze ? 'Ready to analyze' : 'Needs resume and role'}
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
                      onFileNameChange(selectedFile.name);
                    }
                  }}
                />
                <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/12 to-husky-gold/20 text-primary shadow-soft transition group-hover:scale-105">
                  {fileName ? <FileCheck2 className="size-7" aria-hidden="true" /> : <FileUp className="size-7" aria-hidden="true" />}
                </span>
                <span className="mt-4 text-base font-black text-foreground">{fileName || 'Drop your resume here'}</span>
                <span className="mt-1 text-sm font-medium text-muted-foreground">PDF, DOC, or DOCX. Mock upload only.</span>
              </Label>
              <Button variant="secondary" className="mt-3 h-11 w-full" onClick={() => onFileNameChange('sample-uwb-resume.pdf')}>
                Use sample resume
              </Button>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <Label htmlFor="job-description" className="text-sm font-black text-foreground">
                  Job description
                </Label>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs font-bold text-primary transition hover:bg-primary/10 dark:hover:bg-primary/20"
                  onClick={() => onJobDescriptionChange(sampleJobDescription)}
                >
                  Use sample
                </button>
              </div>
              <Textarea
                id="job-description"
                value={jobDescription}
                onChange={(event) => onJobDescriptionChange(event.target.value)}
                placeholder="Paste the posting requirements, responsibilities, and preferred qualifications..."
                className="min-h-44 rounded-3xl border-border bg-background px-4 py-3 text-sm leading-6 text-foreground shadow-inner placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <Progress value={Math.min(100, (jobDescription.length / 220) * 100)} className="h-1.5 flex-1 bg-muted [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-husky-purple [&_[data-slot=progress-indicator]]:to-husky-gold" />
                <p className="text-right text-xs font-semibold text-muted-foreground">{jobDescription.length} characters</p>
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
              <Button className="h-12 min-w-44 shadow-premium" disabled={!canAnalyze} onClick={onAnalyze} aria-busy={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <WandSparkles className="size-4" aria-hidden="true" />
                    Analyze
                  </>
                )}
              </Button>
            </div>

            <p className="flex items-start gap-2 rounded-xl bg-primary/8 p-3 text-xs font-semibold leading-5 text-muted-foreground dark:bg-primary/15">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              Resume/session data is designed to be deleted after one hour.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
