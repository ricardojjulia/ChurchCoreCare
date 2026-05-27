import { useEffect, useState } from 'react';
import { Alert, Loader, Stack, Text } from '@mantine/core';
import ClaimCard from './ClaimCard.jsx';
import ClaimSubmitButton from './ClaimSubmitButton.jsx';

export default function ClaimsList({ clientId }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const url = clientId
        ? `/api/v1/billing/claims?clientId=${encodeURIComponent(clientId)}`
        : '/api/v1/billing/claims';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setClaims(json.items ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [clientId]);

  if (loading) return <Loader size="sm" />;
  if (error) return <Alert color="red">{error}</Alert>;
  if (claims.length === 0) return <Text fz="sm" c="dimmed">No claims found.</Text>;

  return (
    <Stack gap="sm">
      {claims.map((claim) => (
        <Stack key={claim.id} gap="xs">
          <ClaimCard claim={claim} />
          {(!claim.status || claim.status === 'draft') && (
            <ClaimSubmitButton claimId={claim.id} onSubmitted={load} />
          )}
        </Stack>
      ))}
    </Stack>
  );
}
