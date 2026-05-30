import { useState, useEffect, useCallback } from 'react';

/**
 * Fetches GET /api/v1/subscription/usage on mount.
 * Returns { data, loading, error, refetch }.
 *
 * data shape:
 *   plan: { planType, uiPersona, planDisplayName, counselorLimit, clientLimit }
 *   usage: { activeCounselors, activeClients }
 *   grace: { counselorsInGrace, clientsInGrace, graceStartedAt, graceDaysRemaining, graceExpired }
 *   personaUpgrade: { dismissCount, muted, shouldPromptUpgrade }
 */
export function useSubscriptionUsage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/api/v1/subscription/usage', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then((body) => {
            throw new Error(body.error || body.message || `Request failed: ${res.status}`);
          });
        }
        return res.json();
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Unable to load subscription usage');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  return { data, loading, error, refetch };
}
