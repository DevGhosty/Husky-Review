import type { DragEvent } from 'react';
import { CalendarDays, FileCheck2, FileUp, LockKeyhole, Loader2, WandSparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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

const sampleDescription =
  'Frontend software engineering internship seeking React, accessibility, API integration, testing, and production deployment experience. Candidates should show collaboration, user-focused product thinking, and measurable project outcomes.';

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

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files.item(0);
    if (droppedFile) {
      onFileNameChange(droppedFile.name);
    }
  }

  return (
    <section id="workflow" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-3xl bg-husky-purple-dark p-8 text-white shadow-glow">
          <Badge tone="gold">Review workspace</Badge>
          <h2 className="mt-5 text-3xl font-black tracking-normal sm:text-4xl">Start with the resume and role you care about.</h2>
          <p className="mt-4 text-base leading-7 text-white/75">
            This mocked UI keeps data local in the browser and shows how the future analysis flow will feel once connected to the backend.
          </p>
          <div className="mt-8 grid gap-3">
            {['Resume parsing', 'Job requirement comparison', 'Verified UWB retrieval', 'Roadmap generation'].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.08] p-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-husky-gold/20 text-sm font-black text-husky-gold-bright">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-white/[0.86]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 shadow-card sm:p-6">
          <div className="grid gap-5">
            <div>
              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className={cn(
                  'group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-husky-purple/20 bg-white/70 px-5 py-8 text-center transition hover:-translate-y-0.5 hover:border-husky-gold hover:bg-white',
                  fileName && 'border-husky-success/40 bg-emerald-50/80',
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
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-husky-purple/10 text-husky-purple transition group-hover:bg-husky-gold/20">
                  {fileName ? <FileCheck2 className="h-7 w-7" aria-hidden="true" /> : <FileUp className="h-7 w-7" aria-hidden="true" />}
                </span>
                <span className="mt-4 text-base font-black text-husky-ink">
                  {fileName || 'Drop your resume here'}
                </span>
                <span className="mt-1 text-sm font-medium text-husky-muted">PDF, DOC, or DOCX. Mock upload only.</span>
              </label>
              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-husky-purple/[0.15] bg-white px-4 py-2.5 text-sm font-bold text-husky-purple transition hover:-translate-y-0.5 hover:border-husky-gold hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-husky-gold"
                onClick={() => onFileNameChange('sample-uwb-resume.pdf')}
              >
                Use sample resume
              </button>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="job-description" className="text-sm font-black text-husky-ink">
                  Job description
                </label>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-bold text-husky-purple transition hover:bg-husky-purple/[0.08]"
                  onClick={() => onJobDescriptionChange(sampleDescription)}
                >
                  Use sample
                </button>
              </div>
              <textarea
                id="job-description"
                value={jobDescription}
                onChange={(event) => onJobDescriptionChange(event.target.value)}
                placeholder="Paste the posting requirements, responsibilities, and preferred qualifications..."
                className="min-h-40 w-full resize-y rounded-2xl border border-husky-line bg-white px-4 py-3 text-sm leading-6 text-husky-ink shadow-inner outline-none transition placeholder:text-slate-400 focus:border-husky-purple focus:ring-4 focus:ring-husky-purple/10"
              />
              <p className="mt-2 text-right text-xs font-semibold text-slate-500">{jobDescription.length} characters</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label htmlFor="deadline" className="mb-2 block text-sm font-black text-husky-ink">
                  Application deadline
                </label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-husky-purple" aria-hidden="true" />
                  <input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(event) => onDeadlineChange(event.target.value)}
                    className="h-12 w-full rounded-xl border border-husky-line bg-white pl-11 pr-4 text-sm font-semibold text-husky-ink outline-none transition focus:border-husky-purple focus:ring-4 focus:ring-husky-purple/10"
                  />
                </div>
              </div>
              <Button className="h-12 min-w-44" disabled={!canAnalyze} onClick={onAnalyze}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <WandSparkles className="h-4 w-4" aria-hidden="true" />
                    Analyze
                  </>
                )}
              </Button>
            </div>

            <p className="flex items-start gap-2 rounded-xl bg-husky-purple/[0.06] p-3 text-xs font-semibold leading-5 text-husky-muted">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-husky-purple" aria-hidden="true" />
              Resume/session data is designed to be deleted after one hour.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
