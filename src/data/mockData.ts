import type { GapCategory, LoadingStep, Recommendation, RoadmapWeek } from '../types/analysis';

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

export const gapCategories: GapCategory[] = [
  {
    title: 'Missing Skills',
    summary: 'Backend API, data modeling, and deployment evidence are light for this posting.',
    items: ['REST API design', 'PostgreSQL schema design', 'Cloud deployment'],
    score: 68,
  },
  {
    title: 'Keyword Gaps',
    summary: 'The job posting repeats production, accessibility, and test coverage language.',
    items: ['Production readiness', 'Accessibility', 'Integration testing'],
    score: 74,
  },
  {
    title: 'Experience Signals',
    summary: 'Project ownership is visible, but collaboration and verification evidence can be stronger.',
    items: ['Cross-functional review', 'User validation', 'Documented source checks'],
    score: 81,
  },
];

export const matchScore = {
  score: 76,
  label: 'Strong foundation',
  summary: 'Your resume matches core frontend expectations, with clear opportunities to add verified UWB experience before applying.',
};

export const recommendations: Recommendation[] = [
  {
    id: 'css-club-review-night',
    group: 'in-time',
    name: 'CSS Club Resume Review Night',
    type: 'event',
    whyItHelps:
      'Gives you fast feedback on bullets, project framing, and missing keywords before the application deadline.',
    tags: ['Resume bullets', 'Peer review', 'Career prep'],
    active: true,
    lastVerified: 'May 8, 2026',
    confidence: 94,
    sourceLabel: 'UWB CSS Club calendar',
    roadmapWeek: 1,
    roadmapAction: 'Bring the target posting and revise three bullets after peer feedback.',
  },
  {
    id: 'career-services-advisor',
    group: 'in-time',
    name: 'UWB Career Services Advising',
    type: 'event',
    whyItHelps:
      'Connects your resume gaps to concrete wording changes and application timing advice.',
    tags: ['Advisor feedback', 'Application plan', 'Interview prep'],
    active: true,
    lastVerified: 'May 7, 2026',
    confidence: 91,
    sourceLabel: 'UWB Career Services',
    roadmapWeek: 1,
    roadmapAction: 'Book a 30-minute review and ask for feedback on backend and testing language.',
  },
  {
    id: 'hackathon-project-sprint',
    group: 'in-time',
    name: 'UWB Hackathon Project Sprint',
    type: 'project',
    whyItHelps:
      'Creates a short, recent project artifact that can show API design, teamwork, and deployment scope.',
    tags: ['Project proof', 'Teamwork', 'Deployment'],
    active: true,
    lastVerified: 'May 6, 2026',
    confidence: 88,
    sourceLabel: 'UWB events listing',
    roadmapWeek: 2,
    roadmapAction: 'Ship one small feature and add a measurable project bullet to the resume.',
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
    id: 'css-475-database-systems',
    group: 'next-time',
    name: 'CSS 475: Database Systems',
    type: 'course',
    whyItHelps:
      'Strengthens the PostgreSQL and schema-design experience requested by many software roles.',
    tags: ['PostgreSQL', 'Schema design', 'Query optimization'],
    active: true,
    lastVerified: 'May 1, 2026',
    confidence: 84,
    sourceLabel: 'UWB course catalog',
    roadmapWeek: 3,
    roadmapAction: 'Add the course to next-quarter planning and note database goals for advising.',
  },
  {
    id: 'women-in-stem-fellowship',
    group: 'next-time',
    name: 'UWB STEM Leadership Fellowship',
    type: 'fellowship',
    whyItHelps:
      'Adds structured leadership and mentorship evidence for roles asking for collaboration signals.',
    tags: ['Leadership', 'Mentorship', 'Communication'],
    active: true,
    lastVerified: 'April 29, 2026',
    confidence: 79,
    sourceLabel: 'UWB student opportunities',
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
        detail: 'Use the job posting language for accessibility, deployment, and testing.',
      },
      {
        id: 'week-1-advisor',
        text: 'Contact an advisor or peer reviewer.',
        detail: 'Ask whether the revised bullets clearly show project ownership.',
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
        detail: 'Prioritize a visible README, deployed demo, or test coverage note.',
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
        detail: 'Keep longer-term UWB recommendations for the next recruiting cycle.',
      },
    ],
  },
];
