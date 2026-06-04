import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getApiAccessToken } from '../auth/api-access-token';
import { deleteReview as deleteReviewRequest, fetchReviews } from '../auth/supabase-client';
import type { SavedReviewSummary } from '../types/analysis';

export function useReviews() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [reviews, setReviews] = useState<SavedReviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadReviews() {
      try {
        setLoading(true);
        setError(null);
        const token = await getApiAccessToken(getAccessTokenSilently);
        const data = await fetchReviews(token);
        if (!cancelled) {
          setReviews(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError((loadError as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, [getAccessTokenSilently, isAuthenticated]);

  const deleteReview = async (id: string) => {
    try {
      const token = await getApiAccessToken(getAccessTokenSilently);
      await deleteReviewRequest(token, id);
      setReviews((current) => current.filter((review) => review.id !== id));
    } catch (deleteError) {
      setError((deleteError as Error).message);
      throw deleteError;
    }
  };

  return { reviews, loading, error, deleteReview };
}
