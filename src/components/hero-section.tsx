import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  FileText,
  Link2,
  LockKeyhole,
  Map,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Timer,
  UploadCloud,
} from 'lucide-react';
import { GradientBackground } from './gradient-background';
import { Section } from './layout/section';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const flowCards = [
  { label: 'Resume', detail: 'Uploaded', icon: FileText, accent: 'purple', start: 0, end: 20 },
  { label: 'Job Posting', detail: 'Captured', icon: BriefcaseBusiness, accent: 'gold', start: 20, end: 42 },
  { label: 'Gap analysis', detail: 'Complete', icon: Search, accent: 'purple', start: 42, end: 64 },
  { label: 'Action board', detail: 'Synced', icon: Map, accent: 'gold', start: 64, end: 76 },
];

const readinessItems = [
  { label: 'Impact', score: 78 },
  { label: 'Relevance', score: 72 },
  { label: 'Clarity', score: 77 },
];

const animationSteps = [
  { label: 'Uploading resume', detail: 'Resume received' },
  { label: 'Parsing skills', detail: 'Skills extracted' },
  { label: 'Comparing role', detail: 'Gaps detected' },
  { label: 'Building roadmap', detail: 'Next steps ready' },
];

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const UPLOAD_READINESS_CAP = 18;
/** Readiness where the upload cloud begins drifting up and fading out */
const UPLOAD_ICON_EXIT_START = 8;
/**
 * Float boundary between exit and enter: cloud finishes below this value;
 * file begins at/above it — no overlap at any instant.
 */
const UPLOAD_ICON_HANDOFF = 13.5;
/** Pixels the cloud moves up while fading; file starts this far below center */
const UPLOAD_ICON_TRAVEL_PX = 22;
/** Check fades in only after the file icon is fully visible */
const UPLOAD_CHECK_FADE_START = 16;

/** Ease-out with a long, soft deceleration — reads smooth on UI copy */
const FADE_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const FADE_MS = 520;

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

/** Sequential: cloud exits up + fade, then file rises in + fade — never both visible. Uses float readiness for smooth rAF updates. */
function uploadZoneSequentialMotion(rawReadiness: number) {
  if (rawReadiness < UPLOAD_ICON_EXIT_START) {
    return { uploadY: 0, uploadOp: 1, fileY: UPLOAD_ICON_TRAVEL_PX, fileOp: 0 };
  }
  if (rawReadiness < UPLOAD_ICON_HANDOFF) {
    const span = UPLOAD_ICON_HANDOFF - UPLOAD_ICON_EXIT_START;
    const t = clamp01(span > 0 ? (rawReadiness - UPLOAD_ICON_EXIT_START) / span : 1);
    return {
      uploadY: -UPLOAD_ICON_TRAVEL_PX * t,
      uploadOp: 1 - t,
      fileY: UPLOAD_ICON_TRAVEL_PX,
      fileOp: 0,
    };
  }
  if (rawReadiness < UPLOAD_READINESS_CAP) {
    const span = UPLOAD_READINESS_CAP - UPLOAD_ICON_HANDOFF;
    const t = clamp01(span > 0 ? (rawReadiness - UPLOAD_ICON_HANDOFF) / span : 1);
    return {
      uploadY: -UPLOAD_ICON_TRAVEL_PX,
      uploadOp: 0,
      fileY: UPLOAD_ICON_TRAVEL_PX * (1 - t),
      fileOp: t,
    };
  }
  return { uploadY: -UPLOAD_ICON_TRAVEL_PX, uploadOp: 0, fileY: 0, fileOp: 1 };
}

function uploadRowCheckOpacity(rawReadiness: number, cap: number, fadeStart: number) {
  if (rawReadiness <= fadeStart) {
    return 0;
  }
  if (rawReadiness >= cap) {
    return 1;
  }
  return clamp01((rawReadiness - fadeStart) / (cap - fadeStart));
}

