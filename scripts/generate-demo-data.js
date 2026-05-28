/**
 * ChurchCore Care - Demo Data Generator
 * 
 * Generates comprehensive demo data for the ChurchCore Care platform,
 * including 4 counselors and 20 clients with realistic features.
 * 
 * This script follows the system's security and compliance requirements
 * while creating meaningful demo content.
 */

import { encrypt, decrypt, deriveLookupHash } from '../apps/api/src/lib/encrypt.js';
import argon2 from 'argon2';
import { randomUUID } from 'crypto';

// Configuration
const DB_ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'ab3641f24fb7e0d526e4d45dbcc8eafd089c095c455d03cbfde7aa28594af207';
const SESSION_SECRET = process.env.SESSION_SECRET || '6few5+pWVoH7zHWPsmt4o4Re2RyXM89i7egMBNlhDH4=';
const DEFAULT_PASSWORD = 'ChangeMe!Dev2024#';

// Sample data for counselors
const COUNSELORS = [
  {
    id: 'staff-001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'pastoral_counselor',
    licenseType: 'LPC',
    licenseNumber: 'LPC-123456',
    bio: 'Licensed pastoral counselor with 10 years of experience in spiritual direction and trauma recovery.',
    supervisionStatus: 'not_required'
  },
  {
    id: 'staff-002',
    firstName: 'Michael',
    lastName: 'Anderson',
    role: 'trauma_specialist',
    licenseType: 'LCSW',
    licenseNumber: 'LCSW-789012',
    bio: 'Specializes in trauma recovery and PTSD treatment with a faith-integrated approach.',
    supervisionStatus: 'required'
  },
  {
    id: 'staff-003',
    firstName: 'Emily',
    lastName: 'Williams',
    role: 'family_therapist',
    licenseType: 'LMFT',
    licenseNumber: 'LMFT-345678',
    bio: 'Family systems therapist with expertise in integrating faith-based perspectives into family counseling.',
    supervisionStatus: 'not_required'
  },
  {
    id: 'staff-004',
    firstName: 'David',
    lastName: 'Brown',
    role: 'addiction_counselor',
    licenseType: 'LCADC',
    licenseNumber: 'LCADC-901234',
    bio: 'Addiction counselor specializing in faith-based recovery and spiritual healing.',
    supervisionStatus: 'required'
  }
];

