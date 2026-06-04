import type { ActivityType, Recommendation } from '../types/analysis';
import type { ProfileSettings } from './profile-settings';

export type RecommendationTypeFilter = 'all' | ActivityType;

export function filterRecommendationsForDisplay(
  recommendations: Recommendation[],
  settings: Pick<ProfileSettings, 'includeLongTerm' | 'prioritizeInTime' | 'activityInterests'>,
): Recommendation[] {
  const interestSet = new Set(settings.activityInterests);
  let filtered = recommendations.filter((recommendation) => {
    if (!settings.includeLongTerm && recommendation.group === 'next-time') {
      return false;
    }
    if (interestSet.size && !interestSet.has(recommendation.type)) {
      return false;
    }
    return true;
  });

  if (settings.prioritizeInTime) {
    filtered = [...filtered].sort((left, right) => {
      if (left.group === right.group) {
        return right.confidence - left.confidence;
      }
      return left.group === 'in-time' ? -1 : 1;
    });
  }

  return filtered;
}

export function filterRecommendationsByType(
  recommendations: Recommendation[],
  typeFilter: RecommendationTypeFilter,
): Recommendation[] {
  if (typeFilter === 'all') {
    return recommendations;
  }
  return recommendations.filter((recommendation) => recommendation.type === typeFilter);
}
