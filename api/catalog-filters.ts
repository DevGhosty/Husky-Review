import type { ActivityRow } from './review-analysis.js';

export type ActivityInterest = 'club' | 'course' | 'event' | 'fellowship' | 'project' | 'research';

const interestValues = new Set<ActivityInterest>(['club', 'course', 'event', 'fellowship', 'project', 'research']);

export function parseActivityInterests(value: unknown): ActivityInterest[] {
  if (!Array.isArray(value)) {
    return ['club', 'course', 'event'];
  }

  return value.filter((item): item is ActivityInterest => typeof item === 'string' && interestValues.has(item as ActivityInterest));
}

export function activityTypeFromCategory(category: string): ActivityInterest {
  if (category === 'program') {
    return 'fellowship';
  }
  if (interestValues.has(category as ActivityInterest)) {
    return category as ActivityInterest;
  }
  return 'project';
}

export function matchesActivityInterests(category: string, interests: ActivityInterest[]): boolean {
  if (!interests.length) {
    return true;
  }

  return interests.includes(activityTypeFromCategory(category));
}

export function filterActivitiesByInterests(activities: ActivityRow[], interests: ActivityInterest[]): ActivityRow[] {
  const normalized = parseActivityInterests(interests);
  if (!normalized.length) {
    return activities;
  }

  return activities.filter((activity) => matchesActivityInterests(activity.category, normalized));
}
