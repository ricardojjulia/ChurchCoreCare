import { useForm } from '@mantine/form';
import { Modal, Stack, Select, NumberInput, Textarea, TextInput, Button, Group } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { csrfHeaders } from '../../lib/csrf.js';

export const AACC_CATEGORIES = [
  { value: 'clinical_training',             label: 'Clinical Training' },
  { value: 'faith_integration',             label: 'Faith Integration' },
  { value: 'ethics_and_law',                label: 'Ethics & Law' },
  { value: 'supervision',                   label: 'Supervision' },
  { value: 'personal_spiritual_development',label: 'Personal / Spiritual Development' },
  { value: 'specialty_training',            label: 'Specialty Training' },
  { value: 'self_care',                     label: 'Self-Care' },
];

export default function AaccCeuModal({ opened, onClose, staffId, onSaved }) {
  const form = useForm({
    initialValues: {
      category: '',
      hours: '',
      entryDate: null,
      provider: '',
      description: '',
    },
    validate: {
      category:  (v) => (v ? null : 'Category is required'),
      hours:     (v) => {
        const n = Number(v);
        if (!v && v !== 0) return 'Duration is required';
        if (n < 0.25) return 'Minimum 0.25 hours (15 min)';
        if (n > 8)    return 'Maximum 8 hours per entry';
        return null;
      },
      entryDate: (v) => (v ? null : 'Date of training is required'),
    },
  });

  const handleSubmit = async (values) => {
    try {
      const durationMinutes = Math.round(Number(values.hours) * 60);
      const entryDate = values.entryDate instanceof Date
        ? values.entryDate.toISOString().slice(0, 10)
        : values.entryDate;

      const res = await fetch(`/api/v1/staff/${encodeURIComponent(staffId)}/aacc-ceu/entries`, {
        method: 'POST',
        headers: csrfHeaders(),
        body: JSON.stringify({
          category: values.category,
          durationMinutes,
          entryDate,
          provider:    values.provider.trim()    || null,
          description: values.description.trim() || null,
          entryType:   'standalone',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed: ${res.status}`);
      }

      notifications.show({ title: 'Saved', message: 'AACC CEU entry added.', color: 'teal' });
      form.reset();
      onSaved?.();
      onClose();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add AACC CEU Entry"
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Select
            label="Category"
            placeholder="Select a category"
            data={AACC_CATEGORIES}
            required
            {...form.getInputProps('category')}
          />
          <NumberInput
            label="Duration (hours)"
            description="Enter hours (e.g. 1.5 = 90 min). Min 0.25, max 8."
            placeholder="1.5"
            min={0.25}
            max={8}
            step={0.25}
            decimalScale={2}
            required
            {...form.getInputProps('hours')}
          />
          <DateInput
            label="Date of Training"
            placeholder="Pick a date"
            required
            clearable
            {...form.getInputProps('entryDate')}
          />
          <TextInput
            label="Provider / Sponsor"
            placeholder="Conference, organization, or course provider (optional)"
            {...form.getInputProps('provider')}
          />
          <Textarea
            label="Description"
            placeholder="Brief description of the training (optional)"
            minRows={2}
            autosize
            maxLength={2000}
            {...form.getInputProps('description')}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" loading={form.submitting}>Save Entry</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
