import { useEffect, useMemo, useRef, useState } from 'react';
import { AnalysisPreview } from './components/analysis-preview';
import { AppShell } from './components/app-shell';
import { HeroSection } from './components/hero-section';
import { RecommendationDashboard } from './components/recommendation-dashboard';
import { RoadmapTimeline } from './components/roadmap-timeline';
import { TrustSection } from './components/trust-section';
import { UploadPanel } from './components/upload-panel';
import { loadingSteps, recommendations } from './data/mockData';
import type { ReviewStatus } from './types/analysis';

const defaultDeadline = '2026-05-31';
const successSelectedIds = ['css-club-review-night', 'career-services-advisor'];

function App() {
  const workflowRef = useRef<HTMLDivElement>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ReviewStatus>('idle');
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [fileName, setFileName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allRecommendationIds = useMemo(() => recommendations.map((recommendation) => recommendation.id), []);

  useEffect(() => {
    if (status !== 'loading') {
      return;
    }

    setLoadingStepIndex(0);
    const interval = window.setInterval(() => {
      setLoadingStepIndex((currentStep) => Math.min(currentStep + 1, loadingSteps.length - 1));
    }, 520);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setStatus('success');
      setSelectedIds(successSelectedIds);
    }, 2300);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [status]);

  function scrollToWorkflow() {
    workflowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showSampleRoadmap() {
    setStatus('success');
    setFileName((current) => current || 'sample-uwb-resume.pdf');
    setJobDescription((current) =>
      current ||
      'Frontend software engineering internship seeking React, accessibility, API integration, testing, and production deployment experience. Candidates should show collaboration, user-focused product thinking, and measurable project outcomes.',
    );
    setSelectedIds(allRecommendationIds.slice(0, 4));
    window.setTimeout(() => roadmapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  function runMockAnalysis() {
    setStatus('loading');
  }

  function toggleRecommendation(id: string) {
    setSelectedIds((currentIds) =>
      currentIds.includes(id) ? currentIds.filter((currentId) => currentId !== id) : [...currentIds, id],
    );
  }

  return (
    <AppShell onStartReview={scrollToWorkflow}>
      <main>
        <HeroSection onStartReview={scrollToWorkflow} onViewRoadmap={showSampleRoadmap} />
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
        <RecommendationDashboard
          status={status}
          deadline={deadline}
          selectedIds={selectedIds}
          onToggleRecommendation={toggleRecommendation}
        />
        <div ref={roadmapRef}>
          <RoadmapTimeline status={status} deadline={deadline} selectedIds={selectedIds} />
        </div>
        <TrustSection />
      </main>
      <footer className="border-t border-husky-line bg-white px-4 py-8 text-center text-sm font-semibold text-husky-muted sm:px-6 lg:px-8">
        Husky-Review is a mocked frontend prototype. No real resume data is stored or analyzed in this version.
      </footer>
    </AppShell>
  );
}

export default App;
