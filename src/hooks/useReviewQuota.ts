import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getAccessTokenRequestOptions } from '../auth/auth0-config';
import { fetchReviewQuota } from '../auth/supabase-client';
import type { ReviewQuotaStatus } from '../types/analysis';

export function useReviewQuota(refreshKey = 0) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [quota, setQuota] = useState<ReviewQuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setQuota(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadQuota() {
      try {
        setLoading(true);
        setError(null);
        const token = await getAccessTokenSilently(getAccessTokenRequestOptions());
        const nextQuota = await fetchReviewQuota(token);
        if (!cancelled) {
          setQuota(nextQuota);
        }
      } catch (quotaError) {
        if (!cancelled) {
          setError((quotaError as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadQuota();

    return () => {
      cancelled = true;
    };
  }, [getAccessTokenSilently, isAuthenticated, refreshKey]);

  return { quota, loading, error };
}
