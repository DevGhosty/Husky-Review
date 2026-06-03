import type { GapCategory, LoadingStep, Recommendation, RoadmapWeek } from '../types/analysis';

export const defaultDeadline = '2026-05-31';

export const sampleFileName = 'sample-uw-resume.pdf';

export const sampleJobPostingUrl = 'https://careers.uw.edu/jobs/healthcare-program-coordinator-intern';

export const sampleJobDescription =
  'Healthcare program coordinator intern supporting patient outreach, appointment scheduling, and community wellness events. Seeking candidates with strong communication, organization, teamwork, and experience coordinating programs or volunteer activities. Comfort with spreadsheets and documenting outcomes is a plus.';

export const successSelectedIds = ['css-club-review-night', 'career-services-advisor'];

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
    label: 'Searching verified UW activities',
    description: 'Retrieving active clubs, courses, events, and research roles.',
  },
  {
    label: 'Building roadmap',
    description: 'Sorting recommendations by urgency and resume impact.',
  },
];

export const gapCategories: GapCategory[] = [
  {
    title: 'Missing Skills',
    summary: 'Program coordination, stakeholder communication, and documentation evidence could be stronger for this posting.',
    items: ['Program coordination', 'Stakeholder communication', 'Outcome documentation'],
    score: 68,
  },
  {
    title: 'Keyword Gaps',
    summary: 'The job posting emphasizes organization, teamwork, and community engagement language.',
    items: ['Community engagement', 'Scheduling workflows', 'Cross-team collaboration'],
    score: 74,
  },
  {
    title: 'Experience Signals',
    summary: 'Volunteer and campus involvement is visible, but leadership and verification evidence can be stronger.',
    items: ['Leadership examples', 'Measurable outcomes', 'Advisor or supervisor references'],
    score: 81,
  },
];

export const matchScore = {
  score: 76,
  label: 'Strong foundation',
  summary: 'Solid foundation with room to strengthen verified campus experience before applying.',
};

export const recommendations: Recommendation[] = [
  {
    id: 'css-club-review-night',
    group: 'in-time',
    name: 'UW Career Prep Resume Night',
    type: 'event',
    whyItHelps:
      'Gives you fast feedback on bullets, project framing, and missing keywords before the application deadline.',
    tags: ['Resume bullets', 'Peer review', 'Career prep'],
    active: true,
    lastVerified: 'May 8, 2026',
    confidence: 94,
    sourceLabel: 'UW Career Services events',
    roadmapWeek: 1,
    roadmapAction: 'Bring the target posting and revise three bullets after peer feedback.',
  },
  {
    id: 'career-services-advisor',
    group: 'in-time',
    name: 'UW Career Services Advising',
    type: 'event',
    whyItHelps:
      'Connects your resume gaps to concrete wording changes and application timing advice.',
    tags: ['Advisor feedback', 'Application plan', 'Interview prep'],
    active: true,
    lastVerified: 'May 7, 2026',
    confidence: 91,
    sourceLabel: 'UW Career Services',
    roadmapWeek: 1,
    roadmapAction: 'Book a 30-minute review and ask for feedback on coordination and communication language.',
  },
  {
    id: 'business-leadership-workshop',
    group: 'in-time',
    name: 'School of Business Leadership Workshop',
    type: 'event',
    whyItHelps:
      'Builds communication, teamwork, and professional presence evidence that transfers across majors and roles.',
    tags: ['Leadership', 'Communication', 'Professional skills'],
    active: true,
    lastVerified: 'May 6, 2026',
    confidence: 88,
    sourceLabel: 'UW School of Business events',
    roadmapWeek: 2,
    roadmapAction: 'Attend the workshop and add one teamwork or facilitation bullet to your resume.',
  },
  {
    id: 'bcss-research-assistant',
    group: 'next-time',
    name: 'BCSS Research Assistant Openings',
    type: 'research',
    whyItHelps:
      'Builds deeper evidence for data analysis, technical writing, and longer-term faculty collaboration.',
    tags: ['Research', 'Data analysis', 'Faculty collaboration'],
    active: true,
    lastVerified: 'May 3, 2026',
    confidence: 86,
    sourceLabel: 'BCSS department page',
    roadmapWeek: 3,
    roadmapAction: 'Email two faculty labs with a concise interest note and project portfolio link.',
  },
  {
    id: 'bhlth-320-community-health',
    group: 'next-time',
    name: 'BHLTH 320: Community Health Practice',
    type: 'course',
    whyItHelps:
      'Adds structured field experience and program coordination language useful for service, health, and operations roles.',
    tags: ['Field experience', 'Program coordination', 'Community engagement'],
    active: true,
    lastVerified: 'May 1, 2026',
    confidence: 84,
    sourceLabel: 'UW course catalog',
    roadmapWeek: 3,
    roadmapAction: 'Discuss enrollment with your advisor and note learning goals tied to the posting.',
  },
  {
    id: 'women-in-stem-fellowship',
    group: 'next-time',
    name: 'UW STEM Leadership Fellowship',
    type: 'fellowship',
    whyItHelps:
      'Adds structured leadership and mentorship evidence for roles asking for collaboration signals.',
    tags: ['Leadership', 'Mentorship', 'Communication'],
    active: true,
    lastVerified: 'April 29, 2026',
    confidence: 79,
    sourceLabel: 'UW student opportunities',
    roadmapWeek: 3,
    roadmapAction: 'Save the next fellowship cycle and draft a leadership-focused application note.',
  },
];

export const roadmapWeeks: RoadmapWeek[] = [
  {
    week: 1,
    title: 'Tighten the application story',
    summary: 'Turn the analysis into immediate resume edits and advisor feedback.',
    actions: [
      {
        id: 'week-1-bullets',
        text: 'Rewrite three resume bullets around measurable impact.',
        detail: 'Use the job posting language for organization, communication, and community impact.',
      },
      {
        id: 'week-1-advisor',
        text: 'Contact an advisor or peer reviewer.',
        detail: 'Ask whether the revised bullets clearly show leadership and measurable outcomes.',
      },
    ],
  },
  {
    week: 2,
    title: 'Add quick proof',
    summary: 'Choose one fast activity that creates a real artifact before applying.',
    actions: [
      {
        id: 'week-2-project',
        text: 'Complete one scoped project task.',
        detail: 'Prioritize a presentation, portfolio sample, certification, or documented volunteer hours.',
      },
      {
        id: 'week-2-keywords',
        text: 'Add missing keywords only where they are earned.',
        detail: 'Keep resume language truthful and tied to specific work.',
      },
    ],
  },
  {
    week: 3,
    title: 'Finalize and apply',
    summary: 'Lock the resume, preserve the roadmap, and submit with confidence.',
    actions: [
      {
        id: 'week-3-revise',
        text: 'Run one final resume pass.',
        detail: 'Check consistency between resume, portfolio, and application answers.',
      },
      {
        id: 'week-3-apply',
        text: 'Apply and save next-time opportunities.',
        detail: 'Keep longer-term UW recommendations for the next recruiting cycle.',
      },
    ],
  },
];
