import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import EraReconciliationBadge from './EraReconciliationBadge.jsx';

function statusColor(status) {
  if (status === 'paid' || status === 'accepted') return 'green';
  if (status === 'partially_paid') return 'yellow';
  if (status === 'rejected' || status === 'denied') return 'red';
  if (status === 'submitted') return 'blue';
  return 'gray';
}

const ERA_STATUSES = new Set(['paid', 'partially_paid', 'denied']);

export default function ClaimCard({ claim }) {
  const showEraBadge = ERA_STATUSES.has(claim.status) && claim.eraReceivedAt;

  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text fz="sm" fw={600}>Claim {claim.id}</Text>
          <Group gap="xs">
            {showEraBadge ? (
              <EraReconciliationBadge
                status={claim.status}
                eraReceivedAt={claim.eraReceivedAt}
                adjustmentReason={claim.adjustmentReason}
              />
            ) : (
              <Badge color={statusColor(claim.status)} size="sm" variant="light">
                {claim.status ?? 'draft'}
              </Badge>
            )}
          </Group>
        </Group>

        {claim.submittedAt && (
          <Text fz="xs" c="dimmed">
            Submitted: {new Date(claim.submittedAt).toLocaleDateString()}
          </Text>
        )}

        {claim.payerClaimNumber && (
          <Text fz="xs">Payer claim #: <strong>{claim.payerClaimNumber}</strong></Text>
        )}

        {claim.paidAmount != null && (
          <Text fz="xs" c="teal.7">
            Paid: <strong>${Number(claim.paidAmount).toFixed(2)}</strong>
            {claim.adjustmentReason && ` · Adj: ${claim.adjustmentReason}`}
          </Text>
        )}

        {claim.eraReceivedAt && (
          <Text fz="xs" c="dimmed">
            ERA received: {new Date(claim.eraReceivedAt).toLocaleDateString()}
          </Text>
        )}

        {claim.rejectionReason && (
          <Text fz="xs" c="red">Rejection: {claim.rejectionReason}</Text>
        )}

        {claim.notes && (
          <Text fz="xs" c="dimmed">{claim.notes}</Text>
        )}
      </Stack>
    </Card>
  );
}
