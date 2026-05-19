import type { ActivityType } from '../types/analysis';

export interface ActivityInterestOption {
  id: ActivityType;
  label: string;
  description: string;
}

export const ACTIVITY_INTEREST_OPTIONS: ActivityInterestOption[] = [
  {
    id: 'course',
    label: 'Courses',
    description: 'Degree and elective classes from the UWB catalog',
  },
  {
    id: 'club',
    label: 'Clubs & organizations',
    description: 'Registered student groups and communities',
  },
  {
    id: 'event',
    label: 'Events & workshops',
    description: 'Career fairs, info sessions, and skill workshops',
  },
  {
    id: 'research',
    label: 'Research roles',
    description: 'Faculty labs and assistant openings',
  },
  {
    id: 'fellowship',
    label: 'Fellowships & programs',
    description: 'Structured leadership and funding opportunities',
  },
  {
    id: 'project',
    label: 'Projects & competitions',
    description: 'Hackathons, capstones, and team projects',
  },
];

export const UWB_MAJORS = [
  'Business Administration',
  'Computer Science',
  'Nursing',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Biology',
  'Health Studies',
  'Psychology',
  'Education',
  'Media & Communication Studies',
  'Global Studies',
  'Other',
] as const;

export type UwbMajor = (typeof UWB_MAJORS)[number];

const activityInterestLabels = Object.fromEntries(
  ACTIVITY_INTEREST_OPTIONS.map((option) => [option.id, option.label]),
) as Record<ActivityType, string>;

export function getActivityInterestLabel(id: ActivityType): string {
  return activityInterestLabels[id];
}

export function getMajorLabel(major: string): string {
  return major.trim() || 'Undeclared';
}

export function isActivityType(value: unknown): value is ActivityType {
  return typeof value === 'string' && value in activityInterestLabels;
}