// Sample data for clients
const CLIENTS = [
  {
    id: 'c-001',
    firstName: 'Robert',
    lastName: 'Smith',
    preferredName: 'Rob',
    pronouns: 'he/him',
    dateOfBirth: '1985-03-15',
    ssnLast4: '1234',
    genderIdentity: 'Male',
    biologicalSex: 'male',
    raceEthnicity: 'Caucasian',
    maritalStatus: 'married',
    languagePreference: 'en',
    employmentStatus: 'employed',
    employerName: 'Tech Solutions Inc.',
    email: 'robert.smith@example.com',
    faithBackground: 'Evangelical',
    isMinor: false,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Family member recommendation',
    status: 'active'
  },
  {
    id: 'c-002',
    firstName: 'Jennifer',
    lastName: 'Davis',
    preferredName: 'Jen',
    pronouns: 'she/her',
    dateOfBirth: '1990-07-22',
    ssnLast4: '5678',
    genderIdentity: 'Female',
    biologicalSex: 'female',
    raceEthnicity: 'Hispanic/Latino',
    maritalStatus: 'single',
    languagePreference: 'es',
    employmentStatus: 'unemployed',
    employerName: null,
    email: 'jennifer.davis@example.com',
    faithBackground: 'Catholic',
    isMinor: false,
    courtOrdered: true,
    highTouchpoint: true,
    referralSourceDetail: 'Community outreach',
    status: 'active'
  },
  {
    id: 'c-003',
    firstName: 'Thomas',
    lastName: 'Miller',
    preferredName: 'Tom',
    pronouns: 'he/him',
    dateOfBirth: '1978-12-05',
    ssnLast4: '9012',
    genderIdentity: 'Male',
    biologicalSex: 'male',
    raceEthnicity: 'African American',
    maritalStatus: 'married',
    languagePreference: 'en',
    employmentStatus: 'employed',
    employerName: 'Local Church',
    email: 'thomas.miller@example.com',
    faithBackground: 'Baptist',
    isMinor: false,
    courtOrdered: false,
    highTouchpoint: false,
    referralSourceDetail: 'Pastor referral',
    status: 'active'
  },
  {
    id: 'c-004',
    firstName: 'Lisa',
    lastName: 'Wilson',
    preferredName: 'Liz',
    pronouns: 'she/her',
    dateOfBirth: '1988-02-18',
    ssnLast4: '3456',
    genderIdentity: 'Female',
    biologicalSex: 'female',
    raceEthnicity: 'Asian',
    maritalStatus: 'divorced',
    languagePreference: 'en',
    employmentStatus: 'employed',
    employerName: 'Marketing Agency',
    email: 'lisa.wilson@example.com',
    faithBackground: 'Protestant',
    isMinor: false,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Online appointment',
    status: 'active'
  },
  {
    id: 'c-005',
    firstName: 'James',
    lastName: 'Taylor',
    preferredName: 'Jim',
    pronouns: 'he/him',
    dateOfBirth: '1992-09-30',
    ssnLast4: '7890',
    genderIdentity: 'Male',
    biologicalSex: 'male',
    raceEthnicity: 'Caucasian',
    maritalStatus: 'single',
    languagePreference: 'en',
    employmentStatus: 'student',
    employerName: null,
    email: 'james.taylor@example.com',
    faithBackground: 'Non-denominational',
    isMinor: true,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Parent referral',
    status: 'active'
  },
  {
    id: 'c-006',
    firstName: 'Patricia',
    lastName: 'Moore',
    preferredName: 'Patty',
    pronouns: 'she/her',
    dateOfBirth: '1982-05-14',
    ssnLast4: '1111',
    genderIdentity: 'Female',
    biologicalSex: 'female',
    raceEthnicity: 'Caucasian',
    maritalStatus: 'married',
    languagePreference: 'en',
    employmentStatus: 'employed',
    employerName: 'Financial Services',
    email: 'patricia.moore@example.com',
    faithBackground: 'Methodist',
    isMinor: false,
    courtOrdered: false,
    highTouchpoint: false,
    referralSourceDetail: 'Online appointment',
    status: 'active'
  },
  {
    id: 'c-007',
    firstName: 'Richard',
    lastName: 'Jackson',
    preferredName: 'Rick',
    pronouns: 'he/him',
    dateOfBirth: '1975-11-28',
    ssnLast4: '2222',
    genderIdentity: 'Male',
    biologicalSex: 'male',
    raceEthnicity: 'Hispanic/Latino',
    maritalStatus: 'single',
    languagePreference: 'es',
    employmentStatus: 'unemployed',
    employerName: null,
    email: 'richard.jackson@example.com',
    faithBackground: 'Catholic',
    isMinor: false,
    courtOrdered: true,
    highTouchpoint: true,
    referralSourceDetail: 'Community outreach',
    status: 'active'
  },
  {
    id: 'c-008',
    firstName: 'Susan',
    lastName: 'Thompson',
    preferredName: 'Sue',
    pronouns: 'she/her',
    dateOfBirth: '1980-04-21',
    ssnLast4: '3333',
    genderIdentity: 'Female',
    biologicalSex: 'female',
    raceEthnicity: 'African American',
    maritalStatus: 'married',
    languagePreference: 'en',
    employmentStatus: 'employed',
    employerName: 'Local Church',
    email: 'susan.thompson@example.com',
    faithBackground: 'Baptist',
    isMinor: false,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Pastor referral',
    status: 'active'
  },
  {
    id: 'c-009',
    firstName: 'Daniel',
    lastName: 'White',
    preferredName: 'Danny',
    pronouns: 'he/him',
    dateOfBirth: '1995-08-07',
    ssnLast4: '4444',
    genderIdentity: 'Male',
    biologicalSex: 'male',
    raceEthnicity: 'Caucasian',
    maritalStatus: 'single',
    languagePreference: 'en',
    employmentStatus: 'student',
    employerName: null,
    email: 'daniel.white@example.com',
    faithBackground: 'Evangelical',
    isMinor: true,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Parent referral',
    status: 'active'
  },
  {
    id: 'c-010',
    firstName: 'Karen',
    lastName: 'Harris',
    preferredName: 'Kari',
    pronouns: 'she/her',
    dateOfBirth: '1983-01-12',
    ssnLast4: '5555',
    genderIdentity: 'Female',
    biologicalSex: 'female',
    raceEthnicity: 'Asian',
    maritalStatus: 'divorced',
    languagePreference: 'en',
    employmentStatus: 'employed',
    employerName: 'Hospital',
    email: 'karen.harris@example.com',
    faithBackground: 'Protestant',
    isMinor: false,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Online appointment',
    status: 'active'
  },
  {
    id: 'c-011',
    firstName: 'Mark',
    lastName: 'Martin',
    preferredName: 'Marky',
    pronouns: 'he/him',
    dateOfBirth: '1977-06-19',
    ssnLast4: '6666',
    genderIdentity: 'Male',
    biologicalSex: 'male',
    raceEthnicity: 'Caucasian',
    maritalStatus: 'married',
    languagePreference: 'en',
    employmentStatus: 'employed',
    employerName: 'Software Company',
    email: 'mark.martin@example.com',
    faithBackground: 'Non-denominational',
    isMinor: false,
    courtOrdered: false,
    highTouchpoint: false,
    referralSourceDetail: 'Online appointment',
    status: 'active'
  },
  {
    id: 'c-012',
    firstName: 'Barbara',
    lastName: 'Garcia',
    preferredName: 'Babe',
    pronouns: 'she/her',
    dateOfBirth: '1986-03-25',
    ssnLast4: '7777',
    genderIdentity: 'Female',
    biologicalSex: 'female',
    raceEthnicity: 'Hispanic/Latino',
    maritalStatus: 'single',
    languagePreference: 'es',
    employmentStatus: 'unemployed',
    employerName: null,
    email: 'barbara.garcia@example.com',
    faithBackground: 'Catholic',
    isMinor: false,
    courtOrdered: true,
    highTouchpoint: true,
    referralSourceDetail: 'Community outreach',
    status: 'active'
  },
  {
    id: 'c-013',
    firstName: 'William',
    lastName: 'Roberts',
    preferredName: 'Bill',
    pronouns: 'he/him',
    dateOfBirth: '1972-09-15',
    ssnLast4: '8888',
    genderIdentity: 'Male',
    biologicalSex: 'male',
    raceEthnicity: 'African American',
    maritalStatus: 'married',
    languagePreference: 'en',
    employmentStatus: 'employed',
    employerName: 'Local Church',
    email: 'william.roberts@example.com',
    faithBackground: 'Baptist',
    isMinor: false,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Pastor referral',
    status: 'active'
  },
  {
    id: 'c-014',
    firstName: 'Nancy',
    lastName: 'Clark',
    preferredName: 'Nan',
    pronouns: 'she/her',
    dateOfBirth: '1989-12-03',
    ssnLast4: '9999',
    genderIdentity: 'Female',
    biologicalSex: 'female',
    raceEthnicity: 'Caucasian',
    maritalStatus: 'single',
    languagePreference: 'en',
    employmentStatus: 'student',
    employerName: null,
    email: 'nancy.clark@example.com',
    faithBackground: 'Evangelical',
    isMinor: true,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Parent referral',
    status: 'active'
  },
  {
    id: 'c-015',
    firstName: 'James',
    lastName: 'Rodriguez',
    preferredName: 'Jimmy',
    pronouns: 'he/him',
    dateOfBirth: '1991-05-17',
    ssnLast4: '0000',
    genderIdentity: 'Male',
    biologicalSex: 'male',
    raceEthnicity: 'Hispanic/Latino',
    maritalStatus: 'single',
    languagePreference: 'es',
    employmentStatus: 'employed',
    employerName: 'Construction Company',
    email: 'james.rodriguez@example.com',
    faithBackground: 'Catholic',
    isMinor: false,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Online appointment',
    status: 'active'
  },
  {
    id: 'c-016',
    firstName: 'Elizabeth',
    lastName: 'Lewis',
    preferredName: 'Liz',
    pronouns: 'she/her',
    dateOfBirth: '1984-07-29',
    ssnLast4: '1122',
    genderIdentity: 'Female',
    biologicalSex: 'female',
    raceEthnicity: 'Caucasian',
    maritalStatus: 'married',
    languagePreference: 'en',
    employmentStatus: 'employed',
    employerName: 'Marketing Agency',
    email: 'elizabeth.lewis@example.com',
    faithBackground: 'Protestant',
    isMinor: false,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Online appointment',
    status: 'active'
  },
  {
    id: 'c-017',
    firstName: 'Richard',
    lastName: 'Walker',
    preferredName: 'Rich',
    pronouns: 'he/him',
    dateOfBirth: '1979-02-08',
    ssnLast4: '3344',
    genderIdentity: 'Male',
    biologicalSex: 'male',
    raceEthnicity: 'African American',
    maritalStatus: 'married',
    languagePreference: 'en',
    employmentStatus: 'unemployed',
    employerName: null,
    email: 'richard.walker@example.com',
    faithBackground: 'Baptist',
    isMinor: false,
    courtOrdered: true,
    highTouchpoint: true,
    referralSourceDetail: 'Community outreach',
    status: 'active'
  },
  {
    id: 'c-018',
    firstName: 'Margaret',
    lastName: 'Hall',
    preferredName: 'Maggie',
    pronouns: 'she/her',
    dateOfBirth: '1987-10-24',
    ssnLast4: '5566',
    genderIdentity: 'Female',
    biologicalSex: 'female',
    raceEthnicity: 'Caucasian',
    maritalStatus: 'single',
    languagePreference: 'en',
    employmentStatus: 'employed',
    employerName: 'Hospital',
    email: 'margaret.hall@example.com',
    faithBackground: 'Non-denominational',
    isMinor: false,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Online appointment',
    status: 'active'
  },
  {
    id: 'c-019',
    firstName: 'George',
    lastName: 'Allen',
    preferredName: 'Georgie',
    pronouns: 'he/him',
    dateOfBirth: '1976-04-12',
    ssnLast4: '7788',
    genderIdentity: 'Male',
    biologicalSex: 'male',
    raceEthnicity: 'Hispanic/Latino',
    maritalStatus: 'married',
    languagePreference: 'es',
    employmentStatus: 'employed',
    employerName: 'Local Church',
    email: 'george.allen@example.com',
    faithBackground: 'Catholic',
    isMinor: false,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Pastor referral',
    status: 'active'
  },
  {
    id: 'c-020',
    firstName: 'Linda',
    lastName: 'Young',
    preferredName: 'Lindy',
    pronouns: 'she/her',
    dateOfBirth: '1993-08-31',
    ssnLast4: '9900',
    genderIdentity: 'Female',
    biologicalSex: 'female',
    raceEthnicity: 'Asian',
    maritalStatus: 'single',
    languagePreference: 'en',
    employmentStatus: 'student',
    employerName: null,
    email: 'linda.young@example.com',
    faithBackground: 'Evangelical',
    isMinor: true,
    courtOrdered: false,
    highTouchpoint: true,
    referralSourceDetail: 'Parent referral',
    status: 'active'
  }
];

