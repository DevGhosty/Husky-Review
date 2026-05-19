import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  defaultDeadline,
  loadingSteps,
  recommendations,
  sampleFileName,
  sampleJobDescription,
  sampleJobPostingUrl,
  successSelectedIds,
} from '../data/mockData';
import type { ReviewStatus } from '../types/analysis';

interface ReviewContextValue {
  status: ReviewStatus;
  loadingStepIndex: number;
  fileName: string;
  jobDescription: string;
  jobPostingUrl: string;
  deadline: string;
  selectedIds: string[];
  setFileName: (fileName: string) => void;
  setJobDescription: (description: string) => void;
  setJobPostingUrl: (url: string) => void;
  setDeadline: (deadline: string) => void;
  runMockAnalysis: () => void;
  showSampleReview: () => void;
  toggleRecommendation: (id: string) => void;
}

const ReviewContext = createContext<ReviewContextValue | null>(null);

interface ReviewProviderProps {
  children: ReactNode;
}

export function ReviewProvider({ children }: ReviewProviderProps) {
  const [status, setStatus] = useState<ReviewStatus>('idle');
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [fileName, setFileNameValue] = useState('');
  const [jobDescription, setJobDescriptionValue] = useState('');
  const [jobPostingUrl, setJobPostingUrlValue] = useState('');
  const [deadline, setDeadlineValue] = useState(defaultDeadline);
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

  function clearResultState() {
    setStatus((currentStatus) => (currentStatus === 'idle' ? currentStatus : 'idle'));
    setLoadingStepIndex(0);
    setSelectedIds([]);
  }

  function setFileName(fileNameValue: string) {
    setFileNameValue(fileNameValue);
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

  function runMockAnalysis() {
    setStatus('loading');
  }

  function showSampleReview() {
    setStatus('success');
    setLoadingStepIndex(loadingSteps.length - 1);
    setFileNameValue((current) => current || sampleFileName);
    setJobDescriptionValue((current) => current || sampleJobDescription);
    setJobPostingUrlValue((current) => current || sampleJobPostingUrl);
    setDeadlineValue((current) => current || defaultDeadline);
    setSelectedIds(allRecommendationIds.slice(0, 4));
  }

  function toggleRecommendation(id: string) {
    setSelectedIds((currentIds) =>
      currentIds.includes(id) ? currentIds.filter((currentId) => currentId !== id) : [...currentIds, id],
    );
  }

  const value = useMemo(
    () => ({
      status,
      loadingStepIndex,
      fileName,
      jobDescription,
      jobPostingUrl,
      deadline,
      selectedIds,
      setFileName,
      setJobDescription,
      setJobPostingUrl,
      setDeadline,
      runMockAnalysis,
      showSampleReview,
      toggleRecommendation,
    }),
    [deadline, fileName, jobDescription, jobPostingUrl, loadingStepIndex, selectedIds, status],
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
