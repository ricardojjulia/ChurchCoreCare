import { useEffect, useState } from 'react';
import { Alert, Group, Loader, Select, Stack, Text } from '@mantine/core';
import ClaimCard from './ClaimCard.jsx';
import ClaimSubmitButton from './ClaimSubmitButton.jsx';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'paid', label: 'Paid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'denied', label: 'Denied' },
  { value: 'rejected', label: 'Rejected' },
];

export default function ClaimsList({ clientId }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const url = clientId
        ? `/api/v1/billing/claims?clientId=${encodeURIComponent(clientId)}`
        : '/api/v1/billing/claims';
      const res = await fetch(url, { credentials: 'include' });
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

  const visible = statusFilter ? claims.filter((c) => c.status === statusFilter) : claims;

  return (
    <Stack gap="sm">
      <Group>
        <Select
          size="xs"
          data={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v ?? '')}
          style={{ width: 180 }}
          allowDeselect={false}
        />
      </Group>

      {visible.length === 0 ? (
        <Text fz="sm" c="dimmed">No claims found.</Text>
      ) : (
        visible.map((claim) => (
          <Stack key={claim.id} gap="xs">
            <ClaimCard claim={claim} />
            {(!claim.status || claim.status === 'draft') && (
              <ClaimSubmitButton claimId={claim.id} onSubmitted={load} />
            )}
          </Stack>
        ))
      )}
    </Stack>
  );
}