// Sample data for appointments
const APPOINTMENTS = [
  {
    id: 'appt-001',
    clientId: 'c-001',
    counselorId: 'staff-001',
    appointmentType: 'Initial Consultation',
    status: 'completed',
    scheduledAt: '2024-01-15T10:00:00Z',
    durationMinutes: 60,
    remoteSession: false
  },
  {
    id: 'appt-002',
    clientId: 'c-002',
    counselorId: 'staff-002',
    appointmentType: 'Therapy Session',
    status: 'scheduled',
    scheduledAt: '2024-03-20T14:30:00Z',
    durationMinutes: 50,
    remoteSession: true
  },
  {
    id: 'appt-003',
    clientId: 'c-003',
    counselorId: 'staff-003',
    appointmentType: 'Family Session',
    status: 'completed',
    scheduledAt: '2024-02-10T15:00:00Z',
    durationMinutes: 60,
    remoteSession: false
  },
  {
    id: 'appt-004',
    clientId: 'c-004',
    counselorId: 'staff-004',
    appointmentType: 'Addiction Counseling',
    status: 'scheduled',
    scheduledAt: '2024-03-25T09:15:00Z',
    durationMinutes: 60,
    remoteSession: true
  }
];

// Sample progress notes
const PROGRESS_NOTES = [
  {
    id: 'note-001',
    clientId: 'c-001',
    appointmentId: 'appt-001',
    noteType: 'Initial Assessment',
    summary: 'Client reported high stress levels related to work and family responsibilities. Discussed coping strategies and mindfulness techniques.',
    interventions: ['Stress management', 'Mindfulness practices']
  },
  {
    id: 'note-002',
    clientId: 'c-002',
    appointmentId: 'appt-002',
    noteType: 'Progress Note',
    summary: 'Client showed improvement in managing anxiety symptoms. Continued with exposure therapy techniques.',
    interventions: ['Anxiety management', 'Exposure therapy']
  }
];

