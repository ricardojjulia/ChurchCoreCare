import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Stack, Title, Paper, Group, Badge, SimpleGrid, TextInput, Select, Textarea,
  Checkbox, Button, Text,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  createClientDiagnosis, updateClientDiagnosis, deleteClientDiagnosis,
  createClientMedication, updateClientMedication, deleteClientMedication,
  createClientAllergy,    updateClientAllergy,    deleteClientAllergy,
} from '../../../lib/clientApi.js';

function strToDate(s) { if (!s) return null; const d = new Date(s); return isNaN(d) ? null : d; }
function dateToStr(d) { return d ? d.toISOString().slice(0, 10) : null; }

// ── Diagnoses ─────────────────────────────────────────────────────────────────

function DiagnosisRow({ row, onChange, onDelete }) {
  return (
    <Paper withBorder radius="sm" p="sm" style={{ background: row.is_primary ? 'var(--mantine-color-blue-0)' : undefined }}>
      <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="xs">
        <Select label="System" data={[{ value: 'DSM-5', label: 'DSM-5' }, { value: 'ICD-10', label: 'ICD-10' }, { value: 'ICD-11', label: 'ICD-11' }]} value={row.code_system} onChange={(v) => onChange('code_system', v ?? 'DSM-5')} />
        <TextInput label="Code"        value={row.code}        placeholder="F41.1" onChange={(e) => onChange('code',        e.target.value)} />
        <TextInput label="Description" value={row.description}                     onChange={(e) => onChange('description', e.target.value)} />
        <DateInput label="Onset Date"  value={strToDate(row.onset_date)} valueFormat="YYYY-MM-DD" onChange={(v) => onChange('onset_date', dateToStr(v))} />
        <Select label="Status" data={[{ value: 'active', label: 'Active' }, { value: 'resolved', label: 'Resolved' }, { value: 'rule_out', label: 'Rule Out' }, { value: 'deferred', label: 'Deferred' }]} value={row.status} onChange={(v) => onChange('status', v ?? 'active')} />
      </SimpleGrid>
      <TextInput label="Notes" mt="xs" value={row.notes} onChange={(e) => onChange('notes', e.target.value)} />
      <Group justify="space-between" mt="xs">
        <Group gap="xs">
          <Checkbox label="Primary Diagnosis" checked={!!row.is_primary} onChange={(e) => onChange('is_primary', e.currentTarget.checked)} />
          {row.is_primary && <Badge size="xs" color="blue">PRIMARY</Badge>}
        </Group>
        <Button size="compact-xs" color="red" variant="subtle" onClick={onDelete}>Remove</Button>
      </Group>
    </Paper>
  );
}

