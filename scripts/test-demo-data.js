/**
 * ChurchCore Care - Demo Data Generator (Minimal Test Version)
 * 
 * This is a simplified version that tests the core functionality
 * without argon2 dependency.
 */

import { encrypt, decrypt, deriveLookupHash } from '../apps/api/src/lib/encrypt.js';

// Configuration - using the same values as in .env
const DB_ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'ab3641f24fb7e0d526e4d45dbcc8eafd089c095c455d03cbfde7aa28594af207';
const SESSION_SECRET = process.env.SESSION_SECRET || '6few5+pWVoH7zHWPsmt4o4Re2RyXM89i7egMBNlhDH4=';
const DEFAULT_PASSWORD = 'ChangeMe!Dev2024#';

// Sample data for counselors (first few entries)
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
  }
];

// Sample data for clients (first few entries)
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
  }
];

// Generate and display the encrypted data for demonstration
function generateDemoData() {
  console.log('=== TESTING CHURCHCORE CARE DEMO DATA ===\n');
  
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
  for (const client of CLIENTS.slice(0, 2)) { // Show just first 2 for brevity
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
  
  // Test lookup hash generation
  console.log('=== LOOKUP HASH TEST ===');
  const lookupHash = deriveLookupHash('admin@churchcorecare.local', { lowercase: true });
  console.log(`Admin lookup hash: ${lookupHash}`);
  
  console.log('\n=== DEMO DATA GENERATION TEST COMPLETE ===');
  console.log('This demonstrates:');
  console.log('- Encryption of PHI fields');
  console.log('- Proper encryption using the system key');
  console.log('- Lookup hash generation');
  console.log('- Sample data structure');
}

// Run the test
generateDemoData();