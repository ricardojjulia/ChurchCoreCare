import { Button, Group, Stack, Text } from '@mantine/core';
import { FileText } from 'lucide-react';
import ClaimsList from '../../Billing/ClaimsList.jsx';

export default function BillingTab({ clientId }) {
  function openStatement() {
    window.open(`/api/v1/clients/${encodeURIComponent(clientId)}/statement`, '_blank', 'noopener');
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text fw={600}>Claims</Text>
        <Button
          size="xs"
          variant="default"
          leftSection={<FileText size={14} />}
          onClick={openStatement}
        >
          Generate Statement
        </Button>
      </Group>
      <ClaimsList clientId={clientId} />
    </Stack>
  );
}
