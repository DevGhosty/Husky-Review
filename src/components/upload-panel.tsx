import type { DragEvent } from 'react';
import { CalendarDays, CheckCircle2, FileCheck2, FileUp, LockKeyhole, Loader2, WandSparkles } from 'lucide-react';
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
  const readiness = Math.min(100, Math.round((fileName ? 45 : 0) + Math.min(jobDescription.length / 220, 1) * 45 + (deadline ? 10 : 0)));

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files.item(0);
    if (droppedFile) {
      onFileNameChange(droppedFile.name);
    }
  }

  return (
    <section id="workflow" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-7 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-husky-purple-dark p-7 text-white shadow-premium sm:p-8">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-husky-gold/20 blur-3xl motion-safe:animate-breathe" aria-hidden="true" />
          <Badge tone="gold">Review workspace</Badge>
          <h2 className="mt-5 text-3xl font-black tracking-normal sm:text-4xl">Start with the resume and role you care about.</h2>
          <p className="mt-4 text-base leading-7 text-white/75">
            This mocked UI keeps data local in the browser and shows how the future analysis flow will feel once connected to the backend.
          </p>
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.08] p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-white/[0.72]">
              <span>Review readiness</span>
              <span className="text-husky-gold-bright">{readiness}%</span>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-husky-gold to-white shadow-[0_0_20px_rgba(216,197,119,0.32)] transition-all duration-500"
                style={{ width: `${readiness}%` }}
              />
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {['Resume parsing', 'Job requirement comparison', 'Verified UWB retrieval', 'Roadmap generation'].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-3 transition hover:bg-white/[0.12]">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-husky-gold/20 text-sm font-black text-husky-gold-bright">
                  {readiness > index * 24 ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className="text-sm font-semibold text-white/[0.86]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-panel rounded-[2rem] p-5 sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-husky-purple">Input console</p>
              <h3 className="mt-1 text-2xl font-black text-husky-purple-dark">Build a targeted review</h3>
            </div>
            <Badge tone={canAnalyze ? 'green' : 'gray'}>{canAnalyze ? 'Ready to analyze' : 'Needs resume and role'}</Badge>
          </div>
          <div className="grid gap-5">
            <div>
              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className={cn(
                  'group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-husky-purple/20 bg-white/75 px-5 py-8 text-center shadow-inner transition hover:-translate-y-0.5 hover:border-husky-gold hover:bg-white',
                  fileName && 'border-husky-success/40 bg-emerald-50/[0.85]',
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
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-husky-purple/[0.12] to-husky-gold/[0.18] text-husky-purple shadow-soft transition group-hover:scale-105 group-hover:bg-husky-gold/20">
                  {fileName ? <FileCheck2 className="h-7 w-7" aria-hidden="true" /> : <FileUp className="h-7 w-7" aria-hidden="true" />}
                </span>
                <span className="mt-4 text-base font-black text-husky-ink">
                  {fileName || 'Drop your resume here'}
                </span>
                <span className="mt-1 text-sm font-medium text-husky-muted">PDF, DOC, or DOCX. Mock upload only.</span>
              </label>
              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-husky-purple/[0.15] bg-white/90 px-4 py-2.5 text-sm font-bold text-husky-purple shadow-soft transition hover:-translate-y-0.5 hover:border-husky-gold hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-husky-gold"
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
                className="min-h-44 w-full resize-y rounded-3xl border border-husky-line bg-white/90 px-4 py-3 text-sm leading-6 text-husky-ink shadow-inner outline-none transition placeholder:text-slate-400 focus:border-husky-purple focus:ring-4 focus:ring-husky-purple/10"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-husky-purple to-husky-gold transition-all duration-500" style={{ width: `${Math.min(100, (jobDescription.length / 220) * 100)}%` }} />
                </div>
                <p className="text-right text-xs font-semibold text-slate-500">{jobDescription.length} characters</p>
              </div>
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
              <Button className="h-12 min-w-44 shadow-premium" disabled={!canAnalyze} onClick={onAnalyze}>
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