function DiagnosesList({ clientId, initialDiagnoses }) {
  const sorted = [...(initialDiagnoses ?? [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  const [rows,    setRows]    = useState(sorted.map((d) => ({ ...d, _key: Math.random(), _dirty: false, _deleted: false })));
  const [saving,  setSaving]  = useState(false);

  const handleChange = (key, field, value) => {
    setRows((prev) => {
      let updated = prev.map((r) => r._key === key ? { ...r, [field]: value, _dirty: true } : r);
      if (field === 'is_primary' && value) updated = updated.map((r) => r._key === key ? r : { ...r, is_primary: false, _dirty: true });
      return updated;
    });
  };

  const handleDelete = (key) => setRows((prev) => prev.map((r) => r._key === key ? { ...r, _deleted: true } : r));
  const handleAdd    = () => setRows((prev) => [...prev, { _key: Math.random(), id: null, code_system: 'DSM-5', code: '', description: '', onset_date: '', status: 'active', is_primary: false, notes: '', _dirty: true, _deleted: false }]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const r of rows) {
        if (r._deleted) { if (r.id) await deleteClientDiagnosis(clientId, r.id); }
        else if (r._dirty) {
          const data = { code_system: r.code_system, code: r.code.trim(), description: r.description.trim(), onset_date: r.onset_date || null, status: r.status, is_primary: r.is_primary ? 1 : 0, notes: r.notes.trim() || null };
          if (r.id) { await updateClientDiagnosis(clientId, r.id, data); }
          else { const result = await createClientDiagnosis(clientId, data); r.id = result.item?.id ?? result.id; }
        }
      }
      setRows((prev) => prev.filter((r) => !r._deleted).map((r) => ({ ...r, _dirty: false })));
      notifications.show({ title: 'Saved', message: 'Diagnoses saved.', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const visible = rows.filter((r) => !r._deleted);
  return (
    <Stack gap="sm">
      <Title order={4} fz="sm" tt="uppercase" c="dimmed">Diagnoses</Title>
      {visible.length === 0 && <Text c="dimmed" fz="sm">No diagnoses on file.</Text>}
      {visible.map((row) => <DiagnosisRow key={row._key} row={row} onChange={(f, v) => handleChange(row._key, f, v)} onDelete={() => handleDelete(row._key)} />)}
      <Group gap="xs">
        <Button variant="outline" size="xs" onClick={handleAdd}>+ Add Diagnosis</Button>
        <Button size="xs" loading={saving} onClick={handleSave}>Save All Diagnoses</Button>
      </Group>
    </Stack>
  );
}

// ── Medications ───────────────────────────────────────────────────────────────

function MedicationRow({ row, onChange, onDelete }) {
  return (
    <Paper withBorder radius="sm" p="sm" style={{ opacity: row.is_active ? 1 : 0.75 }}>
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
        <TextInput label="Medication Name" value={row.med_name}  onChange={(e) => onChange('med_name',  e.target.value)} />
        <TextInput label="Dose"            value={row.dose}      placeholder="50 mg"    onChange={(e) => onChange('dose',      e.target.value)} />
        <TextInput label="Frequency"       value={row.frequency} placeholder="once daily" onChange={(e) => onChange('frequency', e.target.value)} />
        <Select label="Route" data={[{ value: 'oral', label: 'Oral' }, { value: 'IM', label: 'IM' }, { value: 'topical', label: 'Topical' }, { value: 'other', label: 'Other' }]} value={row.route} onChange={(v) => onChange('route', v ?? 'oral')} />
        <TextInput label="Prescriber"    value={row.prescriber} onChange={(e) => onChange('prescriber', e.target.value)} />
        <DateInput label="Start Date" valueFormat="YYYY-MM-DD" value={strToDate(row.start_date)} onChange={(v) => onChange('start_date', dateToStr(v))} />
        <DateInput label="End Date"   valueFormat="YYYY-MM-DD" value={strToDate(row.end_date)}   onChange={(v) => onChange('end_date',   dateToStr(v))} />
        <TextInput label="Reason / Indication" value={row.reason} onChange={(e) => onChange('reason', e.target.value)} />
      </SimpleGrid>
      <TextInput label="Notes" mt="xs" value={row.notes} onChange={(e) => onChange('notes', e.target.value)} />
      <Group justify="space-between" mt="xs">
        <Checkbox label="Currently Active" checked={!!row.is_active} onChange={(e) => onChange('is_active', e.currentTarget.checked)} />
        <Button size="compact-xs" color="red" variant="subtle" onClick={onDelete}>Remove</Button>
      </Group>
    </Paper>
  );
}

function MedicationsList({ clientId, initialMedications }) {
  const sorted = [...(initialMedications ?? [])].sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0));
  const [rows,             setRows]             = useState(sorted.map((m) => ({ ...m, _key: Math.random(), _dirty: false, _deleted: false })));
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  const [saving,           setSaving]           = useState(false);

  const handleChange = (key, field, value) => setRows((prev) => prev.map((r) => r._key === key ? { ...r, [field]: value, _dirty: true } : r));
  const handleDelete = (key) => setRows((prev) => prev.map((r) => r._key === key ? { ...r, _deleted: true } : r));
  const handleAdd    = () => setRows((prev) => [...prev, { _key: Math.random(), id: null, med_name: '', dose: '', frequency: '', route: 'oral', prescriber: '', start_date: '', end_date: '', is_active: true, reason: '', notes: '', _dirty: true, _deleted: false }]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const r of rows) {
        if (r._deleted) { if (r.id) await deleteClientMedication(clientId, r.id); }
        else if (r._dirty) {
          const data = { med_name: r.med_name.trim(), dose: r.dose.trim() || null, frequency: r.frequency.trim() || null, route: r.route || null, prescriber: r.prescriber.trim() || null, start_date: r.start_date || null, end_date: r.end_date || null, is_active: r.is_active ? 1 : 0, reason: r.reason.trim() || null, notes: r.notes.trim() || null };
          if (r.id) { await updateClientMedication(clientId, r.id, data); }
          else { const result = await createClientMedication(clientId, data); r.id = result.item?.id ?? result.id; }
        }
      }
      setRows((prev) => prev.filter((r) => !r._deleted).map((r) => ({ ...r, _dirty: false })));
      notifications.show({ title: 'Saved', message: 'Medications saved.', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const visible      = rows.filter((r) => !r._deleted);
  const active       = visible.filter((r) => r.is_active);
  const discontinued = visible.filter((r) => !r.is_active);

  return (
    <Stack gap="sm">
      <Title order={4} fz="sm" tt="uppercase" c="dimmed">Medications</Title>
      {active.length === 0 && <Text c="dimmed" fz="sm">No active medications.</Text>}
      {active.map((row) => <MedicationRow key={row._key} row={row} onChange={(f, v) => handleChange(row._key, f, v)} onDelete={() => handleDelete(row._key)} />)}
      {discontinued.length > 0 && (
        <Stack gap="xs">
          <Button variant="subtle" size="xs" onClick={() => setShowDiscontinued((v) => !v)}>
            {showDiscontinued ? 'Hide' : 'Show'} Discontinued ({discontinued.length})
          </Button>
          {showDiscontinued && discontinued.map((row) => <MedicationRow key={row._key} row={row} onChange={(f, v) => handleChange(row._key, f, v)} onDelete={() => handleDelete(row._key)} />)}
        </Stack>
      )}
      <Group gap="xs">
        <Button variant="outline" size="xs" onClick={handleAdd}>+ Add Medication</Button>
        <Button size="xs" loading={saving} onClick={handleSave}>Save All Medications</Button>
      </Group>
    </Stack>
  );
}

// ── Allergies ─────────────────────────────────────────────────────────────────

function AllergyRow({ row, onChange, onDelete }) {
  return (
    <Paper withBorder radius="sm" p="sm">
      <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="xs">
        <TextInput label="Substance" value={row.substance} onChange={(e) => onChange('substance', e.target.value)} />
        <TextInput label="Reaction"  value={row.reaction}  onChange={(e) => onChange('reaction',  e.target.value)} />
        <Select label="Severity" data={[{ value: 'mild', label: 'Mild' }, { value: 'moderate', label: 'Moderate' }, { value: 'severe', label: 'Severe' }, { value: 'life_threatening', label: 'Life-Threatening' }, { value: 'unknown', label: 'Unknown' }]} value={row.severity} onChange={(v) => onChange('severity', v ?? 'unknown')} />
        <Select label="Type" data={[{ value: 'drug', label: 'Drug' }, { value: 'food', label: 'Food' }, { value: 'environmental', label: 'Environmental' }, { value: 'other', label: 'Other' }]} value={row.allergy_type} onChange={(v) => onChange('allergy_type', v ?? 'drug')} />
        <DateInput label="Onset Date" valueFormat="YYYY-MM-DD" value={strToDate(row.onset_date)} onChange={(v) => onChange('onset_date', dateToStr(v))} />
      </SimpleGrid>
      <Group justify="space-between" mt="xs">
        <Checkbox label="Active" checked={!!row.is_active} onChange={(e) => onChange('is_active', e.currentTarget.checked)} />
        <Button size="compact-xs" color="red" variant="subtle" onClick={onDelete}>Remove</Button>
      </Group>
    </Paper>
  );
}

function AllergiesList({ clientId, initialAllergies }) {
  const [rows,             setRows]             = useState((initialAllergies ?? []).map((a) => ({ ...a, _key: Math.random(), _dirty: false, _deleted: false })));
  const [noKnownAllergies, setNoKnownAllergies] = useState(false);
  const [saving,           setSaving]           = useState(false);

  const handleChange = (key, field, value) => setRows((prev) => prev.map((r) => r._key === key ? { ...r, [field]: value, _dirty: true } : r));
  const handleDelete = (key) => setRows((prev) => prev.map((r) => r._key === key ? { ...r, _deleted: true } : r));
  const handleAdd    = () => { if (!noKnownAllergies) setRows((prev) => [...prev, { _key: Math.random(), id: null, substance: '', reaction: '', severity: 'unknown', allergy_type: 'drug', onset_date: '', is_active: true, _dirty: true, _deleted: false }]); };
  const handleNka    = (checked) => { setNoKnownAllergies(checked); if (checked) setRows((prev) => prev.map((r) => ({ ...r, _deleted: true }))); };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const r of rows) {
        if (r._deleted) { if (r.id) await deleteClientAllergy(clientId, r.id); }
        else if (r._dirty) {
          const data = { substance: r.substance.trim(), reaction: r.reaction.trim() || null, severity: r.severity, allergy_type: r.allergy_type, onset_date: r.onset_date || null, is_active: r.is_active ? 1 : 0 };
          if (r.id) { await updateClientAllergy(clientId, r.id, data); }
          else { const result = await createClientAllergy(clientId, data); r.id = result.item?.id ?? result.id; }
        }
      }
      setRows((prev) => prev.filter((r) => !r._deleted).map((r) => ({ ...r, _dirty: false })));
      notifications.show({ title: 'Saved', message: 'Allergies saved.', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const visible = rows.filter((r) => !r._deleted);
  return (
    <Stack gap="sm">
      <Title order={4} fz="sm" tt="uppercase" c="dimmed">Allergies</Title>
      <Checkbox label="No Known Allergies (NKA)" checked={noKnownAllergies} onChange={(e) => handleNka(e.currentTarget.checked)} />
      {!noKnownAllergies && (
        <>
          {visible.length === 0 && <Text c="dimmed" fz="sm">No allergies on file.</Text>}
          {visible.map((row) => <AllergyRow key={row._key} row={row} onChange={(f, v) => handleChange(row._key, f, v)} onDelete={() => handleDelete(row._key)} />)}
        </>
      )}
      <Group gap="xs">
        {!noKnownAllergies && <Button variant="outline" size="xs" onClick={handleAdd}>+ Add Allergy</Button>}
        <Button size="xs" loading={saving} onClick={handleSave}>Save All Allergies</Button>
      </Group>
    </Stack>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function DiagnosesTab({ client, clientId }) {
  return (
    <Stack gap="xl" maw={900}>
      <DiagnosesList  clientId={clientId} initialDiagnoses={client.diagnoses  ?? []} />
      <MedicationsList clientId={clientId} initialMedications={client.medications ?? []} />
      <AllergiesList   clientId={clientId} initialAllergies={client.allergies  ?? []} />
    </Stack>
  );
}
