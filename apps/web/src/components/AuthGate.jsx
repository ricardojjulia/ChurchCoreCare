import { useState } from 'react';
import { TextInput, PasswordInput, Button, Alert, Text, Paper, Stack, Group, Box, List } from '@mantine/core';

export default function AuthGate({ onContinue }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState(null);
  const [lockedOut, setLockedOut] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLockedOut(false);
    setLoading(true);
    try {
      const resp = await fetch('/api/v1/auth/login', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        const isLocked = resp.status === 423;
        setLockedOut(isLocked);
        setError(isLocked
          ? 'Your account is locked after repeated failed sign-in attempts. Contact a practice administrator.'
          : (data.error || 'Invalid credentials. Please try again.'));
        return;
      }
      onContinue(data.profile);
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.2)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 40,
      }}
    >
      <Paper radius="lg" withBorder shadow="lg" style={{ width: 'min(820px, 96vw)', overflow: 'hidden' }}>
        <Group align="stretch" wrap="nowrap" gap={0}>
          {/* Intro panel */}
          <Box
            p="xl"
            style={{
              flex: '0 0 300px',
              background: 'linear-gradient(160deg, #eef2ff 0%, #f6f8fc 100%)',
              borderRight: '1px solid var(--mantine-color-default-border)',
            }}
          >
            <Box mb="md">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect x="15" y="4" width="6" height="28" rx="3" fill="#4f46e5" fillOpacity="0.82"/>
                <rect x="8" y="11" width="20" height="6" rx="3" fill="#4f46e5" fillOpacity="0.82"/>
              </svg>
            </Box>
            <Text fz="xs" fw={600} tt="uppercase" c="brand" ls={1} mb={4}>Faith Counseling</Text>
            <Text fw={700} fz="xl" mb="sm">Welcome back</Text>
            <Text fz="sm" c="dimmed" mb="md">
              Sign in to your clinician workspace — a HIPAA-aligned environment for managing clients,
              scheduling, documentation, and practice operations.
            </Text>
            <List fz="xs" c="dimmed" spacing={6}>
              <List.Item>Sessions are server-managed; no credentials stored in the browser.</List.Item>
              <List.Item>Passwords require 14 characters minimum.</List.Item>
              <List.Item>Repeated sign-in failures trigger account lockout protection.</List.Item>
            </List>
          </Box>

          {/* Form panel */}
          <Box p="xl" style={{ flex: 1 }}>
            <Text fw={600} fz="lg" mb="lg">Sign in</Text>
            <form onSubmit={handleSubmit} noValidate>
              <Stack gap="sm">
                <TextInput
                  label="Email"
                  type="email"
                  autoComplete="username"
                  placeholder="name@practice.org"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <PasswordInput
                  label="Password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <Text fz="xs" c="dimmed">
                  MFA is deferred for this release. Account lockout, secure cookies, and admin reset controls remain enforced.
                </Text>

                {error && (
                  <Alert color={lockedOut ? 'orange' : 'red'} variant="light" role="alert">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  loading={loading}
                  disabled={!email || !password}
                  fullWidth
                  mt="xs"
                >
                  Sign in
                </Button>
              </Stack>
            </form>
          </Box>
        </Group>
      </Paper>
    </Box>
  );
}
