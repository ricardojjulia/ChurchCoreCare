import { useState } from 'react';
import { Alert, Button } from '@mantine/core';

export default function ClaimSubmitButton({ claimId, onSubmitted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/billing/claims/${claimId}/submit`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Error ${res.status}`);
      }
      onSubmitted?.();
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && <Alert color="red" p="xs" fz="xs" mb="xs">{error}</Alert>}
      <Button size="xs" loading={loading} onClick={handleSubmit}>
        Submit Claim
      </Button>
    </>
  );
}
