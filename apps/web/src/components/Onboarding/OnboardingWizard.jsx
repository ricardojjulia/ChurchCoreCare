import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Select,
  Stack,
  Stepper,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DatePickerInput, TimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { CheckCircle, Info } from 'lucide-react';
import { csrfHeaders } from '../../lib/csrf.js';
import { useI18n } from '../../lib/i18nContext.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York',   label: 'Eastern Time (New York)' },
  { value: 'America/Chicago',    label: 'Central Time (Chicago)' },
  { value: 'America/Denver',     label: 'Mountain Time (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Phoenix',    label: 'Mountain Time – no DST (Phoenix)' },
  { value: 'America/Anchorage',  label: 'Alaska Time (Anchorage)' },
  { value: 'Pacific/Honolulu',   label: 'Hawaii Time (Honolulu)' },
  { value: 'Europe/London',      label: 'GMT / British Time (London)' },
  { value: 'Europe/Paris',       label: 'Central European Time (Paris)' },
  { value: 'Europe/Berlin',      label: 'Central European Time (Berlin)' },
  { value: 'Australia/Sydney',   label: 'Australian Eastern Time (Sydney)' },
];

const LICENSE_TYPE_OPTIONS = [
  { value: 'LPC',   label: 'LPC' },
  { value: 'LMFT',  label: 'LMFT' },
  { value: 'LCSW',  label: 'LCSW' },
  { value: 'LPCC',  label: 'LPCC' },
  { value: 'MDiv',  label: 'MDiv' },
  { value: 'DMin',  label: 'DMin' },
  { value: 'PhD',   label: 'PhD' },
  { value: 'PsyD',  label: 'PsyD' },
  { value: 'MA',    label: 'MA' },
  { value: 'Other', label: 'Other' },
];

const DENOMINATION_OPTIONS = [
  { value: 'broadly_christian',       label: 'Broadly Christian / Non-specific' },
  { value: 'evangelical_baptist',     label: 'Evangelical / Baptist' },
  { value: 'methodist',               label: 'Methodist' },
  { value: 'presbyterian_reformed',   label: 'Presbyterian / Reformed' },
  { value: 'lutheran',                label: 'Lutheran' },
  { value: 'anglican_episcopal',      label: 'Anglican / Episcopal' },
  { value: 'pentecostal_charismatic', label: 'Pentecostal / Charismatic' },
  { value: 'nondenominational',       label: 'Non-denominational' },
  { value: 'catholic_roman',          label: 'Catholic (Roman)' },
  { value: 'catholic_eastern',        label: 'Catholic (Eastern)' },
  { value: 'orthodox_eastern',        label: 'Orthodox (Eastern)' },
  { value: 'orthodox_oriental',       label: 'Orthodox (Oriental)' },
  { value: 'black_church',            label: 'Black Church (AME / COGIC)' },
  { value: 'mennonite_anabaptist',    label: 'Mennonite / Anabaptist' },
  { value: 'messianic_jewish',        label: 'Messianic Jewish' },
];

const APPOINTMENT_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'couples',    label: 'Couples' },
  { value: 'family',     label: 'Family' },
  { value: 'group',      label: 'Group' },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

