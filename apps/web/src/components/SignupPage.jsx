import { useState } from 'react';
import {
  Stack, Paper, Title, Text, TextInput, PasswordInput, Select, Button,
  Alert, Anchor, Group, ThemeIcon, Center, Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Building2, CheckCircle } from 'lucide-react';

const PLAN_OPTIONS = [
  { value: 'solo', label: 'Solo — $69/mo · 1 counselor · 30-day free trial' },
  { value: 'group', label: 'Group — $99/mo · Up to 3 counselors · 30-day free trial' },
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

export default function SignupPage() {
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const form = useForm({
    initialValues: {
      practiceName: '',
      slug: '',
      ownerEmail: '',
      password: '',
      confirmPassword: '',
      planKey: 'solo',
    },
    validate: {
      practiceName: (v) => v.trim().length < 2 ? 'Practice name is required' : null,
      slug: (v) => {
        if (!v) return 'Practice URL is required';
        if (!/^[a-z0-9][a-z0-9-]{2,29}$/.test(v)) return '3–30 lowercase letters, digits, or hyphens; must start with a letter or digit';
        return null;
      },
      ownerEmail: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Valid email is required',
      password: (v) => v.length < 8 ? 'Password must be at least 8 characters' : null,
      confirmPassword: (v, values) => v !== values.password ? 'Passwords do not match' : null,
    },
  });

  async function checkSlugAvailability(slug) {
    if (!slug || !/^[a-z0-9][a-z0-9-]{2,29}$/.test(slug)) {
      setSlugAvailable(null);
      return;
    }
    setCheckingSlug(true);
    try {
      const res = await fetch(`/api/v1/platform/check-slug?slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        setSlugAvailable(data.available);
      }
    } catch (_) {
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  }

  function handlePracticeNameChange(e) {
    const value = e.currentTarget.value;
    form.setFieldValue('practiceName', value);
    const auto = slugify(value);
    if (auto) {
      form.setFieldValue('slug', auto);
      checkSlugAvailability(auto);
    }
  }

  function handleSlugChange(e) {
    const value = slugify(e.currentTarget.value);
    form.setFieldValue('slug', value);
    checkSlugAvailability(value);
  }

  async function handleSubmit(values) {
    if (slugAvailable === false) {
      form.setFieldError('slug', 'This practice URL is already taken');
      return;
    }
    setSubmitError(null);
    try {
      const res = await fetch('/api/v1/platform/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceName: values.practiceName.trim(),
          slug: values.slug,
          ownerEmail: values.ownerEmail.trim().toLowerCase(),
          password: values.password,
          planKey: values.planKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? 'Signup failed. Please try again.');
        return;
      }
      setSuccessData(data);
      setStep('success');
    } catch (_) {
      setSubmitError('Network error. Please check your connection and try again.');
    }
  }

  if (step === 'success') {
    return (
      <Center h="100vh" bg="var(--mantine-color-gray-0)">
        <Paper withBorder radius="lg" p="xl" maw={480} w="100%">
          <Stack align="center" gap="md">
            <ThemeIcon size={56} radius="xl" color="teal" variant="light">
              <CheckCircle size={28} />
            </ThemeIcon>
            <Title order={2} ta="center">Your trial is ready!</Title>
            <Text c="dimmed" ta="center" size="sm">
              Your 30-day free trial of ChurchCore Care has been activated.
              No credit card required until your trial ends.
            </Text>
            {successData?.trialEndsAt && (
              <Text size="sm" fw={500} ta="center">
                Trial ends: {new Date(successData.trialEndsAt).toLocaleDateString()}
              </Text>
            )}
            <Divider w="100%" />
            <Text size="sm" ta="center" c="dimmed">
              Your practice URL:
            </Text>
            <Text fw={700} size="lg" ta="center" style={{ wordBreak: 'break-all' }}>
              {successData?.practiceUrl ?? `https://${successData?.slug}.churchcorecare.com`}
            </Text>
            <Button
              fullWidth
              size="md"
              color="teal"
              component="a"
              href={successData?.practiceUrl ?? 'https://app.churchcorecare.com'}
            >
              Go to your practice
            </Button>
            <Text size="xs" c="dimmed" ta="center">
              A confirmation email has been sent to your inbox.
            </Text>
          </Stack>
        </Paper>
      </Center>
    );
  }

  const slugStatus = form.values.slug && !form.errors.slug
    ? checkingSlug
      ? 'Checking…'
      : slugAvailable === true
      ? '✓ Available'
      : slugAvailable === false
      ? '✗ Already taken'
      : null
    : null;

  const slugStatusColor = slugAvailable === true ? 'teal' : slugAvailable === false ? 'red' : 'dimmed';

  return (
    <Center h="100vh" bg="var(--mantine-color-gray-0)">
      <Paper withBorder radius="lg" p="xl" maw={480} w="100%">
        <Stack gap="md">
          <Group gap="sm">
            <ThemeIcon size={40} radius="md" color="blue" variant="light">
              <Building2 size={22} />
            </ThemeIcon>
            <div>
              <Title order={3} lh={1.2}>Start your free trial</Title>
              <Text size="xs" c="dimmed">30 days free · No credit card required</Text>
            </div>
          </Group>

          {submitError && (
            <Alert color="red" variant="light">{submitError}</Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <TextInput
                label="Practice name"
                placeholder="Grace Counseling Center"
                required
                {...form.getInputProps('practiceName')}
                onChange={handlePracticeNameChange}
              />

              <div>
                <TextInput
                  label="Practice URL"
                  placeholder="grace-counseling"
                  description="Your practice will be at this address on churchcorecare.com"
                  leftSection={<Text size="xs" c="dimmed">churchcorecare.com/</Text>}
                  leftSectionWidth={160}
                  required
                  {...form.getInputProps('slug')}
                  onChange={handleSlugChange}
                />
                {slugStatus && (
                  <Text size="xs" c={slugStatusColor} mt={4}>{slugStatus}</Text>
                )}
              </div>

              <Select
                label="Plan"
                data={PLAN_OPTIONS}
                required
                {...form.getInputProps('planKey')}
              />

              <TextInput
                label="Owner email"
                placeholder="pastor@gracecenter.org"
                type="email"
                required
                {...form.getInputProps('ownerEmail')}
              />

              <PasswordInput
                label="Password"
                placeholder="At least 8 characters"
                required
                {...form.getInputProps('password')}
              />

              <PasswordInput
                label="Confirm password"
                placeholder="Repeat your password"
                required
                {...form.getInputProps('confirmPassword')}
              />

              <Button type="submit" fullWidth size="md" mt="xs">
                Start free trial
              </Button>
            </Stack>
          </form>

          <Text size="xs" c="dimmed" ta="center">
            Already have an account?{' '}
            <Anchor size="xs" href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}>
              Sign in
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
