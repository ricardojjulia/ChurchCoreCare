import { useState } from 'react';
import { Stack, Paper, Title, Text, Button, Center, ThemeIcon, Group } from '@mantine/core';
import { Zap } from 'lucide-react';

export default function TrialExpiredPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/billing/portal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Could not open billing portal');
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Center h="100vh" bg="var(--mantine-color-gray-0)">
      <Paper withBorder radius="lg" p="xl" maw={480} w="100%">
        <Stack align="center" gap="md">
          <ThemeIcon size={56} radius="xl" color="orange" variant="light">
            <Zap size={28} />
          </ThemeIcon>
          <Title order={2} ta="center">Your free trial has ended</Title>
          <Text c="dimmed" ta="center" size="sm">
            Your 30-day free trial of ChurchCore Care has expired. Add a payment method to restore
            access to all your clinical workflows, client records, and scheduling.
          </Text>
          <Text c="dimmed" ta="center" size="xs">
            Your data is safe. Everything is preserved and waiting for you.
          </Text>
          {error && (
            <Text c="red" size="sm" ta="center">{error}</Text>
          )}
          <Button
            size="md"
            color="orange"
            fullWidth
            loading={loading}
            leftSection={<Zap size={16} />}
            onClick={handleUpgrade}
          >
            Add payment method
          </Button>
          <Text size="xs" c="dimmed" ta="center">
            Questions? Email{' '}
            <Text span c="orange" style={{ cursor: 'default' }}>support@churchcorecare.com</Text>
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
