import { useState, useEffect } from 'react';

/**
 * Detects the current tenant plan type by probing the ministry summary endpoint.
 *
 * Returns { planType, loading }:
 *   planType = 'ministry' if the endpoint responds with 200.
 *   planType = 'standard' if the endpoint responds with 403 ministry_plan_required.
 *   planType = null if not yet resolved or if the request fails in an unexpected way.
 *
 * isMinistry is true only when planType === 'ministry'.
 */
export function usePlanType() {
  const [planType, setPlanType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/ministry/summary', { credentials: 'include' })
      .then(async (r) => {
        if (r.ok) {
          setPlanType('ministry');
          return;
        }
        if (r.status === 403) {
          let body = null;
          try { body = await r.json(); } catch (_) {}
          if (body?.error === 'ministry_plan_required') {
            setPlanType('standard');
          } else {
            // 403 for some other reason (e.g., insufficient role) — treat as non-ministry
            setPlanType('standard');
          }
          return;
        }
        // Unexpected status — leave as null
        setPlanType(null);
      })
      .catch(() => setPlanType(null))
      .finally(() => setLoading(false));
  }, []);

  return { planType, loading, isMinistry: planType === 'ministry' };
}
