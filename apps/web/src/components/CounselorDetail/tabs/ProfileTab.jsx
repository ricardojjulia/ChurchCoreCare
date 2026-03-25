import { useState } from 'react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { TextInput, Select, Textarea, Button, Group, Stack, SimpleGrid, Title, Text } from '@mantine/core';
import { updateStaffUser } from '../../../lib/clientApi.js';

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
    </Stack>
  );
}
