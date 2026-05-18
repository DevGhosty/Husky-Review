export type ReviewStatus = 'idle' | 'loading' | 'success';

export type ActivityType =
  | 'club'
  | 'course'
  | 'event'
  | 'fellowship'
  | 'project'
  | 'research';

export type RecommendationGroup = 'in-time' | 'next-time';

export interface GapCategory {
  title: string;
  summary: string;
  items: string[];
  score: number;
}

export interface Recommendation {
  id: string;
  group: RecommendationGroup;
  name: string;
  type: ActivityType;
  whyItHelps: string;
  tags: string[];
  active: boolean;
  lastVerified: string;
  confidence: number;
  sourceLabel: string;
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
