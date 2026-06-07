import { Badge, Group, Paper, Text } from '@mantine/core';

export default function DemoEnvironmentBanner() {
  if (import.meta.env.VITE_DEMO_ENVIRONMENT !== 'true') return null;

  return (
    <Paper
      aria-label="Demo environment notice"
      p="sm"
      radius="md"
      shadow="md"
      withBorder
      style={{
        bottom: 16,
        left: '50%',
        maxWidth: 'calc(100vw - 32px)',
        position: 'fixed',
        transform: 'translateX(-50%)',
        width: 520,
        zIndex: 10000,
      }}
    >
      <Group gap="sm" justify="center" wrap="nowrap">
        <Badge color="orange" variant="filled">Demo</Badge>
        <Text fw={600} size="sm">Synthetic demonstration data only. Do not enter real PHI.</Text>
      </Group>
    </Paper>
  );
}