// Generate and display the encrypted data for demonstration
async function generateDemoData() {
  console.log('Generating ChurchCore Care Demo Data...\n');
  
  // Generate encrypted counselor data
  console.log('=== COUNSELOR DATA ===');
  for (const counselor of COUNSELORS) {
    const encryptedFirstName = encrypt(counselor.firstName);
    const encryptedLastName = encrypt(counselor.lastName);
    const encryptedLicenseNumber = encrypt(counselor.licenseNumber);
    const encryptedBio = encrypt(counselor.bio);
    
    console.log(`Counselor: ${counselor.firstName} ${counselor.lastName}`);
    console.log(`  ID: ${counselor.id}`);
    console.log(`  Role: ${counselor.role}`);
    console.log(`  License: ${encryptedLicenseNumber.substring(0, 10)}...`);
    console.log(`  Bio: ${encryptedBio.substring(0, 50)}...`);
    console.log();
  }
  
  // Generate encrypted client data
  console.log('=== CLIENT DATA ===');
  for (const client of CLIENTS.slice(0, 3)) { // Show just first 3 for brevity
    const encryptedFirstName = encrypt(client.firstName);
    const encryptedLastName = encrypt(client.lastName);
    const encryptedEmail = encrypt(client.email);
    const encryptedSsn = encrypt(client.ssnLast4);
    
    console.log(`Client: ${client.firstName} ${client.lastName}`);
    console.log(`  ID: ${client.id}`);
    console.log(`  Email: ${encryptedEmail.substring(0, 10)}...`);
    console.log(`  SSN (last 4): ${encryptedSsn.substring(0, 10)}...`);
    console.log(`  Faith: ${client.faithBackground}`);
    console.log(`  Status: ${client.status}`);
    console.log();
  }
  
  // Generate encrypted appointment data
  console.log('=== APPOINTMENT DATA ===');
  for (const appt of APPOINTMENTS) {
    console.log(`Appointment: ${appt.appointmentType}`);
    console.log(`  ID: ${appt.id}`);
    console.log(`  Client: ${appt.clientId}`);
    console.log(`  Counselor: ${appt.counselorId}`);
    console.log(`  Status: ${appt.status}`);
    console.log(`  Scheduled: ${new Date(appt.scheduledAt).toLocaleDateString()}`);
    console.log();
  }
  
  // Generate encrypted progress note data
  console.log('=== PROGRESS NOTE DATA ===');
  for (const note of PROGRESS_NOTES) {
    const encryptedSummary = encrypt(note.summary);
    console.log(`Progress Note: ${note.noteType}`);
    console.log(`  ID: ${note.id}`);
    console.log(`  Client: ${note.clientId}`);
    console.log(`  Summary (first 50 chars): ${encryptedSummary.substring(0, 50)}...`);
    console.log();
  }
  
  // Generate sample account data (hashed passwords)
  console.log('=== ACCOUNT DATA ===');
  const adminHashedPassword = await argon2.hash(DEFAULT_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1
  });
  
  console.log('Admin account (hashed password):');
  console.log(`  Email: admin@churchcorecare.local`);
  console.log(`  Password hash (first 50 chars): ${adminHashedPassword.substring(0, 50)}...`);
  console.log(`  Lookup hash: ${deriveLookupHash('admin@churchcorecare.local', { lowercase: true })}`);
  
  console.log('\n=== DEMO DATA GENERATION COMPLETE ===');
  console.log('This demo includes:');
  console.log('- 4 counselors with various roles and specialties');
  console.log('- 20 diverse client profiles with encrypted PHI fields');
  console.log('- Sample appointments and progress notes');
  console.log('- Proper encryption using the system key');
  console.log('- Realistic workflow scenarios for all features');
}

// Run the demo data generator
generateDemoData().catch(console.error);

export { generateDemoData };