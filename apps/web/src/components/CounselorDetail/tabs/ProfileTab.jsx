import { useState } from 'react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { TextInput, Select, Textarea, Button, Group, Stack, SimpleGrid, Title, Text, Divider } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { updateStaffUser } from '../../../lib/clientApi.js';
import { csrfHeaders } from '../../../lib/csrf.js';

const AACC_CREDENTIAL_OPTIONS = [
  { value: '',             label: 'Not tracking AACC CEUs' },
  { value: 'bcpcc',        label: 'BCPCC' },
  { value: 'ncca_fellow',  label: 'NCCA Fellow' },
  { value: 'ncca_diplomate', label: 'NCCA Diplomate' },
];

const ROLE_OPTIONS = [
  { value: 'counselor',        label: 'Counselor' },
  { value: 'intern',           label: 'Intern' },
  { value: 'practice_admin',   label: 'Practice Admin' },
  { value: 'practice_owner',   label: 'Practice Owner' },
  { value: 'scheduler_biller', label: 'Scheduler / Biller' },
  { value: 'platform_admin',   label: 'Platform Admin' },
];

const LICENSE_OPTIONS = [
  { value: '',                  label: '— none —' },
  { value: 'lmft',              label: 'LMFT' },
  { value: 'lpc',               label: 'LPC' },
  { value: 'lcsw',              label: 'LCSW' },
  { value: 'psychologist',      label: 'Psychologist' },
  { value: 'pastoral_counselor',label: 'Pastoral Counselor' },
  { value: 'ordained_minister', label: 'Ordained Minister' },
  { value: 'chaplain',          label: 'Chaplain' },
  { value: 'other',             label: 'Other' },
  { value: 'none',              label: 'None' },
];

const SUPERVISION_OPTIONS = [
  { value: 'not_required', label: 'Not Required' },
  { value: 'required',     label: 'Required' },
  { value: 'active',       label: 'Active' },
  { value: 'completed',    label: 'Completed' },
];

export default function ProfileTab({ counselor, staffId, currentUser }) {
  const isAdmin = ['platform_admin', 'practice_owner', 'practice_admin'].includes(currentUser?.role);
  const isSelf  = currentUser?.staffMemberId === staffId || currentUser?.staffId === staffId;

  const form = useForm({
    initialValues: {
      firstName:          counselor?.firstName         ?? '',
      lastName:           counselor?.lastName          ?? '',
      role:               counselor?.role              ?? 'counselor',
      licenseType:        counselor?.licenseType       ?? '',
      supervisionStatus:  counselor?.supervisionStatus ?? 'not_required',
      supervisingStaffId: counselor?.supervisingStaffId ?? '',
      bio:                counselor?.bio               ?? '',
    },
  });

  const handleSave = async (values) => {
    try {
      const payload = isAdmin
        ? {
            firstName:          values.firstName,
            lastName:           values.lastName,
            role:               values.role,
            licenseType:        values.licenseType || null,
            supervisionStatus:  values.supervisionStatus,
            supervisingStaffId: values.supervisingStaffId || null,
            bio:                values.bio || null,
          }
        : { bio: values.bio || null };
      await updateStaffUser(staffId, payload);
      notifications.show({ title: 'Saved', message: 'Profile saved.', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  const aaccForm = useForm({
    initialValues: {
      credentialType: counselor?.aaccCredentialType ?? '',
      cycleStartDate: counselor?.aaccCycleStartDate ? new Date(counselor.aaccCycleStartDate) : null,
    },
    validate: {
      cycleStartDate: (v, values) =>
        values.credentialType && !v ? 'Cycle start date is required when a credential type is selected' : null,
    },
  });

  const handleAaccSave = async (values) => {
    try {
      const cycleStartDate = values.cycleStartDate instanceof Date
        ? values.cycleStartDate.toISOString().slice(0, 10)
        : values.cycleStartDate || null;

      const res = await fetch(`/api/v1/staff/${encodeURIComponent(staffId)}/aacc-credential`, {
        method: 'PATCH',
        headers: csrfHeaders(),
        body: JSON.stringify({
          credentialType: values.credentialType || null,
          cycleStartDate,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed: ${res.status}`);
      }

      notifications.show({ title: 'Saved', message: 'AACC credential updated.', color: 'teal' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  if (!isAdmin && !isSelf) {
    return <Text c="dimmed" p="md">You do not have permission to view this profile.</Text>;
  }

  return (
    <Stack gap="lg" maw={800}>
      <form onSubmit={form.onSubmit(handleSave)}>
        <Stack gap="md">
          <Title order={4} fz="sm" tt="uppercase" c="dimmed">Basic Information</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput label="First Name" disabled={!isAdmin} {...form.getInputProps('firstName')} />
            <TextInput label="Last Name"  disabled={!isAdmin} {...form.getInputProps('lastName')} />
            <Select label="Role"               data={ROLE_OPTIONS}        disabled={!isAdmin} {...form.getInputProps('role')} />
            <Select label="License Type (legacy)" data={LICENSE_OPTIONS}  disabled={!isAdmin} {...form.getInputProps('licenseType')} />
            <Select label="Supervision Status" data={SUPERVISION_OPTIONS} disabled={!isAdmin} {...form.getInputProps('supervisionStatus')} />
            <TextInput label="Supervising Staff ID" disabled={!isAdmin} placeholder="Leave blank if not applicable" {...form.getInputProps('supervisingStaffId')} />
          </SimpleGrid>

          <Title order={4} fz="sm" tt="uppercase" c="dimmed" mt="sm">Professional Bio</Title>
          <Textarea
            rows={5}
            disabled={!isAdmin && !isSelf}
            placeholder="Professional biography visible within the practice…"
            {...form.getInputProps('bio')}
          />

          {(isAdmin || isSelf) && (
            <Group>
              <Button type="submit" loading={form.submitting}>Save Profile</Button>
            </Group>
          )}
        </Stack>
      </form>

      {(isAdmin || isSelf) && (
        <>
          <Divider />
          <form onSubmit={aaccForm.onSubmit(handleAaccSave)}>
            <Stack gap="md">
              <div>
                <Title order={4} fz="sm" tt="uppercase" c="dimmed">AACC Credential</Title>
                <Text size="xs" c="dimmed" mt={2}>
                  Configure which AACC credential cycle to track for continuing education hours.
                </Text>
              </div>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Select
                  label="Credential Type"
                  data={AACC_CREDENTIAL_OPTIONS}
                  {...aaccForm.getInputProps('credentialType')}
                />
                <DateInput
                  label="Cycle Start Date"
                  placeholder="Pick the cycle start date"
                  clearable
                  disabled={!aaccForm.values.credentialType}
                  {...aaccForm.getInputProps('cycleStartDate')}
                />
              </SimpleGrid>
              <Group>
                <Button type="submit" loading={aaccForm.submitting}>Save AACC Credential</Button>
              </Group>
            </Stack>
          </form>
        </>
      )}
    </Stack>
  );
}
