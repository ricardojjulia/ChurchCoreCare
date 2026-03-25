import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { Stack, Title, Paper, Group, Badge, SimpleGrid, TextInput, Select, Textarea, Checkbox, Button, Text } from '@mantine/core';
import { createClientContact, updateClientContact, deleteClientContact } from '../../../lib/clientApi.js';

const RELATIONSHIP_OPTIONS = ['spouse', 'parent', 'child', 'sibling', 'friend', 'guardian', 'attorney', 'case manager', 'other'].map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }));
const CONTACT_TYPE_OPTIONS  = ['emergency', 'guardian', 'other'].map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));

function emptyContact(isMinor) {
  return { _key: Math.random(), id: null, contact_type: isMinor ? 'guardian' : 'emergency', name: '', relationship: '', phone: '', email: '', is_primary: false, has_legal_auth: false, notes: '' };
}

function ContactCard({ contact, clientId, isMinor, onSaved, onDeleted, onSetPrimary }) {
  const [form, setForm] = useState({
    contact_type:  contact.contact_type  ?? (isMinor ? 'guardian' : 'emergency'),
    name:          contact.name          ?? '',
    relationship:  contact.relationship  ?? '',
    phone:         contact.phone         ?? '',
    email:         contact.email         ?? '',
    is_primary:    contact.is_primary    ?? false,
    has_legal_auth:contact.has_legal_auth ?? false,
    notes:         contact.notes         ?? '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, phone: form.phone.trim(), email: form.email.trim() || null, name: form.name.trim(), notes: form.notes.trim() || null, is_primary: form.is_primary ? 1 : 0, has_legal_auth: form.has_legal_auth ? 1 : 0 };
      const result = contact.id ? await updateClientContact(clientId, contact.id, data) : await createClientContact(clientId, data);
      notifications.show({ title: 'Saved', message: 'Contact saved.', color: 'green' });
      onSaved(result.item ?? result);
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!contact.id) { onDeleted(contact._key); return; }
    if (!confirm(`Remove ${contact.name || 'this contact'}?`)) return;
    try {
      await deleteClientContact(clientId, contact.id);
      onDeleted(contact._key);
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  return (
    <Paper withBorder radius="md" p="md" style={{ background: form.is_primary ? 'var(--mantine-color-blue-0)' : undefined }}>
      <Group justify="flex-end" mb="xs" gap="xs">
        {form.is_primary    && <Badge color="blue"  variant="filled" size="xs">Primary</Badge>}
        {form.has_legal_auth && <Badge color="green" variant="filled" size="xs">PHI Auth</Badge>}
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <Select label="Contact Type" data={CONTACT_TYPE_OPTIONS} value={form.contact_type} onChange={(v) => set('contact_type', v ?? 'emergency')} />
        <TextInput label="Full Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <Select label="Relationship" data={[{ value: '', label: '— Select —' }, ...RELATIONSHIP_OPTIONS]} value={form.relationship} onChange={(v) => set('relationship', v ?? '')} />
        <TextInput label="Phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <TextInput label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
      </SimpleGrid>
      <Textarea label="Notes" rows={2} mt="sm" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      <Group gap="lg" mt="sm">
        <Checkbox label="Primary Contact" checked={!!form.is_primary} onChange={(e) => { set('is_primary', e.currentTarget.checked); if (e.currentTarget.checked) onSetPrimary(contact._key); }} />
        <Checkbox label="Authorized to receive PHI" checked={!!form.has_legal_auth} onChange={(e) => set('has_legal_auth', e.currentTarget.checked)} />
      </Group>
      <Group mt="sm" gap="xs">
        <Button size="xs" loading={saving} onClick={handleSave}>Save Contact</Button>
        <Button size="xs" color="red" variant="light" onClick={handleDelete}>Remove</Button>
      </Group>
    </Paper>
  );
}

export default function ContactsTab({ client, clientId }) {
  const isMinor = !!client.is_minor;
  const [contacts, setContacts] = useState((client.contacts ?? []).map((c) => ({ ...c, _key: Math.random() })));

  const handleAdd = () => setContacts((prev) => [...prev, emptyContact(isMinor)]);

  const handleSaved = (key, saved) => {
    setContacts((prev) => prev.map((c) => c._key === key ? { ...saved, _key: key } : c));
  };

  const handleDeleted = (key) => setContacts((prev) => prev.filter((c) => c._key !== key));

  const handleSetPrimary = (key) => {
    setContacts((prev) => prev.map((c) => ({ ...c, is_primary: c._key === key })));
  };

  const sorted = [...contacts].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

  return (
    <Stack gap="md" maw={900}>
      <Title order={4}>{isMinor ? 'Guardian & Emergency Contacts' : 'Emergency Contacts'}</Title>
      {sorted.length === 0 && <Text c="dimmed" fz="sm">No contacts on file.</Text>}
      {sorted.map((contact) => (
        <ContactCard
          key={contact._key}
          contact={contact}
          clientId={clientId}
          isMinor={isMinor}
          onSaved={(saved) => handleSaved(contact._key, saved)}
          onDeleted={handleDeleted}
          onSetPrimary={handleSetPrimary}
        />
      ))}
      <Button variant="outline" size="xs" onClick={handleAdd}>+ Add Emergency Contact</Button>
    </Stack>
  );
}
