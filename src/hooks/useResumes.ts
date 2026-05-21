/**
 * React hook for managing user's saved resumes
 * Fetches from API proxy which validates Auth0 token and applies RLS
 */

import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { deleteResume as deleteResumeRequest, fetchUserResumes, type ResumeRecord } from '../auth/supabase-client';

export function useResumes() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchResumes = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getAccessTokenSilently();

        const data = await fetchUserResumes(token);
        setResumes(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, [isAuthenticated, getAccessTokenSilently]);

  const deleteResume = async (id: string) => {
    try {
      const token = await getAccessTokenSilently();

      await deleteResumeRequest(token, id);
      setResumes((current) => current.filter((r) => r.id !== id));
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  return {
    resumes,
    loading,
    error,
    deleteResume,
  };
}
