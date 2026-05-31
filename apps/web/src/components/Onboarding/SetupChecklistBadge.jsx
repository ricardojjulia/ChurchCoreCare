import { Badge, Button } from '@mantine/core';
import { CheckCircle } from 'lucide-react';
import { useI18n } from '../../lib/i18nContext.jsx';

/**
 * SetupChecklistBadge
 *
 * Shown in the sidebar when onboarding is still pending. Clicking it
 * re-opens the onboarding wizard. Only renders when shouldShowWizard=true.
 *
 * @param {{ shouldShowWizard: boolean, onOpen: () => void }} props
 */
export default function SetupChecklistBadge({ shouldShowWizard, onOpen }) {
  const { t } = useI18n();

  if (!shouldShowWizard) return null;

  return (
    <Button
      variant="subtle"
      size="xs"
      leftSection={<CheckCircle size={14} />}
      onClick={onOpen}
      data-testid="setup-checklist-badge"
      px="xs"
    >
      <Badge
        color="orange"
        variant="light"
        radius="xl"
        size="sm"
        style={{ pointerEvents: 'none' }}
      >
        {t('onboarding.setup_badge')}
      </Badge>
    </Button>
  );
}