function FadingText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  const [visible, setVisible] = useState(true);
  const lastCommittedRef = useRef(text);
  const spanRef = useRef<HTMLSpanElement>(null);
  const pendingTargetRef = useRef<string | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    if (reduceMotion) {
      lastCommittedRef.current = text;
      pendingTargetRef.current = null;
      setDisplay(text);
      setVisible(true);
      return;
    }

    if (text === lastCommittedRef.current) {
      return;
    }

    const targetText = text;
    pendingTargetRef.current = targetText;
    setVisible(false);

    const el = spanRef.current;
    let cleaned = false;
    let didCommit = false;
    let fallbackTimer: number | undefined;

    const commitSwapAndEnter = () => {
      if (cleaned || didCommit || pendingTargetRef.current !== targetText) {
        return;
      }
      didCommit = true;
      lastCommittedRef.current = targetText;
      setDisplay(targetText);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cleaned || pendingTargetRef.current !== targetText || lastCommittedRef.current !== targetText) {
            return;
          }
          setVisible(true);
        });
      });
    };

    const onTransitionEnd = (e: TransitionEvent) => {
      if (cleaned || pendingTargetRef.current !== targetText) {
        return;
      }
      if (e.target !== el || e.propertyName !== 'opacity') {
        return;
      }
      el?.removeEventListener('transitionend', onTransitionEnd);
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = undefined;
      }
      commitSwapAndEnter();
    };

    if (el) {
      el.addEventListener('transitionend', onTransitionEnd);
    }

    fallbackTimer = window.setTimeout(() => {
      el?.removeEventListener('transitionend', onTransitionEnd);
      commitSwapAndEnter();
    }, FADE_MS + 200);

    return () => {
      cleaned = true;
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
      }
      el?.removeEventListener('transitionend', onTransitionEnd);
    };
  }, [text]);

  return (
    <span
      ref={spanRef}
      style={{ transitionTimingFunction: FADE_EASE, transitionDuration: `${FADE_MS}ms` }}
      className={cn(
        'inline-block transition-opacity motion-reduce:transition-none',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
        className,
      )}
    >
      {display}
    </span>
  );
}

