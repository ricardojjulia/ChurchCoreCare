import { Group, Text, Button, Box } from '@mantine/core';
import { Building2, ArrowLeft } from 'lucide-react';
import { useI18n } from '../../lib/i18nContext.jsx';

export default function PracticeContextBanner({ practice, onExit }) {
  const { t } = useI18n();
  return (
    <Box
      style={{
        background: 'linear-gradient(90deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
        borderBottom: '1px solid rgba(99,102,241,0.18)',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <Group gap={6} wrap="nowrap" style={{ flex: 1 }}>
        <Building2 size={14} style={{ color: 'var(--mantine-color-indigo-7)', flexShrink: 0 }} />
        <Text size="xs" c="indigo" fw={600}>
          {t('platform.context.managing', { name: practice.practiceName })}
        </Text>
        <Text size="xs" c="dimmed">— {t('platform.context.banner', { name: practice.practiceName })}</Text>
      </Group>
      <Button
        size="xs"
        variant="subtle"
        color="indigo"
        leftSection={<ArrowLeft size={12} />}
        onClick={onExit}
        style={{ flexShrink: 0 }}
      >
        {t('platform.context.exit')}
      </Button>
    </Box>
  );
}
