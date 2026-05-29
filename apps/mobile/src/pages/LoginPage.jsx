import { useState } from 'react';
import { Alert, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { Cross } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message ?? 'Sign-in failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center h="100dvh" bg="gray.0" p="md">
      <Paper shadow="md" p="xl" radius="md" w="100%" maw={380}>
        <Stack gap="md">
          <Stack gap={4} align="center">
            <Cross size={36} color="var(--mantine-color-blue-6)" />
            <Title order={2} ta="center">ChurchCore Care</Title>
            <Text size="sm" c="dimmed" ta="center">Sign in to your counselor account</Text>
          </Stack>

          {error && (
            <Alert color="red" variant="light" radius="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
                autoFocus
                autoComplete="email"
                inputMode="email"
              />
              <PasswordInput
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
                autoComplete="current-password"
              />
              <Button type="submit" loading={loading} fullWidth mt="xs" size="md">
                Sign in
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Center>
  );
}
