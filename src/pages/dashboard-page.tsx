import { useEffect, useRef } from 'react';
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
import { useReview } from '../context/review-context';

const activityItems = [
  { label: 'Resume workspace', value: 'Ready', detail: 'Sample upload path available', icon: FileText },
  { label: 'Privacy status', value: 'Session', detail: 'One-hour expiry language visible', icon: LockKeyhole },
  { label: 'Next deadline', value: 'May 31', detail: 'Mock application planning date', icon: CalendarDays },
];

export function DashboardPage() {
  const workflowRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    status,
    loadingStepIndex,
    fileName,
    jobDescription,
    deadline,
    selectedIds,
    setFileName,
    setJobDescription,
    setDeadline,
    runMockAnalysis,
    showSampleReview,
  } = useReview();

  const readiness = Math.min(100, (fileName ? 38 : 0) + Math.min(jobDescription.length / 220, 1) * 42 + (status === 'success' ? 20 : 0));

  useEffect(() => {
    if (location.hash === '#workflow') {
      window.setTimeout(() => workflowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }, [location.hash]);

  function scrollToWorkflow() {
    workflowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function viewSampleRoadmap() {
    showSampleReview();
    navigate('/app/roadmap');
  }

  return (
    <main>
      <section className="section-enter mx-auto max-w-[86rem] px-5 py-7 sm:px-8 lg:px-12">
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
                    {status === 'success' ? 'Sample review loaded' : 'Preview workspace'}
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
                {activityItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.label}
                      className="rounded-2xl border border-border bg-card/80 p-4 shadow-soft transition-[box-shadow,transform] duration-motion-normal ease-brand hover:-translate-y-0.5 hover:shadow-card active:scale-[0.99] motion-safe:hover:-translate-y-0.5"
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
                <Button variant="secondary" className="h-12" onClick={viewSampleRoadmap}>
                  Load sample roadmap
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </Surface>

          <div className="section-enter grid gap-5 lg:grid-cols-[0.8fr_1.2fr] xl:grid-cols-1" style={{ animationDelay: '90ms' }}>
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
                Readiness reacts to the mocked resume, job posting, and analysis state. It is local UI state only.
              </p>
            </Surface>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Surface variant="card" className="rounded-[1.6rem] p-5">
                <ClipboardCheck className="size-7 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Input console</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Resume and posting controls sit below as the primary work area.</p>
              </Surface>
              <Surface variant="card" className="rounded-[1.6rem] p-5">
                <Map className="size-7 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">{selectedIds.length || 4} roadmap items</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Selected recommendations feed into the planning timeline.</p>
              </Surface>
              <Surface variant="card" className="rounded-[1.6rem] p-5 md:col-span-2 xl:col-span-1">
                <BellRing className="size-7 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Google sign-in pending</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Auth is represented in the UI only; no provider is configured.</p>
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
          deadline={deadline}
          onFileNameChange={setFileName}
          onJobDescriptionChange={setJobDescription}
          onDeadlineChange={setDeadline}
          onAnalyze={runMockAnalysis}
        />
      </div>

      <AnalysisPreview status={status} loadingStepIndex={loadingStepIndex} />

      <section className="section-enter mx-auto max-w-[86rem] px-5 pb-14 sm:px-8 lg:px-12">
        <Surface variant="premium" className="grid gap-5 rounded-[2rem] p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="type-eyebrow">Workspace pages</p>
            <h2 className="type-section-title type-section-title--brand mt-2">Continue through the tool navigation.</h2>
            <p className="type-body mt-3 max-w-2xl sm:text-[0.9375rem] sm:leading-relaxed">
              The app shell separates roadmap planning, resources, saved reviews, privacy, and profile settings while keeping the same mocked review state.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[34rem]">
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
            <Button className="h-12" onClick={viewSampleRoadmap}>
              <Sparkles className="size-4" aria-hidden="true" />
              Load sample
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Surface>
      </section>
    </main>
  );
}
