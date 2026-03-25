import { useState } from 'react';
import { Burger, Group, Select, Badge, Text, Box } from '@mantine/core';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'pt', label: 'Português' },
];

const STATUS_CONFIG = {
  loading:   { color: 'gray',  label: 'Connecting…' },
  connected: { color: 'green', label: 'API Connected' },
  error:     { color: 'red',   label: 'Connection Error' },
};

export default function TopBar({ opened, onMenuToggle, connectionStatus, currentUser }) {
  const [language, setLanguage] = useState('en');
  const status = STATUS_CONFIG[connectionStatus] ?? STATUS_CONFIG.loading;

  const userLabel =
    typeof currentUser?.name === 'string' && currentUser.name.trim()
      ? currentUser.name.trim()
      : typeof currentUser?.email === 'string' && currentUser.email.trim()
        ? currentUser.email.trim()
        : 'Secure session';

  return (
    <Group h="100%" px="md" justify="space-between" wrap="nowrap">
      <Burger opened={opened} onClick={onMenuToggle} aria-label="Toggle navigation" size="sm" />

      <Group gap="xs" justify="center" style={{ flex: 1 }}>
        <Text fw={700} fz="lg" style={{ whiteSpace: 'nowrap' }}>Practice HUB</Text>
        <Badge color={status.color} variant="light" size="sm">{status.label}</Badge>
      </Group>

      <Group gap="sm" wrap="nowrap">
        <Select
          data={LANGUAGES}
          value={language}
          onChange={setLanguage}
          size="xs"
          w={120}
          aria-label="Language"
        />
        <Box>
          <Badge variant="outline" color="gray" radius="xl" size="lg">
            {userLabel}
          </Badge>
          <Text fz="xs" c="dimmed" ta="right" mt={2}>Server-managed session</Text>
        </Box>
      </Group>
    </Group>
  );
}
