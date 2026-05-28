import { Box, Button, Card, Stack, Text, Title } from '@mantine/core';
import { LogOut, User } from 'lucide-react';

export default function ProfileTab({ user, onLogout }) {
  return (
    <Box p="md">
      <Title order={4} mb="md">Profile</Title>
      <Card withBorder radius="md" p="md" mb="md">
        <Stack gap="xs">
          <User size={32} color="var(--mantine-color-blue-6)" />
          <Text fw={600}>{user?.name ?? user?.email ?? 'Counselor'}</Text>
          {user?.email && <Text size="sm" c="dimmed">{user.email}</Text>}
          {user?.role && (
            <Text size="xs" c="dimmed" tt="capitalize">
              {String(user.role).replace(/_/g, ' ')}
            </Text>
          )}
        </Stack>
      </Card>

      <Button
        leftSection={<LogOut size={16} />}
        variant="outline"
        color="red"
        fullWidth
        onClick={onLogout}
      >
        Sign out
      </Button>
    </Box>
  );
}
