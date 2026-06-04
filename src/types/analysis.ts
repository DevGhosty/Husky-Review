export type ReviewStatus = 'idle' | 'loading' | 'success' | 'error';

export type ActivityType =
  | 'club'
  | 'course'
  | 'event'
  | 'fellowship'
  | 'project'
  | 'research';

export type RecommendationGroup = 'in-time' | 'next-time';
export type RecommendationCampus = 'seattle' | 'bothell' | 'tacoma';

export interface GapCategory {
  title: string;
  summary: string;
  items: string[];
  score: number;
}

export interface MatchScore {
  score: number;
  label: string;
  summary: string;
}

export interface Recommendation {
  id: string;
  group: RecommendationGroup;
  name: string;
  type: ActivityType;
  whyItHelps: string;
  tags: string[];
  active: boolean;
  campus: RecommendationCampus;
  lastVerified: string;
  confidence: number;
  sourceLabel: string;
  sourceUrl?: string;
  roadmapWeek: number;
  roadmapAction: string;
}

export interface RoadmapAction {
  id: string;
  text: string;
  detail: string;
}

export interface RoadmapWeek {
  week: number;
  title: string;
  summary: string;
  actions: RoadmapAction[];
}

export interface LoadingStep {
  label: string;
  description: string;
}

export interface ReviewAnalysis {
  id: string;
  title: string;
  role: string;
  resumeId: string;
  fileName: string;
  jobDescription: string;
  jobPostingUrl: string;
  deadline: string;
  matchScore: MatchScore;
  gapCategories: GapCategory[];
  recommendations: Recommendation[];
  roadmapWeeks: RoadmapWeek[];
  selectedIds: string[];
  aiProvider?: 'app-key' | 'user-key' | 'deterministic';
  fallbackReason?: 'no_api_key' | 'gemini_error' | null;
  geminiErrorMessage?: string | null;
  geminiKeySource?: 'user' | 'app' | 'none';
  quota?: ReviewQuotaStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewQuotaStatus {
  source: 'app-key' | 'user-key' | 'deterministic';
  limit: number;
  remaining: number | null;
  resetAt: string | null;
}

export interface SavedReviewSummary {
  id: string;
  title: string;
  role: string;
  deadline: string;
  score: number;
  selectedCount: number;
  resumeFilename: string;
  createdAt: string;
  updatedAt: string;
}
