import { Button, Group, Stack, Text } from '@mantine/core';
import { FileText } from 'lucide-react';
import ClaimsList from '../../Billing/ClaimsList.jsx';
import { useI18n } from '../../../lib/i18nContext.jsx';

export default function BillingTab({ clientId }) {
  const { t } = useI18n();
  function openStatement() {
    window.open(`/api/v1/clients/${encodeURIComponent(clientId)}/statement`, '_blank', 'noopener');
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text fw={600}>{t('billing.claims.title')}</Text>
        <Button
          size="xs"
          variant="default"
          leftSection={<FileText size={14} />}
          onClick={openStatement}
        >
          {t('billing.generateStatement')}
        </Button>
      </Group>
      <ClaimsList clientId={clientId} />
    </Stack>
  );
}
