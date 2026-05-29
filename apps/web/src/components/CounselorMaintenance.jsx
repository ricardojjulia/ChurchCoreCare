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
import { useI18n } from '../lib/i18nContext.jsx';

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
  const { t } = useI18n();
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
      firstName: (v) => v.trim() ? null : t('counselor.form.firstNameRequired'),
      lastName:  (v) => v.trim() ? null : t('counselor.form.lastNameRequired'),
      email:     (v, vals) => (!editing && !v.trim()) ? t('counselor.form.emailRequired') : null,
    },
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const payload = await fetchStaff();
      const all = Array.isArray(payload?.items) ? payload.items : [];
      setItems(all.filter((s) => COUNSELOR_ROLES.has(s.role)));
    } catch (err) {
      notifications.show({ title: t('state.error'), message: err.message || t('counselors.unableToLoad'), color: 'red' });
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
        notifications.show({ title: t('counselors.saved'), message: t('counselors.updatedMessage'), color: 'green' });
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
          title: t('counselors.createdTitle'),
          message: tempPassword
            ? t('counselor.tempPasswordNotice', { email: result.accountProvisioning.email, password: tempPassword })
            : t('counselor.createdSuccess'),
          color: 'green',
          autoClose: tempPassword ? false : 4000,
        });
        form.reset();
      }
      await loadStaff();
    } catch (err) {
      notifications.show({ title: t('state.error'), message: err.message || t('counselor.unableToSave'), color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (staffId, actionLabel, action) => {
    if (!window.confirm(t('counselor.confirmAction', { action: actionLabel }))) return;
    try {
      const result = await runStaffAccountAction(staffId, action);
      await loadStaff();
      notifications.show({
        title: actionLabel,
        message: result?.generatedTemporaryPassword
          ? t('counselor.generatedTempPassword', { password: result.generatedTemporaryPassword })
          : t('counselor.actionCompleted', { action: actionLabel }),
        color: 'green',
        autoClose: result?.generatedTemporaryPassword ? false : 4000,
      });
    } catch (err) {
      notifications.show({ title: t('state.error'), message: err.message || t('counselor.actionFailed', { action: actionLabel }), color: 'red' });
    }
  };

  if (!canManageUsers) {
    return (
      <Paper p="md" radius="lg" withBorder>
        <Title order={2} fz="lg" mb="xs">{t('counselors.title')}</Title>
        <Text c="dimmed">{t('counselors.adminRequired')}</Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" radius="lg" withBorder component="section" aria-labelledby="cmTitle">
      <Group justify="space-between" mb="md">
        <Title order={2} fz="lg" id="cmTitle">{t('counselors.title')}</Title>
        <Button onClick={openCreate}>{t('counselors.newCounselor')}</Button>
      </Group>

      {loading ? (
        <Group justify="center" py="xl"><Loader size="sm" /></Group>
      ) : items.length === 0 ? (
        <Text c="dimmed">{t('counselors.noneFound')}</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('table.name')}</Table.Th>
              <Table.Th>{t('table.role')}</Table.Th>
              <Table.Th>{t('table.licenseType')}</Table.Th>
              <Table.Th>{t('table.email')}</Table.Th>
              <Table.Th>{t('table.status')}</Table.Th>
              <Table.Th>{t('table.lastLogin')}</Table.Th>
              <Table.Th>{t('table.actions')}</Table.Th>
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
                    {item.accountLocked ? t('status.locked') : t('status.active')}
                  </Badge>
                </Table.Td>
                <Table.Td fz="xs">
                  {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString() : '—'}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    {onViewCounselor && (
                      <Button size="xs" variant="filled" onClick={() => onViewCounselor(item.id)}>
                        {t('actions.viewProfile')}
                      </Button>
                    )}
                    <Button size="xs" variant="default" onClick={() => openEdit(item)}>
                      {t('actions.edit')}
                    </Button>
                    <Button size="xs" variant="default"
                      onClick={() => runAction(item.id, 'Reset password', 'reset_password')}>
                      {t('actions.resetPassword')}
                    </Button>
                    <Button size="xs" variant="default"
                      onClick={() => runAction(item.id, 'Unlock account', 'unlock')}>
                      {t('actions.unlock')}
                    </Button>
                    <Button size="xs" color="red" variant="light"
                      onClick={() => runAction(item.id, 'Deactivate account', 'deactivate')}>
                      {t('actions.deactivate')}
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={opened} onClose={() => { if (!saving) close(); }} title={editing ? t('counselors.editTitle') : t('counselors.addTitle')}>
        <form onSubmit={form.onSubmit(handleSave)}>
          <Stack gap="sm">
            <TextInput label={t('counselors.form.firstName')} required {...form.getInputProps('firstName')} />
            <TextInput label={t('counselors.form.lastName')}  required {...form.getInputProps('lastName')} />
            <TextInput
              label={t('auth.email')} type="email"
              required={!editing} disabled={Boolean(editing)}
              {...form.getInputProps('email')}
            />
            <Select label={t('auth.roleLabel')}                   data={COUNSELOR_ROLE_OPTIONS} {...form.getInputProps('role')} />
            <Select label={t('counselors.form.licenseType')}      data={LICENSE_OPTIONS}        {...form.getInputProps('licenseType')} />
            <Select label={t('counselors.form.supervisionStatus')} data={SUPERVISION_OPTIONS}   {...form.getInputProps('supervisionStatus')} />

            {!editing && (
              <PasswordInput
                label={t('counselors.form.initialPassword')}
                placeholder={t('counselor.form.passwordPlaceholder')}
                minLength={14}
                {...form.getInputProps('initialPassword')}
              />
            )}

            <Group justify="flex-end" mt="xs">
              <Button variant="default" onClick={close} disabled={saving}>{t('actions.cancel')}</Button>
              <Button type="submit" loading={saving}>{t('actions.save')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Paper>
  );
}