export function HeroSection() {
  const [readiness, setReadiness] = useState(0);
  /** Same timeline as `readiness` but not rounded — drives smooth subpixel motion every rAF. */
  const [readinessSmooth, setReadinessSmooth] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (reduceMotion) {
      setReadiness(76);
      setReadinessSmooth(76);
      return;
    }

    let frame = 0;
    let animationFrame = 0;
    const duration = 15600;
    const phases = [
      { from: 0, to: 18, start: 0, end: 0.24 },
      { from: 18, to: 38, start: 0.24, end: 0.48 },
      { from: 38, to: 64, start: 0.48, end: 0.74 },
      { from: 64, to: 76, start: 0.74, end: 0.92 },
    ];

    function tick(timestamp: number) {
      if (!frame) {
        frame = timestamp;
      }

      const elapsed = (timestamp - frame) % duration;
      const cycleProgress = elapsed / duration;
      const phase = phases.find((item) => cycleProgress >= item.start && cycleProgress < item.end);

      if (!phase) {
        setReadiness(76);
        setReadinessSmooth(76);
      } else {
        const localProgress = (cycleProgress - phase.start) / (phase.end - phase.start);
        const eased = 1 - Math.pow(1 - localProgress, 2.8);
        const raw = phase.from + (phase.to - phase.from) * eased;
        setReadinessSmooth(raw);
        setReadiness(Math.round(raw));
      }

      animationFrame = window.requestAnimationFrame(tick);
    }

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  const activeStep = useMemo(() => {
    if (readiness < 20) return animationSteps[0];
    if (readiness < 42) return animationSteps[1];
    if (readiness < 65) return animationSteps[2];
    return animationSteps[3];
  }, [readiness]);

  const readinessCaption = useMemo(
    () => (readiness > 70 ? 'Strong Progress' : activeStep.detail),
    [readiness, activeStep],
  );

  const uploadBarPercent = useMemo(
    () =>
      readinessSmooth < UPLOAD_READINESS_CAP
        ? Math.min(100, (readinessSmooth / UPLOAD_READINESS_CAP) * 100)
        : 100,
    [readinessSmooth],
  );

  const uploadStatusLabel = useMemo(
    () => (readiness < UPLOAD_READINESS_CAP ? 'Uploading your resume' : 'Resume uploaded'),
    [readiness],
  );

  const jobCaptureLabel = useMemo(() => (readiness >= 30 ? 'Captured' : 'Waiting'), [readiness]);

  const uploadIconMotion = useMemo(() => uploadZoneSequentialMotion(readinessSmooth), [readinessSmooth]);

  const resumeRowCheckOpacity = useMemo(
    () => uploadRowCheckOpacity(readinessSmooth, UPLOAD_READINESS_CAP, UPLOAD_CHECK_FADE_START),
    [readinessSmooth],
  );

  const conicStyle = useMemo(
    () => ({
      background: `conic-gradient(from 220deg, #4B2E83 0%, #6F4BC0 ${Math.max(readinessSmooth * 0.42, 0)}%, #A657D8 ${Math.max(readinessSmooth * 0.62, 0)}%, #C78308 ${readinessSmooth}%, #E8EAF0 ${readinessSmooth}% 100%)`,
    }),
    [readinessSmooth],
  );

  return (
    <Section id="top" className="relative overflow-hidden" reveal={false}>
      <GradientBackground />
      <div className="mx-auto grid max-w-[88rem] items-start gap-8 px-5 py-9 sm:px-8 lg:min-h-[calc(100vh-5.2rem)] lg:grid-cols-[0.86fr_1.14fr] lg:px-12 lg:py-8 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="relative z-10 min-w-0">
          <h1 className="max-w-full font-sans text-[3rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground sm:max-w-3xl sm:text-[4.55rem] lg:text-[4.35rem] xl:text-[4.8rem]">
            <span className="block">From resume gaps</span>
            <span className="block text-muted-foreground">to a working</span>
            <span className="hero-action-mark mt-1 font-black">action board</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg font-semibold leading-8 text-muted-foreground sm:text-xl">
            Upload your resume and a real posting in the app, read AI-assisted gap analysis with UW-linked recommendations, save reviews, and shape everything into a week-by-week board you can execute—not just read.
          </p>

          <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
            {[
              { label: 'Verified UW Opportunities', icon: ShieldCheck, tone: 'green' },
              { label: 'Privacy by Design', icon: LockKeyhole, tone: 'green' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span
                    className={[
                      'grid size-11 shrink-0 place-items-center rounded-full',
                      item.tone === 'gold' ? 'bg-[#f5e6bf] text-[#a07100]' : 'bg-emerald-50 text-emerald-700',
                    ].join(' ')}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold leading-5 text-foreground">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 min-w-0">
          <div className="command-panel rounded-[2rem] p-4 sm:p-5 lg:p-6">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black tracking-normal text-foreground sm:text-3xl">Your workspace in the app</h2>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">
                  Follow each stage from upload and job capture through gap analysis, saved reviews, and your live action board.
                </p>
              </div>
              <Badge tone="gray" className="w-fit rounded-xl border-primary/15 bg-primary/8 px-4 py-2 text-primary dark:border-white/15 dark:bg-white/10 dark:text-foreground">
                <Timer className="size-4" aria-hidden="true" />
                <FadingText text={activeStep.label} className="font-black" />
              </Badge>
            </div>

            <div className="grid items-start gap-4 lg:grid-cols-[0.78fr_1.42fr]">
              <article className="dashboard-card rounded-2xl border border-border/60 bg-card p-5 lg:p-4 xl:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-black text-foreground">Resume Readiness</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="What resume readiness means"
                        className="grid size-6 place-items-center rounded-full bg-muted text-xs font-black text-muted-foreground transition hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        i
                      </button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={8} className="max-w-[15rem] text-left leading-5">
                      Resume readiness estimates how well your resume signals impact, relevance, and clarity for the pasted role.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="mx-auto grid size-28 place-items-center rounded-full p-3 transition-[background] duration-500 xl:size-32" style={conicStyle}>
                  <div className="grid size-full place-items-center rounded-full bg-card">
                    <div className="text-center">
                      <p className="tabular-nums text-4xl font-black text-primary">{Math.round(readinessSmooth)}%</p>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-center text-sm font-black text-primary">
                  <FadingText text={readinessCaption} className="font-black" />
                </p>
                <div className="mx-auto mt-2 h-1 w-36 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-husky-purple to-[#c78308]"
                    style={{ width: `${readinessSmooth}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {readinessItems.map((item) => {
                    const metricScore = Math.round((item.score / 76) * readinessSmooth);
                    const isMetricReady = metricScore >= item.score - 2;
                    return (
                      <div key={item.label} className="grid grid-cols-[1rem_1fr_auto] items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
                        {isMetricReady ? (
                          <Check className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        ) : (
                          <Timer className="size-4 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                        )}
                        <span className="text-sm font-semibold text-muted-foreground">{item.label}</span>
                        <span className={['tabular-nums text-sm font-black', isMetricReady ? 'text-emerald-700 dark:text-emerald-300' : 'text-primary'].join(' ')}>
                          {metricScore}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Button variant="secondary" className="mt-3 h-9 w-full cursor-default hover:translate-y-0 hover:shadow-soft" type="button" aria-disabled="true">
                  Open full breakdown
                </Button>
              </article>

              <article className="dashboard-card rounded-2xl border border-border/60 bg-card p-5">
                <h3 className="text-lg font-black text-foreground">Start a New Review</h3>
                <div
                  className="upload-dropzone mt-5 rounded-2xl border border-dashed border-primary/30 bg-card/90 px-6 py-7 text-center dark:bg-muted/20"
                  aria-live="polite"
                >
                  <span className="relative mx-auto grid size-14 overflow-hidden rounded-2xl text-primary">
                    <span
                      className="absolute inset-0 grid place-items-center will-change-transform"
                      style={{
                        transform: `translateY(${uploadIconMotion.uploadY}px)`,
                        opacity: uploadIconMotion.uploadOp,
                      }}
                    >
                      <UploadCloud className="size-8" aria-hidden="true" />
                    </span>
                    <span
                      className="absolute inset-0 grid place-items-center will-change-transform"
                      style={{
                        transform: `translateY(${uploadIconMotion.fileY}px)`,
                        opacity: uploadIconMotion.fileOp,
                      }}
                    >
                      <FileText className="size-8" aria-hidden="true" />
                    </span>
                  </span>
                  <div className="mx-auto mt-4 max-w-[14rem] rounded-xl border border-border bg-card px-3 py-2 text-left shadow-soft">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-primary" aria-hidden="true" />
                      <span className="truncate text-xs font-black text-foreground">resume.pdf</span>
                      <span className="ml-auto grid size-4 shrink-0 place-items-center">
                        <Check
                          className="size-4 text-emerald-600 dark:text-emerald-400"
                          style={{ opacity: resumeRowCheckOpacity }}
                          aria-hidden={resumeRowCheckOpacity < 0.08}
                        />
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-husky-purple to-[#c78308]"
                        style={{ width: `${uploadBarPercent}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-4 text-base font-black text-foreground">
                    <FadingText text={uploadStatusLabel} className="font-black" />
                  </p>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    <FadingText text={activeStep.detail} />
                  </p>
                </div>
                <div className="my-4 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  and
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
                  <div className="flex min-w-0 items-center gap-3 px-4 py-3">
                    <Link2 className="size-5 shrink-0 text-husky-purple dark:text-amber-200" aria-hidden="true" />
                    <span className="truncate text-sm font-semibold text-muted-foreground">Paste a job posting URL or description</span>
                    <span className="ml-auto hidden rounded-full border border-husky-purple/25 bg-white/95 px-2 py-1 text-[0.7rem] font-black text-husky-purple shadow-sm dark:border-amber-400/45 dark:bg-amber-950/55 dark:text-amber-100 dark:shadow-none sm:inline-flex">
                      <FadingText text={jobCaptureLabel} className="font-black" />
                    </span>
                  </div>
                </div>
                <p className="mt-4 flex items-start gap-2 text-xs font-semibold leading-5 text-muted-foreground">
                  <Shield className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Uploads stay in your workspace and are handled with student-first privacy controls you manage in the app.
                </p>
              </article>
            </div>

            <div className="relative mt-5 grid gap-4 rounded-[1.6rem] border border-primary/20 bg-primary/10 p-4 shadow-soft dark:border-white/10 dark:bg-white/5 sm:grid-cols-2 xl:grid-cols-4">
              {flowCards.map((card, index) => {
                const Icon = card.icon;
                const isComplete = readinessSmooth >= card.end;
                const isActive = readinessSmooth >= card.start && readinessSmooth < card.end;
                const localProgress = isComplete
                  ? 100
                  : isActive
                    ? Math.max(18, Math.min(92, ((readinessSmooth - card.start) / (card.end - card.start)) * 100))
                    : 10;
                return (
                  <div key={card.label} className="relative">
                  <article
                    className={cn(
                      'dashboard-card rounded-2xl border border-border/60 bg-card p-3',
                      'transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                      'hover:shadow-md',
                      isActive &&
                        !isComplete &&
                        'z-10 ring-2 ring-amber-400/40 ring-offset-2 ring-offset-background shadow-md dark:ring-amber-400/30',
                      isComplete &&
                        'border-emerald-400/55 shadow-[0_10px_38px_-12px_rgba(5,150,105,0.2)] dark:border-emerald-500/45 dark:shadow-[0_10px_36px_-12px_rgba(52,211,153,0.16)]',
                    )}
                  >
                    <span
                      className={cn(
                        'mx-auto grid size-11 place-items-center rounded-2xl',
                        'transition-[transform,background-color,color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                        isComplete
                          ? 'scale-[1.05] bg-emerald-100 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] motion-reduce:scale-100 dark:bg-emerald-950/75 dark:text-emerald-300 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                          : card.accent === 'gold'
                            ? 'bg-husky-gold/20 text-amber-800 dark:text-amber-200'
                            : 'bg-primary/12 text-primary dark:bg-white/10 dark:text-foreground',
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-2 text-center text-base font-black text-foreground">{card.label}</h3>
                    <div className="mx-auto mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full bg-gradient-to-r',
                          isComplete
                            ? 'from-emerald-600 via-emerald-500 to-teal-500'
                            : 'from-husky-purple via-[#7a5ab8] to-[#c78308]',
                        )}
                        style={{ width: `${localProgress}%` }}
                      />
                    </div>
                    <Badge tone={isComplete ? 'green' : isActive ? 'gold' : 'gray'} className="mx-auto mt-3 flex w-fit rounded-full">
                      {isComplete ? <Check className="size-3.5" aria-hidden="true" /> : <Timer className="size-3.5" aria-hidden="true" />}
                      <FadingText text={isComplete ? card.detail : isActive ? 'Processing' : 'Queued'} className="font-black" />
                    </Badge>
                  </article>
                  {index < flowCards.length - 1 && (
                    <span className="pointer-events-none absolute -right-5 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-card text-primary shadow-soft ring-1 ring-border xl:grid xl:size-8 xl:place-items-center" aria-hidden="true">
                      <ArrowRight className="size-5" />
                    </span>
                  )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 rounded-2xl border border-border bg-card/70 p-3 shadow-soft dark:bg-card/40 lg:grid-cols-3">
              {[
                ['Built for UW students', 'Recommendations point to campus sources and programs you can act on.'],
                ['Stays current', 'Statuses and dates help you spot what is still active.'],
                ['Actionable next steps', 'Move items from insight to your dated weekly board.'],
              ].map(([title, detail], index) => (
                <div key={title} className="flex items-center gap-3 border-border/80 lg:border-r lg:last:border-r-0">
                  <span className={[
                    'grid size-11 shrink-0 place-items-center rounded-full',
                    index === 1 ? 'bg-husky-gold/20 text-amber-800 dark:text-amber-200' : 'bg-primary/12 text-primary dark:bg-white/10 dark:text-foreground',
                  ].join(' ')}>
                    {index === 1 ? <CalendarDays className="size-5" aria-hidden="true" /> : <Sparkles className="size-5" aria-hidden="true" />}
                  </span>
                  <span>
                    <span className="block text-sm font-black text-foreground">{title}</span>
                    <span className="mt-1 block text-xs font-medium leading-5 text-muted-foreground">{detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
