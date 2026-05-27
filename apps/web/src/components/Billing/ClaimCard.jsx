import { Badge, Card, Group, Stack, Text } from '@mantine/core';

function statusColor(status) {
  if (status === 'accepted') return 'green';
  if (status === 'rejected') return 'red';
  if (status === 'submitted') return 'blue';
  return 'gray';
}

export default function ClaimCard({ claim }) {
  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text fz="sm" fw={600}>Claim {claim.id}</Text>
          <Badge color={statusColor(claim.status)} size="sm" variant="light">
            {claim.status ?? 'draft'}
          </Badge>
        </Group>

        {claim.submittedAt && (
          <Text fz="xs" c="dimmed">
            Submitted: {new Date(claim.submittedAt).toLocaleDateString()}
          </Text>
        )}

        {claim.payerClaimNumber && (
          <Text fz="xs">Payer claim #: <strong>{claim.payerClaimNumber}</strong></Text>
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
