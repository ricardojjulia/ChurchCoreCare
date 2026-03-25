import { useEffect, useMemo } from 'react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  Modal, Table, Button, TextInput, PasswordInput, Select, Group, Stack,
  Text, Badge, Paper, Title, Loader,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  fetchStaff, createStaffUser, updateStaffUser, runStaffAccountAction,
} from '../lib/clientApi.js';
import { useState } from 'react';

const COUNSELOR_ROLE_OPTIONS = [
  { value: 'counselor', label: 'Counselor' },
  { value: 'intern',    label: 'Intern' },
];

const LICENSE_OPTIONS = [
  { value: 'none',               label: 'None' },
  { value: 'lpc',                label: 'LPC' },
  { value: 'lmft',               label: 'LMFT' },
  { value: 'lcsw',               label: 'LCSW' },
  { value: 'psychologist',       label: 'Psychologist' },
  { value: 'pastoral_counselor', label: 'Pastoral Counselor' },
  { value: 'ordained_minister',  label: 'Ordained Minister' },
  { value: 'chaplain',           label: 'Chaplain' },
  { value: 'intern',             label: 'Intern' },
  { value: 'other',              label: 'Other' },
];

const SUPERVISION_OPTIONS = [
  { value: 'not_required', label: 'Not Required' },
  { value: 'required',     label: 'Required' },
  { value: 'supervised',   label: 'Supervised' },
  { value: 'supervisor',   label: 'Supervisor' },
];

const ROLE_COLORS = {
  counselor: 'green',
  intern:    'yellow',
};

const COUNSELOR_ROLES = new Set(['counselor', 'intern']);

