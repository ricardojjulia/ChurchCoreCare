import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Stack, Title, SimpleGrid, TextInput, PasswordInput, Select, Button, Group,
  Text, Paper, Divider, Alert,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useI18n } from '../../../lib/i18nContext.jsx';
import {
  patchClient, createClientPhone, updateClientPhone, deleteClientPhone,
  createClientAddress, updateClientAddress, deleteClientAddress,
  fetchStaff, fetchPortalProfile,
} from '../../../lib/clientApi.js';

const EMPLOYED = ['employed_full_time', 'employed_part_time', 'self_employed'];

function strToDate(s) { if (!s) return null; const d = new Date(s); return isNaN(d) ? null : d; }
function dateToStr(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
}

export default function DemographicsTab({ client, clientId }) {
  const { t } = useI18n();

  // Translated option arrays — built inside component so t() is in scope
  const STATUS_OPTIONS = [
    { value: 'active', label: t('status.active') },
    { value: 'waitlist', label: t('status.waitlist') },
    { value: 'inactive', label: t('status.inactive') },
    { value: 'discharged', label: t('status.discharged') },
  ];

  const LANGUAGE_OPTIONS = [
    'English', 'Spanish', 'French', 'Mandarin', 'Cantonese', 'Vietnamese',
    'Arabic', 'Korean', 'Tagalog', 'Portuguese', 'Russian', 'Haitian Creole', 'Other',
  ].map((l) => ({ value: l, label: l }));

  const MARITAL_OPTIONS = [
    { value: 'single', label: t('demographics.marital.single') },
    { value: 'married', label: t('demographics.marital.married') },
    { value: 'separated', label: t('demographics.marital.separated') },
    { value: 'divorced', label: t('demographics.marital.divorced') },
    { value: 'widowed', label: t('demographics.marital.widowed') },
    { value: 'partnered', label: t('demographics.marital.partnered') },
    { value: 'other', label: t('demographics.marital.other') },
  ];

  const EMPLOY_OPTIONS = [
    { value: 'employed_full_time', label: t('demographics.employ.employed_full_time') },
    { value: 'employed_part_time', label: t('demographics.employ.employed_part_time') },
    { value: 'self_employed', label: t('demographics.employ.self_employed') },
    { value: 'unemployed', label: t('demographics.employ.unemployed') },
    { value: 'student', label: t('demographics.employ.student') },
    { value: 'retired', label: t('demographics.employ.retired') },
    { value: 'disability', label: t('demographics.employ.disability') },
    { value: 'other', label: t('demographics.employ.other') },
  ];

  const PHONE_TYPE_OPTIONS = [
    { value: 'cell', label: t('demographics.phoneType.cell') },
    { value: 'home', label: t('demographics.phoneType.home') },
    { value: 'work', label: t('demographics.phoneType.work') },
    { value: 'fax', label: t('demographics.phoneType.fax') },
  ];

  const ADDR_TYPE_OPTIONS = [
    { value: 'primary', label: t('demographics.addrType.primary') },
    { value: 'mailing', label: t('demographics.addrType.mailing') },
    { value: 'other', label: t('demographics.addrType.other') },
  ];

  const BIO_SEX_OPTIONS = [
    { value: '', label: t('demographics.select.placeholder') },
    { value: 'male', label: t('demographics.sex.male') },
    { value: 'female', label: t('demographics.sex.female') },
    { value: 'intersex', label: t('demographics.sex.intersex') },
    { value: 'unknown', label: t('demographics.sex.unknown') },
  ];

  // Identity
  const [firstName,    setFirstName]    = useState(client.firstName    ?? '');
  const [middleName,   setMiddleName]   = useState(client.middleName   ?? '');
  const [lastName,     setLastName]     = useState(client.lastName     ?? '');
  const [preferredName,setPreferredName]= useState(client.preferredName ?? '');
  const [pronouns,     setPronouns]     = useState(client.pronouns     ?? '');
  const [dateOfBirth,  setDateOfBirth]  = useState(client.dateOfBirth || null);
  const [ssnLast4,     setSsnLast4]     = useState(client.ssnLast4     ?? '');
  const [status,       setStatus]       = useState(client.status       ?? 'active');
  const [idSaving,     setIdSaving]     = useState(false);

  // Demographics
  const [genderIdentity,      setGenderIdentity]      = useState(client.genderIdentity      ?? '');
  const [biologicalSex,       setBiologicalSex]       = useState(client.biologicalSex       ?? '');
  const [raceEthnicity,       setRaceEthnicity]       = useState(client.raceEthnicity       ?? '');
  const [maritalStatus,       setMaritalStatus]       = useState(client.maritalStatus       ?? '');
  const [languagePreference,  setLanguagePreference]  = useState(client.languagePreference  ?? 'English');
  const [employmentStatus,    setEmploymentStatus]    = useState(client.employmentStatus    ?? '');
  const [employerName,        setEmployerName]        = useState(client.employerName        ?? '');
  const [demoSaving,          setDemoSaving]          = useState(false);

  // Email
  const [email,        setEmail]        = useState(client.email ?? '');
  const [emailSaving,  setEmailSaving]  = useState(false);

  // Phones
  const initPhones = (client.phones ?? []).map((p) => ({ ...p, _key: Math.random(), _deleted: false, _dirty: false }));
  const [phones, setPhones] = useState(initPhones);
  const [phonesSaving, setPhonesSaving] = useState(false);

  // Addresses
  const initAddresses = (client.addresses ?? []).map((a) => ({ ...a, _key: Math.random(), _deleted: false, _dirty: false }));
  const [addresses, setAddresses] = useState(initAddresses);
  const [addrSaving, setAddrSaving] = useState(false);

  // Counselor assignment
  const [primaryCounselorId, setPrimaryCounselorId] = useState(client.primaryCounselorId ?? null);
  const [counselorOptions,   setCounselorOptions]   = useState([]);
  const [counselorSaving,    setCounselorSaving]    = useState(false);

  // Portal contact preferences (read-only, client-managed)
  const [portalProfile, setPortalProfile] = useState(null);

  useEffect(() => {
    fetchStaff()
      .then((data) => {
        const counselors = (data?.items ?? [])
          .filter((s) => s.role === 'counselor' || s.role === 'intern')
          .map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}${s.role === 'intern' ? ' (Intern)' : ''}` }));
        setCounselorOptions(counselors);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPortalProfile(clientId)
      .then((data) => setPortalProfile(data?.profile ?? data ?? null))
      .catch(() => setPortalProfile(null));
  }, [clientId]);

  const saveCounselor = async () => {
    setCounselorSaving(true);
    try {
      await patchClient(clientId, { primaryCounselorId: primaryCounselorId ?? null });
      notifications.show({ title: t('demographics.notify.saved'), message: t('demographics.notify.counselorSaved'), color: 'green' });
    } catch (err) {
      notifications.show({ title: t('demographics.notify.error'), message: err.message, color: 'red' });
    } finally { setCounselorSaving(false); }
  };

  const age = calcAge(dateOfBirth);

  const saveIdentity = async () => {
    setIdSaving(true);
    try {
      await patchClient(clientId, {
        firstName: firstName.trim(), middleName: middleName.trim(),
        lastName: lastName.trim(), preferredName: preferredName.trim(),
        pronouns: pronouns.trim(), dateOfBirth: dateToStr(dateOfBirth),
        ssnLast4: ssnLast4.trim() || null, status,
      });
      notifications.show({ title: t('demographics.notify.saved'), message: t('demographics.notify.identitySaved'), color: 'green' });
    } catch (err) {
      notifications.show({ title: t('demographics.notify.error'), message: err.message, color: 'red' });
    } finally { setIdSaving(false); }
  };

  const saveDemographics = async () => {
    setDemoSaving(true);
    try {
      await patchClient(clientId, {
        genderIdentity: genderIdentity.trim(), biologicalSex: biologicalSex || null,
        raceEthnicity: raceEthnicity.trim(), maritalStatus: maritalStatus || null,
        languagePreference: languagePreference || 'English',
        employmentStatus: employmentStatus || null,
        employerName: EMPLOYED.includes(employmentStatus) ? employerName.trim() : null,
      });
      notifications.show({ title: t('demographics.notify.saved'), message: t('demographics.notify.demographicsSaved'), color: 'green' });
    } catch (err) {
      notifications.show({ title: t('demographics.notify.error'), message: err.message, color: 'red' });
    } finally { setDemoSaving(false); }
  };

  const saveEmail = async () => {
    setEmailSaving(true);
    try {
      await patchClient(clientId, { email: email.trim() || null });
      notifications.show({ title: t('demographics.notify.saved'), message: t('demographics.notify.emailSaved'), color: 'green' });
    } catch (err) {
      notifications.show({ title: t('demographics.notify.error'), message: err.message, color: 'red' });
    } finally { setEmailSaving(false); }
  };

  const updatePhone   = (key, field, val) => setPhones((prev) => prev.map((p) => p._key === key ? { ...p, [field]: val, _dirty: true } : p));
  const removePhone   = (key) => setPhones((prev) => prev.map((p) => p._key === key ? { ...p, _deleted: true } : p));
  const addPhone      = () => setPhones((prev) => [...prev, { _key: Math.random(), id: null, phone_type: 'cell', number: '', extension: '', is_preferred: false, ok_to_text: false, ok_to_leave_msg: true, _deleted: false, _dirty: true }]);

  const savePhones = async () => {
    setPhonesSaving(true);
    try {
      for (const p of phones) {
        if (p._deleted) { if (p.id) await deleteClientPhone(clientId, p.id); }
        else if (p._dirty) {
          const data = { phone_type: p.phone_type, number: p.number, extension: p.extension || null, is_preferred: p.is_preferred ? 1 : 0, ok_to_text: p.ok_to_text ? 1 : 0, ok_to_leave_msg: p.ok_to_leave_msg ? 1 : 0 };
          if (p.id) { await updateClientPhone(clientId, p.id, data); }
          else { const r = await createClientPhone(clientId, data); p.id = r.item?.id ?? r.id; }
        }
      }
      setPhones((prev) => prev.filter((p) => !p._deleted).map((p) => ({ ...p, _dirty: false })));
      notifications.show({ title: t('demographics.notify.saved'), message: t('demographics.notify.phonesSaved'), color: 'green' });
    } catch (err) {
      notifications.show({ title: t('demographics.notify.error'), message: err.message, color: 'red' });
    } finally { setPhonesSaving(false); }
  };

  const updateAddress = (key, field, val) => setAddresses((prev) => prev.map((a) => a._key === key ? { ...a, [field]: val, _dirty: true } : a));
  const removeAddress = (key) => setAddresses((prev) => prev.map((a) => a._key === key ? { ...a, _deleted: true } : a));
  const addAddress    = () => setAddresses((prev) => [...prev, { _key: Math.random(), id: null, addr_type: 'primary', line1: '', line2: '', city: '', state: '', postal: '', country: 'US', is_preferred: false, _deleted: false, _dirty: true }]);

  const saveAddresses = async () => {
    setAddrSaving(true);
    try {
      for (const a of addresses) {
        if (a._deleted) { if (a.id) await deleteClientAddress(clientId, a.id); }
        else if (a._dirty) {
          const data = { addr_type: a.addr_type, line1: a.line1, line2: a.line2 || null, city: a.city, state: a.state, postal: a.postal, country: a.country || 'US', is_preferred: a.is_preferred ? 1 : 0 };
          if (a.id) { await updateClientAddress(clientId, a.id, data); }
          else { const r = await createClientAddress(clientId, data); a.id = r.item?.id ?? r.id; }
        }
      }
      setAddresses((prev) => prev.filter((a) => !a._deleted).map((a) => ({ ...a, _dirty: false })));
      notifications.show({ title: t('demographics.notify.saved'), message: t('demographics.notify.addressesSaved'), color: 'green' });
    } catch (err) {
      notifications.show({ title: t('demographics.notify.error'), message: err.message, color: 'red' });
    } finally { setAddrSaving(false); }
  };

  const visiblePhones    = phones.filter((p) => !p._deleted);
  const visibleAddresses = addresses.filter((a) => !a._deleted);

  return (
    <Stack gap="xl" maw={900}>
      {/* Care Team */}
      <Stack gap="sm">
        <Title order={4} fz="sm" tt="uppercase" c="dimmed">{t('demographics.section.careTeam')}</Title>
        <Group align="flex-end" gap="sm" maw={420}>
          <Select
            label={t('demographics.field.primaryCounselor')}
            placeholder={t('demographics.field.unassigned')}
            data={counselorOptions}
            value={primaryCounselorId}
            onChange={(v) => setPrimaryCounselorId(v ?? null)}
            clearable
            searchable
            style={{ flex: 1 }}
          />
          <Button loading={counselorSaving} onClick={saveCounselor}>{t('actions.save')}</Button>
        </Group>
      </Stack>

      <Divider />

      {/* Identity */}
      <Stack gap="sm">
        <Title order={4} fz="sm" tt="uppercase" c="dimmed">{t('demographics.section.legalIdentity')}</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <TextInput label={t('demographics.field.legalFirst')} required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <TextInput label={t('demographics.field.legalMiddle')}        value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          <TextInput label={t('demographics.field.legalLast')}  required value={lastName}  onChange={(e) => setLastName(e.target.value)} />
          <TextInput label={t('demographics.field.preferredName')} value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
          <TextInput label={t('demographics.field.pronouns')} placeholder={t('demographics.field.pronounsPlaceholder')} value={pronouns} onChange={(e) => setPronouns(e.target.value)} />
          <DateInput label={age !== null ? t('demographics.field.dateOfBirthAge', { age }) : t('demographics.field.dateOfBirth')} valueFormat="MM/DD/YYYY" placeholder="MM/DD/YYYY" value={dateOfBirth} onChange={setDateOfBirth} />
          <PasswordInput label={t('demographics.field.ssnLast4')} maxLength={4} value={ssnLast4} onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          <Select label={t('table.status')} data={STATUS_OPTIONS} value={status} onChange={(v) => setStatus(v ?? 'active')} />
        </SimpleGrid>
        <Group><Button loading={idSaving} onClick={saveIdentity}>{t('demographics.save.identity')}</Button></Group>
      </Stack>

      <Divider />

      {/* Demographics */}
      <Stack gap="sm">
        <Title order={4} fz="sm" tt="uppercase" c="dimmed">{t('demographics.section.demographics')}</Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput label={t('demographics.field.genderIdentity')} placeholder={t('demographics.field.genderIdentityPlaceholder')} value={genderIdentity} onChange={(e) => setGenderIdentity(e.target.value)} />
          <Select label={t('demographics.field.biologicalSex')} data={BIO_SEX_OPTIONS} value={biologicalSex} onChange={(v) => setBiologicalSex(v ?? '')} />
          <TextInput label={t('demographics.field.raceEthnicity')} placeholder={t('demographics.field.raceEthnicityPlaceholder')} value={raceEthnicity} onChange={(e) => setRaceEthnicity(e.target.value)} />
          <Select label={t('demographics.field.maritalStatus')} data={[{ value: '', label: t('demographics.select.placeholder') }, ...MARITAL_OPTIONS]} value={maritalStatus} onChange={(v) => setMaritalStatus(v ?? '')} />
          <Select label={t('demographics.field.languagePreference')} data={LANGUAGE_OPTIONS} value={languagePreference} onChange={(v) => setLanguagePreference(v ?? 'English')} />
          <Select label={t('demographics.field.employmentStatus')} data={[{ value: '', label: t('demographics.select.placeholder') }, ...EMPLOY_OPTIONS]} value={employmentStatus} onChange={(v) => setEmploymentStatus(v ?? '')} />
          {EMPLOYED.includes(employmentStatus) && (
            <TextInput label={t('demographics.field.employerName')} value={employerName} onChange={(e) => setEmployerName(e.target.value)} />
          )}
        </SimpleGrid>
        <Group><Button loading={demoSaving} onClick={saveDemographics}>{t('demographics.save.demographics')}</Button></Group>
      </Stack>

      <Divider />

      {/* Contact */}
      <Stack gap="sm">
        <Title order={4} fz="sm" tt="uppercase" c="dimmed">{t('demographics.section.contactInfo')}</Title>

        {/* Email */}
        <Group align="flex-end" gap="sm">
          <TextInput label={t('demographics.field.emailAddress')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('demographics.field.emailPlaceholder')} style={{ flex: 1 }} />
          <Button loading={emailSaving} onClick={saveEmail}>{t('demographics.save.email')}</Button>
        </Group>

        {/* Phones */}
        <Stack gap="xs" mt="sm">
          <Text fw={600} fz="sm">{t('demographics.field.phoneNumbers')}</Text>
          {visiblePhones.length === 0 && <Text c="dimmed" fz="sm">{t('demographics.noPhonesAdded')}</Text>}
          {visiblePhones.map((p) => (
            <Paper key={p._key} withBorder radius="sm" p="sm">
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                <Select data={PHONE_TYPE_OPTIONS} value={p.phone_type} onChange={(v) => updatePhone(p._key, 'phone_type', v ?? 'cell')} />
                <TextInput type="tel" placeholder={t('demographics.field.phonePlaceholder')} value={p.number} onChange={(e) => updatePhone(p._key, 'number', e.target.value)} />
                <TextInput placeholder={t('demographics.field.phoneExt')} value={p.extension ?? ''} onChange={(e) => updatePhone(p._key, 'extension', e.target.value)} />
                <Group gap="sm" wrap="nowrap">
                  <input type="checkbox" checked={!!p.is_preferred}   onChange={(e) => updatePhone(p._key, 'is_preferred',   e.target.checked)} /> <Text fz="xs">{t('demographics.field.preferred')}</Text>
                  <input type="checkbox" checked={!!p.ok_to_text}     onChange={(e) => updatePhone(p._key, 'ok_to_text',     e.target.checked)} /> <Text fz="xs">{t('demographics.field.text')}</Text>
                  <input type="checkbox" checked={!!p.ok_to_leave_msg} onChange={(e) => updatePhone(p._key, 'ok_to_leave_msg', e.target.checked)} /> <Text fz="xs">{t('demographics.field.msg')}</Text>
                  <Button size="compact-xs" color="red" variant="subtle" onClick={() => removePhone(p._key)}>×</Button>
                </Group>
              </SimpleGrid>
            </Paper>
          ))}
          <Group gap="xs">
            <Button variant="outline" size="xs" onClick={addPhone}>{t('demographics.action.addPhone')}</Button>
            <Button size="xs" loading={phonesSaving} onClick={savePhones}>{t('demographics.save.phones')}</Button>
          </Group>
        </Stack>

        {/* Addresses */}
        <Stack gap="xs" mt="sm">
          <Text fw={600} fz="sm">{t('demographics.field.addresses')}</Text>
          {visibleAddresses.length === 0 && <Text c="dimmed" fz="sm">{t('demographics.noAddressesAdded')}</Text>}
          {visibleAddresses.map((a) => (
            <Paper key={a._key} withBorder radius="sm" p="sm">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                <Select label={t('demographics.field.addressType')} data={ADDR_TYPE_OPTIONS} value={a.addr_type} onChange={(v) => updateAddress(a._key, 'addr_type', v ?? 'primary')} />
                <TextInput label={t('demographics.field.addressLine1')} value={a.line1} onChange={(e) => updateAddress(a._key, 'line1', e.target.value)} />
                <TextInput label={t('demographics.field.addressLine2')} value={a.line2 ?? ''} onChange={(e) => updateAddress(a._key, 'line2', e.target.value)} placeholder={t('demographics.field.addressLine2Placeholder')} />
                <TextInput label={t('demographics.field.city')}    value={a.city}   onChange={(e) => updateAddress(a._key, 'city',   e.target.value)} />
                <TextInput label={t('demographics.field.state')}   value={a.state}  onChange={(e) => updateAddress(a._key, 'state',  e.target.value)} placeholder="CA" />
                <TextInput label={t('demographics.field.postal')}  value={a.postal} onChange={(e) => updateAddress(a._key, 'postal', e.target.value)} />
                <TextInput label={t('demographics.field.country')} value={a.country} onChange={(e) => updateAddress(a._key, 'country', e.target.value)} maxLength={4} />
              </SimpleGrid>
              <Group justify="space-between" mt="xs">
                <Group gap="xs">
                  <input type="checkbox" checked={!!a.is_preferred} onChange={(e) => updateAddress(a._key, 'is_preferred', e.target.checked)} />
                  <Text fz="xs">{t('demographics.field.preferredAddress')}</Text>
                </Group>
                <Button size="compact-xs" color="red" variant="subtle" onClick={() => removeAddress(a._key)}>{t('demographics.action.remove')}</Button>
              </Group>
            </Paper>
          ))}
          <Group gap="xs">
            <Button variant="outline" size="xs" onClick={addAddress}>{t('demographics.action.addAddress')}</Button>
            <Button size="xs" loading={addrSaving} onClick={saveAddresses}>{t('demographics.save.addresses')}</Button>
          </Group>
        </Stack>
      </Stack>

      {portalProfile && (
        <>
          <Divider />
          <Stack gap="sm">
            <Title order={4} fz="sm" tt="uppercase" c="dimmed">{t('demographics.section.portalPrefs')}</Title>
            <Alert color="blue" variant="light" p="xs">
              <Text fz="xs">{t('demographics.portal.readOnlyNotice')}</Text>
            </Alert>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {portalProfile.preferredName && (
                <Paper withBorder radius="sm" p="sm">
                  <Text fz="xs" c="dimmed">{t('demographics.portal.preferredName')}</Text>
                  <Text fz="sm">{portalProfile.preferredName}</Text>
                </Paper>
              )}
              {portalProfile.contactEmail && (
                <Paper withBorder radius="sm" p="sm">
                  <Text fz="xs" c="dimmed">{t('demographics.portal.contactEmail')}</Text>
                  <Text fz="sm">{portalProfile.contactEmail}</Text>
                </Paper>
              )}
              {portalProfile.contactPhone && (
                <Paper withBorder radius="sm" p="sm">
                  <Text fz="xs" c="dimmed">{t('demographics.portal.contactPhone')}</Text>
                  <Text fz="sm">{portalProfile.contactPhone}</Text>
                </Paper>
              )}
              {portalProfile.profileDetails?.demographics?.pronouns && (
                <Paper withBorder radius="sm" p="sm">
                  <Text fz="xs" c="dimmed">{t('demographics.portal.pronouns')}</Text>
                  <Text fz="sm">{portalProfile.profileDetails.demographics.pronouns}</Text>
                </Paper>
              )}
              {portalProfile.profileDetails?.demographics?.maritalStatus && (
                <Paper withBorder radius="sm" p="sm">
                  <Text fz="xs" c="dimmed">{t('demographics.portal.maritalStatus')}</Text>
                  <Text fz="sm">{portalProfile.profileDetails.demographics.maritalStatus}</Text>
                </Paper>
              )}
              {portalProfile.profileDetails?.education?.level && (
                <Paper withBorder radius="sm" p="sm">
                  <Text fz="xs" c="dimmed">{t('demographics.portal.educationLevel')}</Text>
                  <Text fz="sm">{portalProfile.profileDetails.education.level}</Text>
                </Paper>
              )}
              {portalProfile.profileDetails?.education?.occupation && (
                <Paper withBorder radius="sm" p="sm">
                  <Text fz="xs" c="dimmed">{t('demographics.portal.occupation')}</Text>
                  <Text fz="sm">{portalProfile.profileDetails.education.occupation}</Text>
                </Paper>
              )}
              {(portalProfile.profileDetails?.affiliations ?? []).length > 0 && (
                <Paper withBorder radius="sm" p="sm">
                  <Text fz="xs" c="dimmed">{t('demographics.portal.affiliations')}</Text>
                  <Text fz="sm">{portalProfile.profileDetails.affiliations.join(', ')}</Text>
                </Paper>
              )}
              {portalProfile.contactPreferences?.method && (
                <Paper withBorder radius="sm" p="sm">
                  <Text fz="xs" c="dimmed">{t('demographics.portal.contactMethod')}</Text>
                  <Text fz="sm">{portalProfile.contactPreferences.method}</Text>
                </Paper>
              )}
            </SimpleGrid>
          </Stack>
        </>
      )}
    </Stack>
  );
}
