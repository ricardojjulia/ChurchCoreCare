export const DEFAULT_POLICY = Object.freeze({
  requiredReviews: ['linguistic'],
  separationOfDuties: true,
  requireFreshValidation: true,
  staleActiveBehavior: 'serve_with_warning',
  maxReviewCommentLength: 1000,
});

export function normalizePolicy(policy = {}) {
  return {
    ...DEFAULT_POLICY,
    ...policy,
    requiredReviews: [...(policy.requiredReviews ?? DEFAULT_POLICY.requiredReviews)],
  };
}
