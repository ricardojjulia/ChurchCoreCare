import { useState, useEffect } from 'react';

/**
 * Returns the current subscription trial status for the authenticated tenant.
 *
 * Returns:
 *   { status, trialEndsAt, daysLeft, isExpired, isTrial, loading }
 *
 * status values:
 *   'trial'    — active trial
 *   'active'   — paid subscription
 *   'past_due' — payment failed
 *   'canceled' — subscription ended
 *   null       — not yet loaded or not configured
 */
export function useTrialStatus() {
  const [data, setData] = useState({ loading: true, status: null, trialEndsAt: null });

  useEffect(() => {
    fetch('/api/v1/billing/subscription', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        const sub = json?.subscription;
        if (!sub) {
          setData({ loading: false, status: null, trialEndsAt: null });
          return;
        }
        setData({ loading: false, status: sub.status, trialEndsAt: sub.trialEndsAt ?? null });
      })
      .catch(() => {
        setData({ loading: false, status: null, trialEndsAt: null });
      });
  }, []);

  const daysLeft = (() => {
    if (!data.trialEndsAt) return null;
    const diff = new Date(data.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  return {
    loading: data.loading,
    status: data.status,
    trialEndsAt: data.trialEndsAt,
    daysLeft,
    isTrial: data.status === 'trial',
    isExpired: data.status === 'trial' && daysLeft === 0,
    isPastDue: data.status === 'past_due',
    isCanceled: data.status === 'canceled',
  };
}
