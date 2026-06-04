import { useAuth0 } from '@auth0/auth0-react';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getApiAccessToken } from '../auth/api-access-token';
import { fetchReview, updateReviewSelections } from '../auth/supabase-client';
import { defaultDeadline, loadingSteps } from '../data/reviewFlow';
import type { ReviewAnalysis, ReviewStatus } from '../types/analysis';

interface ReviewContextValue {
  status: ReviewStatus;
  loadingStepIndex: number;
  resumeFile: File | null;
  resumeId: string;
  fileName: string;
  jobDescription: string;
  jobPostingUrl: string;
  deadline: string;
  selectedIds: string[];
  analysis: ReviewAnalysis | null;
  error: string | null;
  setResumeFile: (file: File | null) => void;
  setResumeId: (resumeId: string) => void;
  selectSavedResume: (resumeId: string, fileName: string) => void;
  setJobDescription: (description: string) => void;
  setJobPostingUrl: (url: string) => void;
  setDeadline: (deadline: string) => void;
  startAnalysis: () => void;
  completeAnalysis: (analysis: ReviewAnalysis) => void;
  failAnalysis: (message: string) => void;
  loadReviewById: (reviewId: string) => Promise<boolean>;
  toggleRecommendation: (id: string) => void;
  resetReview: () => void;
}

const ReviewContext = createContext<ReviewContextValue | null>(null);

interface ReviewProviderProps {
  children: ReactNode;
}

export function ReviewProvider({ children }: ReviewProviderProps) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [status, setStatus] = useState<ReviewStatus>('idle');
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [resumeFile, setResumeFileValue] = useState<File | null>(null);
  const [resumeId, setResumeIdValue] = useState('');
  const [fileName, setFileNameValue] = useState('');
  const [jobDescription, setJobDescriptionValue] = useState('');
  const [jobPostingUrl, setJobPostingUrlValue] = useState('');
  const [deadline, setDeadlineValue] = useState(defaultDeadline);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'loading') {
      return;
    }

    setLoadingStepIndex(0);
    const interval = window.setInterval(() => {
      setLoadingStepIndex((currentStep) => Math.min(currentStep + 1, loadingSteps.length - 1));
    }, 720);

    return () => window.clearInterval(interval);
  }, [status]);

  function clearResultState() {
    setStatus((currentStatus) => (currentStatus === 'idle' ? currentStatus : 'idle'));
    setLoadingStepIndex(0);
    setSelectedIds([]);
    setAnalysis(null);
    setError(null);
  }

  function setResumeFile(file: File | null) {
    setResumeFileValue(file);
    setResumeIdValue('');
    setFileNameValue(file?.name || '');
    clearResultState();
  }

  function setResumeId(nextResumeId: string) {
    setResumeIdValue(nextResumeId);
  }

  function selectSavedResume(nextResumeId: string, nextFileName: string) {
    setResumeFileValue(null);
    setResumeIdValue(nextResumeId);
    setFileNameValue(nextFileName);
    clearResultState();
  }

  function setJobDescription(description: string) {
    setJobDescriptionValue(description);
    clearResultState();
  }

  function setJobPostingUrl(url: string) {
    setJobPostingUrlValue(url);
    clearResultState();
  }

  function setDeadline(deadlineValue: string) {
    setDeadlineValue(deadlineValue);
    clearResultState();
  }

  function startAnalysis() {
    setStatus('loading');
    setError(null);
  }

  function completeAnalysis(nextAnalysis: ReviewAnalysis) {
    setStatus('success');
    setLoadingStepIndex(loadingSteps.length - 1);
    setAnalysis(nextAnalysis);
    setResumeIdValue(nextAnalysis.resumeId);
    setFileNameValue(nextAnalysis.fileName);
    setJobDescriptionValue(nextAnalysis.jobDescription);
    setJobPostingUrlValue(nextAnalysis.jobPostingUrl);
    setDeadlineValue(nextAnalysis.deadline || defaultDeadline);
    setSelectedIds(nextAnalysis.selectedIds || []);
    setError(null);
  }

  function failAnalysis(message: string) {
    setStatus('error');
    setError(message);
  }

  async function loadReviewById(reviewId: string): Promise<boolean> {
    if (!isAuthenticated) {
      failAnalysis('Sign in to open saved reviews.');
      return false;
    }

    try {
      const token = await getApiAccessToken(getAccessTokenSilently);
      startAnalysis();
      completeAnalysis(await fetchReview(token, reviewId));
      return true;
    } catch (loadError) {
      failAnalysis((loadError as Error).message);
      return false;
    }
  }

  function toggleRecommendation(id: string) {
    const nextSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter((currentId) => currentId !== id)
      : [...selectedIds, id];

    setSelectedIds(nextSelectedIds);
    setAnalysis((current) => (current ? { ...current, selectedIds: nextSelectedIds } : current));

    if (!analysis || !isAuthenticated) {
      return;
    }

    void getApiAccessToken(getAccessTokenSilently)
      .then((token) => updateReviewSelections(token, analysis.id, nextSelectedIds))
      .then((updatedAnalysis) => {
        setAnalysis(updatedAnalysis);
        setSelectedIds(updatedAnalysis.selectedIds || []);
      })
      .catch((selectionError) => {
        setError((selectionError as Error).message);
      });
  }

  function resetReview() {
    setStatus('idle');
    setLoadingStepIndex(0);
    setResumeFileValue(null);
    setResumeIdValue('');
    setFileNameValue('');
    setJobDescriptionValue('');
    setJobPostingUrlValue('');
    setDeadlineValue(defaultDeadline);
    setSelectedIds([]);
    setAnalysis(null);
    setError(null);
  }

  const value = useMemo(
    () => ({
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
      loadReviewById,
      toggleRecommendation,
      resetReview,
    }),
    [analysis, deadline, error, fileName, jobDescription, jobPostingUrl, loadingStepIndex, resumeFile, resumeId, selectedIds, status],
  );

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

export function useReview() {
  const context = useContext(ReviewContext);

  if (!context) {
    throw new Error('useReview must be used within ReviewProvider');
  }

  return context;
}
