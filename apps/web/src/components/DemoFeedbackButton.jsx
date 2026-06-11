import { useState } from 'react';
import { ActionIcon, Button, Group, Modal, Select, Stack, Textarea, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { MessageSquareWarning } from 'lucide-react';
import { useDemoSession } from '../lib/demoFeedbackContext.jsx';

const CATEGORIES = [
  { value: 'BUG', label: 'Bug' },
  { value: 'ERROR', label: 'Error' },
  { value: 'UNEXPECTED_RESULT', label: 'Unexpected result' },
  { value: 'IMPROVEMENT', label: 'Improvement idea' },
];

export default function DemoFeedbackButton() {
  const { enabled, reportFeedback } = useDemoSession();
  const [opened, setOpened] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({
    initialValues: { category: '', note: '' },
    validate: {
      category: (value) => value ? null : 'Choose a category',
      note: (value) => value.length <= 2_000 ? null : 'Note must be 2,000 characters or fewer',
    },
  });

  if (!enabled) return null;

  const submit = form.onSubmit(async (values) => {
    setSubmitting(true);
    try {
      await reportFeedback({
        category: values.category,
        note: values.note.trim() || null,
      });
      notifications.show({
        color: 'green',
        title: 'Feedback received',
        message: 'Thank you. Platform staff can now review this report.',
      });
      form.reset();
      setOpened(false);
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Feedback not sent',
        message: error.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <>
      <Tooltip label="Report demo feedback" position="left">
        <ActionIcon
          aria-label="Report demo feedback"
          color="indigo"
          radius="xl"
          size="xl"
          onClick={() => setOpened(true)}
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            zIndex: 300,
            boxShadow: 'var(--mantine-shadow-md)',
          }}
        >
          <MessageSquareWarning size={22} />
        </ActionIcon>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Demo feedback"
        centered
      >
        <form onSubmit={submit}>
          <Stack>
            <Select
              required
              label="What would you like to report?"
              data={CATEGORIES}
              {...form.getInputProps('category')}
            />
            <Textarea
              label="Notes"
              description="Do not enter real client information or PHI."
              placeholder="Describe what happened or what could be improved."
              minRows={5}
              maxLength={2000}
              {...form.getInputProps('note')}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setOpened(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Send feedback
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