async function patchOnboardingStep(step, payload) {
  const res = await fetch(`/api/v1/onboarding/step/${step}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: csrfHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      msg = body.error || body.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

async function postOnboardingComplete() {
  const res = await fetch('/api/v1/onboarding/complete', {
    method: 'POST',
    credentials: 'include',
    headers: csrfHeaders(),
  });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      msg = body.error || body.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

// ─── Step 1 — Practice Setup ─────────────────────────────────────────────────

function Step1Form({ onNext }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const form = useForm({
    initialValues: {
      practiceName: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    },
    validate: {
      practiceName: (v) => (!v?.trim() ? 'Practice name is required' : null),
      timezone: (v) => (!v ? 'Timezone is required' : null),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setApiError('');
    setLoading(true);
    try {
      await patchOnboardingStep(1, {
        practiceName: values.practiceName.trim(),
        timezone: values.timezone,
      });
      onNext();
    } catch (err) {
      setApiError(err.message || 'Unable to save. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {apiError && (
            <Alert color="red" title="Error" icon={<Info size={16} />}>
              {apiError}
            </Alert>
          )}

          <TextInput
            label="Practice Name"
            placeholder="Grace Counseling Center"
            required
            {...form.getInputProps('practiceName')}
          />

          <Select
            label="Timezone"
            data={TIMEZONE_OPTIONS}
            required
            searchable
            {...form.getInputProps('timezone')}
          />

          <Text fz="sm" c="dimmed">
            {t('onboarding.step1.help')}
          </Text>

          <Group justify="flex-end" mt="sm">
            <Button type="submit" data-testid="onboarding-step1-next">
              Next
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}

// ─── Step 2 — Counselor Profile ───────────────────────────────────────────────

function Step2Form({ onNext }) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      licenseType: '',
      tradition: 'broadly_christian',
      vocabularyPreset: '',
    },
    validate: {
      firstName:   (v) => (!v?.trim() ? 'First name is required' : null),
      lastName:    (v) => (!v?.trim() ? 'Last name is required' : null),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setApiError('');
    setLoading(true);
    try {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      };
      if (values.licenseType) payload.licenseType = values.licenseType;
      if (values.tradition) payload.tradition = values.tradition;
      if (values.vocabularyPreset) payload.vocabularyPreset = values.vocabularyPreset;
      await patchOnboardingStep(2, payload);
      onNext();
    } catch (err) {
      setApiError(err.message || 'Unable to save. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {apiError && (
            <Alert color="red" title="Error" icon={<Info size={16} />}>
              {apiError}
            </Alert>
          )}

          <Group grow>
            <TextInput
              label="First Name"
              placeholder="Jane"
              required
              {...form.getInputProps('firstName')}
            />
            <TextInput
              label="Last Name"
              placeholder="Smith"
              required
              {...form.getInputProps('lastName')}
            />
          </Group>

          <Select
            label="License Type"
            placeholder="Select license type"
            data={LICENSE_TYPE_OPTIONS}
            clearable
            {...form.getInputProps('licenseType')}
          />

          <Select
            label="Denomination / Faith Tradition"
            placeholder="Select tradition"
            data={DENOMINATION_OPTIONS}
            searchable
            {...form.getInputProps('tradition')}
          />

          <Text fz="sm" c="dimmed">
            This shapes how faith language appears in session notes.
          </Text>

          <Group justify="flex-end" mt="sm">
            <Button type="submit" data-testid="onboarding-step2-next">
              Next
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}

// ─── Step 3 — First Client (optional) ────────────────────────────────────────

function Step3Form({ onNext, onSkip }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      appointmentType: 'individual',
    },
    validate: {
      firstName: (v) => (!v?.trim() ? 'First name is required' : null),
      lastName:  (v) => (!v?.trim() ? 'Last name is required' : null),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setApiError('');
    setLoading(true);
    try {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      };
      if (values.email?.trim()) payload.email = values.email.trim();
      if (values.appointmentType) payload.appointmentType = values.appointmentType;
      await patchOnboardingStep(3, payload);
      onNext();
    } catch (err) {
      setApiError(err.message || 'Unable to save. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  const handleSkip = async () => {
    setApiError('');
    setLoading(true);
    try {
      await patchOnboardingStep(3, { skip: true });
      onSkip();
    } catch (err) {
      setApiError(err.message || 'Unable to skip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Alert color="blue" icon={<Info size={16} />}>
            You can skip this and add clients later from the Clients section.
          </Alert>

          {apiError && (
            <Alert color="red" title="Error" icon={<Info size={16} />}>
              {apiError}
            </Alert>
          )}

          <Group grow>
            <TextInput
              label="Client First Name"
              placeholder="First name"
              {...form.getInputProps('firstName')}
            />
            <TextInput
              label="Client Last Name"
              placeholder="Last name"
              {...form.getInputProps('lastName')}
            />
          </Group>

          <TextInput
            label="Client Email"
            placeholder="client@example.com"
            description="Optional — used for portal invitations"
            type="email"
            {...form.getInputProps('email')}
          />

          <Select
            label="Appointment Type"
            data={APPOINTMENT_TYPE_OPTIONS}
            {...form.getInputProps('appointmentType')}
          />

          <Group justify="space-between" mt="sm">
            <Button
              variant="subtle"
              size="sm"
              onClick={handleSkip}
              data-testid="onboarding-step3-skip"
            >
              {t('onboarding.step.skip')}
            </Button>
            <Button type="submit" data-testid="onboarding-step3-next">
              Next
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}

// ─── Step 4 — First Appointment (optional) ───────────────────────────────────

function Step4Form({ onComplete, onSkip, clientWasAdded }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const form = useForm({
    initialValues: {
      appointmentDate: null,
      startTime: '',
      endTime: '',
      appointmentType: 'individual',
    },
    validate: {
      appointmentDate: (v) => (!v ? 'Appointment date is required' : null),
      startTime:       (v) => (!v ? 'Start time is required' : null),
      endTime:         (v) => (!v ? 'End time is required' : null),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setApiError('');
    setLoading(true);
    try {
      const baseDate = values.appointmentDate;
      const toIso = (timeStr) => {
        if (!baseDate || !timeStr) return null;
        const d = new Date(baseDate);
        const [hours, minutes] = timeStr.split(':').map(Number);
        d.setHours(hours, minutes, 0, 0);
        return d.toISOString();
      };

      await patchOnboardingStep(4, {
        startTime: toIso(values.startTime),
        endTime: toIso(values.endTime),
        appointmentType: values.appointmentType,
      });
      onComplete();
    } catch (err) {
      setApiError(err.message || 'Unable to save. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  const handleSkip = async () => {
    setApiError('');
    setLoading(true);
    try {
      await patchOnboardingStep(4, { skip: true });
      onComplete();
    } catch (err) {
      setApiError(err.message || 'Unable to skip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Alert color="blue" icon={<Info size={16} />}>
            You can skip this and schedule appointments from the Calendar at any time.
          </Alert>

          {!clientWasAdded && (
            <Alert color="yellow" icon={<Info size={16} />}>
              No client was added in the previous step. Scheduling requires a client — you can add one from the Clients section first.
            </Alert>
          )}

          {apiError && (
            <Alert color="red" title="Error" icon={<Info size={16} />}>
              {apiError}
            </Alert>
          )}

          <DatePickerInput
            label="Appointment Date"
            placeholder="Pick a date"
            required
            disabled={!clientWasAdded}
            {...form.getInputProps('appointmentDate')}
          />

          <Group grow>
            <TimePicker
              label="Start Time"
              required
              disabled={!clientWasAdded}
              {...form.getInputProps('startTime')}
            />
            <TimePicker
              label="End Time"
              required
              disabled={!clientWasAdded}
              {...form.getInputProps('endTime')}
            />
          </Group>

          <Select
            label="Appointment Type"
            data={APPOINTMENT_TYPE_OPTIONS}
            disabled={!clientWasAdded}
            {...form.getInputProps('appointmentType')}
          />

          <Group justify="space-between" mt="sm">
            <Button
              variant="subtle"
              size="sm"
              onClick={handleSkip}
              data-testid="onboarding-step4-skip"
            >
              {t('onboarding.step.skip')}
            </Button>
            <Button
              type="submit"
              disabled={!clientWasAdded}
              data-testid="onboarding-step4-finish"
            >
              {t('onboarding.complete')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

/**
 * OnboardingWizard
 *
 * Full-screen modal that walks a new practice owner / admin through 4 setup
 * steps on first login. Cannot be dismissed until completed or all optional
 * steps have been skipped and the wizard is completed.
 *
 * @param {{ opened: boolean, onClose: () => void }} props
 */
export default function OnboardingWizard({ opened, onClose }) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const [clientWasAdded, setClientWasAdded] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handleStep1Next = () => setActive(1);
  const handleStep2Next = () => setActive(2);

  const handleStep3Next = () => {
    setClientWasAdded(true);
    setActive(3);
  };

  const handleStep3Skip = () => {
    setClientWasAdded(false);
    setActive(3);
  };

  const handleFinish = async () => {
    setCompleting(true);
    try {
      await postOnboardingComplete();
      notifications.show({
        title: 'Setup complete',
        message: 'Welcome to ChurchCore Care. Your practice is ready.',
        color: 'green',
        icon: <CheckCircle size={16} />,
        autoClose: 6000,
      });
      onClose();
    } catch (err) {
      notifications.show({
        title: 'Could not finalize setup',
        message: err.message || 'Please try again.',
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      setCompleting(false);
    }
  };

  const STEPS = [
    { title: t('onboarding.step1.title'), description: 'Practice name and timezone' },
    { title: t('onboarding.step2.title'), description: 'Your counselor profile' },
    { title: t('onboarding.step3.title'), description: 'Optional' },
    { title: t('onboarding.step4.title'), description: 'Optional' },
  ];

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      size="xl"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
      title={
        <Group gap="sm">
          <CheckCircle size={20} />
          <Text fw={700} fz="lg">{t('onboarding.title')}</Text>
        </Group>
      }
      data-testid="onboarding-wizard"
    >
      <Box pos="relative">
        <LoadingOverlay visible={completing} />

        <Stepper active={active} mb="xl" size="sm">
          {STEPS.map((step, index) => (
            <Stepper.Step
              key={step.title}
              label={step.title}
              description={step.description}
              data-testid={`onboarding-stepper-step-${index}`}
            />
          ))}
        </Stepper>

        {active === 0 && (
          <Stack gap="sm">
            <Title order={4}>{t('onboarding.step1.title')}</Title>
            <Step1Form onNext={handleStep1Next} />
          </Stack>
        )}

        {active === 1 && (
          <Stack gap="sm">
            <Title order={4}>{t('onboarding.step2.title')}</Title>
            <Step2Form onNext={handleStep2Next} />
          </Stack>
        )}

        {active === 2 && (
          <Stack gap="sm">
            <Title order={4}>{t('onboarding.step3.title')}</Title>
            <Step3Form onNext={handleStep3Next} onSkip={handleStep3Skip} />
          </Stack>
        )}

        {active === 3 && (
          <Stack gap="sm">
            <Title order={4}>{t('onboarding.step4.title')}</Title>
            <Step4Form
              onComplete={handleFinish}
              onSkip={handleFinish}
              clientWasAdded={clientWasAdded}
            />
          </Stack>
        )}
      </Box>
    </Modal>
  );
}
