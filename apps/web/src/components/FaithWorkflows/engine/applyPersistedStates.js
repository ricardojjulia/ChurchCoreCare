/**
 * Merges server-persisted recommendation states into a recommendation list.
 *
 * Pure function — no side effects.
 *
 * Safety invariant: a recommendation with priority >= SAFETY_LOCK_THRESHOLD
 * cannot have status 'hidden' or 'deferred' regardless of persisted state.
 */

import { SAFETY_LOCK_THRESHOLD } from './types.js';

/**
 * @param {import('./types.js').Recommendation[]} recs
 * @param {Record<string, { status: import('./types.js').RecommendationStatus }>} states
 * @param {boolean} applyStates — when false the original list is returned unchanged
 * @returns {import('./types.js').Recommendation[]}
 */
export function applyPersistedStates(recs, states, applyStates) {
  if (!applyStates) return recs;
  return recs.map((rec) => {
    const persisted = states[rec.ruleId];
    if (!persisted) return rec;
    let status = persisted.status;
    if (rec.priority >= SAFETY_LOCK_THRESHOLD && (status === 'hidden' || status === 'deferred')) {
      status = 'pending';
    }
    return { ...rec, status };
  });
}
