import { useState } from 'react';
import { TextInput, PasswordInput, Button, Alert, Text, Paper, Stack, Group, Box, List } from '@mantine/core';
import { useI18n } from '../lib/i18nContext.jsx';

export default function AuthGate({ onContinue }) {
  const { t } = useI18n();
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
          ? t('auth.error.locked')
          : (data.error || t('auth.error.invalidCredentials')));
        return;
      }
      onContinue(data.profile);
    } catch {
      setError(t('auth.error.unreachable'));
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
            <Text fz="xs" fw={600} tt="uppercase" c="brand" ls={1} mb={4}>{t('brand.title')}</Text>
            <Text fw={700} fz="xl" mb="sm">{t('auth.welcomeBack')}</Text>
            <Text fz="sm" c="dimmed" mb="md">
              {t('auth.workspaceIntro')}
            </Text>
            <List fz="xs" c="dimmed" spacing={6}>
              <List.Item>{t('auth.security.serverManaged')}</List.Item>
              <List.Item>{t('auth.security.passwordPolicy')}</List.Item>
              <List.Item>{t('auth.security.lockout')}</List.Item>
            </List>
          </Box>

          {/* Form panel */}
          <Box p="xl" style={{ flex: 1 }}>
            <Text fw={600} fz="lg" mb="lg">{t('auth.signIn')}</Text>
            <form onSubmit={handleSubmit} noValidate>
              <Stack gap="sm">
                <TextInput
                  id="loginEmail"
                  label={t('auth.email')}
                  type="email"
                  autoComplete="username"
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <PasswordInput
                  id="loginPassword"
                  label={t('auth.password')}
                  autoComplete="current-password"
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <Text fz="xs" c="dimmed">
                  {t('auth.mfaDeferred')}
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
                  {t('auth.signIn')}
                </Button>
              </Stack>
            </form>
          </Box>
        </Group>
      </Paper>
    </Box>
  );
}