export default function CounselorMaintenance({ userRole, onViewCounselor }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const canManageUsers = useMemo(
    () => ['platform_admin', 'practice_owner', 'practice_admin'].includes(userRole || ''),
    [userRole],
  );

  const form = useForm({
    initialValues: {
      firstName: '', lastName: '', email: '', role: 'counselor',
      licenseType: 'pastoral_counselor', supervisionStatus: 'not_required', initialPassword: '',
    },
    validate: {
      firstName: (v) => v.trim() ? null : 'First name is required',
      lastName:  (v) => v.trim() ? null : 'Last name is required',
      email:     (v, vals) => (!editing && !v.trim()) ? 'Email is required' : null,
    },
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const payload = await fetchStaff();
      const all = Array.isArray(payload?.items) ? payload.items : [];
      setItems(all.filter((s) => COUNSELOR_ROLES.has(s.role)));
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message || 'Unable to load counselors', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStaff(); }, []);

  const openCreate = () => {
    setEditing(null);
    form.reset();
    open();
  };

  const openEdit = (item) => {
    setEditing(item);
    form.setValues({
      firstName: item.firstName || '', lastName: item.lastName || '',
      email: item.email || '', role: item.role || 'counselor',
      licenseType: item.licenseType || 'pastoral_counselor',
      supervisionStatus: item.supervisionStatus || 'not_required',
      initialPassword: '',
    });
    open();
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (editing) {
        await updateStaffUser(editing.id, {
          firstName: values.firstName, lastName: values.lastName,
          role: values.role, licenseType: values.licenseType,
          supervisionStatus: values.supervisionStatus,
        });
        notifications.show({ title: 'Saved', message: 'Counselor updated.', color: 'green' });
        close();
      } else {
        const result = await createStaffUser({
          firstName: values.firstName, lastName: values.lastName,
          email: values.email, role: values.role,
          licenseType: values.licenseType, supervisionStatus: values.supervisionStatus,
          initialPassword: values.initialPassword || undefined,
        });
        const tempPassword = result?.accountProvisioning?.temporaryPassword;
        notifications.show({
          title: 'Counselor created',
          message: tempPassword
            ? `Temporary password for ${result.accountProvisioning.email}: ${tempPassword}`
            : 'Counselor created successfully.',
          color: 'green',
          autoClose: tempPassword ? false : 4000,
        });
        form.reset();
      }
      await loadStaff();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message || 'Unable to save counselor', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (staffId, actionLabel, action) => {
    if (!window.confirm(`${actionLabel} for this counselor?`)) return;
    try {
      const result = await runStaffAccountAction(staffId, action);
      await loadStaff();
      notifications.show({
        title: actionLabel,
        message: result?.generatedTemporaryPassword
          ? `Generated temporary password: ${result.generatedTemporaryPassword}`
          : `${actionLabel} completed.`,
        color: 'green',
        autoClose: result?.generatedTemporaryPassword ? false : 4000,
      });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message || `${actionLabel} failed`, color: 'red' });
    }
  };

  if (!canManageUsers) {
    return (
      <Paper p="md" radius="lg" withBorder>
        <Title order={2} fz="lg" mb="xs">Counselor Maintenance</Title>
        <Text c="dimmed">Admin access is required.</Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" radius="lg" withBorder component="section" aria-labelledby="cmTitle">
      <Group justify="space-between" mb="md">
        <Title order={2} fz="lg" id="cmTitle">Counselor Maintenance</Title>
        <Button onClick={openCreate}>New Counselor</Button>
      </Group>

      {loading ? (
        <Group justify="center" py="xl"><Loader size="sm" /></Group>
      ) : items.length === 0 ? (
        <Text c="dimmed">No counselors found.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>License Type</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Last Login</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>{item.firstName} {item.lastName}</Table.Td>
                <Table.Td>
                  <Badge color={ROLE_COLORS[item.role] || 'gray'} variant="light" size="sm">
                    {item.role}
                  </Badge>
                </Table.Td>
                <Table.Td fz="sm">{item.licenseType || '—'}</Table.Td>
                <Table.Td>{item.email || '—'}</Table.Td>
                <Table.Td>
                  <Badge color={item.accountLocked ? 'red' : 'green'} variant="light" size="sm">
                    {item.accountLocked ? 'Locked' : 'Active'}
                  </Badge>
                </Table.Td>
                <Table.Td fz="xs">
                  {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString() : '—'}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    {onViewCounselor && (
                      <Button size="xs" variant="filled" onClick={() => onViewCounselor(item.id)}>
                        View Profile
                      </Button>
                    )}
                    <Button size="xs" variant="default" onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                    <Button size="xs" variant="default"
                      onClick={() => runAction(item.id, 'Reset password', 'reset_password')}>
                      Reset Password
                    </Button>
                    <Button size="xs" variant="default"
                      onClick={() => runAction(item.id, 'Unlock account', 'unlock')}>
                      Unlock
                    </Button>
                    <Button size="xs" color="red" variant="light"
                      onClick={() => runAction(item.id, 'Deactivate account', 'deactivate')}>
                      Deactivate
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={opened} onClose={() => { if (!saving) close(); }} title={editing ? 'Edit Counselor' : 'Add Counselor'}>
        <form onSubmit={form.onSubmit(handleSave)}>
          <Stack gap="sm">
            <TextInput label="First name" required {...form.getInputProps('firstName')} />
            <TextInput label="Last name"  required {...form.getInputProps('lastName')} />
            <TextInput
              label="Email" type="email"
              required={!editing} disabled={Boolean(editing)}
              {...form.getInputProps('email')}
            />
            <Select label="Role"              data={COUNSELOR_ROLE_OPTIONS} {...form.getInputProps('role')} />
            <Select label="License type"      data={LICENSE_OPTIONS}        {...form.getInputProps('licenseType')} />
            <Select label="Supervision status" data={SUPERVISION_OPTIONS}   {...form.getInputProps('supervisionStatus')} />

            {!editing && (
              <PasswordInput
                label="Initial password (optional)"
                placeholder="Auto-generated if left blank"
                minLength={14}
                {...form.getInputProps('initialPassword')}
              />
            )}

            <Group justify="flex-end" mt="xs">
              <Button variant="default" onClick={close} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving}>Save</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Paper>
  );
}
