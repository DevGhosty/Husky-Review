import type { LoadingStep } from '../types/analysis';

export const defaultDeadline = '';

export const loadingSteps: LoadingStep[] = [
  {
    label: 'Reading resume',
    description: 'Extracting skills, experience signals, and project language.',
  },
  {
    label: 'Comparing job requirements',
    description: 'Matching the posting against resume bullets and keywords.',
  },
  {
    label: 'Searching verified UWB activities',
    description: 'Retrieving active clubs, courses, events, and research roles.',
  },
  {
    label: 'Building roadmap',
    description: 'Sorting recommendations by urgency and resume impact.',
  },
];
