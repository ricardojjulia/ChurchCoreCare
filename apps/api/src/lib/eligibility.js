/**
 * Insurance eligibility verification via Stedi 270/271 transactions.
 *
 * Sends a real-time 270 eligibility inquiry to Stedi and parses the 271
 * response into a structured eligibility result that the UI and claims
 * workflow can consume.
 *
 * Eligibility results are encrypted and cached in client_insurance
 * (eligibility_response_enc, eligibility_checked_at, eligibility_status).
 */

import pool from '../db/pool.js';
import { encryptJson, decryptJson } from './encrypt.js';

const STEDI_ELIGIBILITY_URL = 'https://healthcare.us.stedi.com/2024-04-01/eligibility';

function getApiKey() {
  if (!process.env.STEDI_API_KEY) {
    throw new Error('STEDI_API_KEY not configured');
  }
  return process.env.STEDI_API_KEY;
}

// ─── 270 request builder ──────────────────────────────────────────────────────

function buildEligibilityRequest({ client, insurance, provider }) {
  return {
    controlNumber: insurance.id.replace(/[^0-9]/g, '').slice(0, 9).padStart(9, '0'),
    tradingPartnerServiceId: insurance.payerCode,
    provider: {
      organizationName: provider.practiceName,
      npi: provider.npi,
    },
    subscriber: {
      memberId: insurance.memberId,
      firstName: client.firstName,
      lastName: client.lastName,
      dateOfBirth: client.dateOfBirth
        ? client.dateOfBirth.replace(/-/g, '')
        : null,
    },
    encounter: {
      serviceTypeCodes: ['30'],
      dateOfService: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    },
  };
}

// ─── 271 response parser ──────────────────────────────────────────────────────

function parseEligibilityResponse(response) {
  const benefitInfo = response.benefitsInformation ?? [];

  const activeCoverage = benefitInfo.find(
    (b) => b.code === '1' && b.name === 'Active Coverage',
  );
  const deductible = benefitInfo.find((b) => b.name === 'Deductible');
  const copay = benefitInfo.find((b) => b.name === 'Co-Payment');
  const coinsurance = benefitInfo.find((b) => b.name === 'Co-Insurance');
  const outOfPocket = benefitInfo.find((b) => b.name === 'Out of Pocket (Stop Loss)');

  return {
    isEligible: Boolean(activeCoverage),
    planName: response.planDescription ?? null,
    groupNumber: response.groupNumber ?? null,
    effectiveDate: response.planDateInformation?.plan ?? null,
    termDate: response.planDateInformation?.planTermination ?? null,
    deductibleAmount: deductible?.benefitAmount ?? null,
    copayAmount: copay?.benefitAmount ?? null,
    coinsurancePercent: coinsurance?.benefitPercent ?? null,
    outOfPocketAmount: outOfPocket?.benefitAmount ?? null,
    mentalHealthCovered: benefitInfo.some(
      (b) => b.serviceTypeCodes?.includes('MH') || b.serviceTypeCodes?.includes('30'),
    ),
    rawResponse: response,
  };
}

// ─── Main verify function ─────────────────────────────────────────────────────

export async function verifyEligibility({ clientInsuranceId, tenantId, client, insurance, provider }) {
  const requestBody = buildEligibilityRequest({ client, insurance, provider });

  const res = await fetch(STEDI_ELIGIBILITY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Stedi eligibility error ${res.status}: ${text.slice(0, 200)}`);
  }

  const responseData = await res.json();
  const parsed = parseEligibilityResponse(responseData);
  const status = parsed.isEligible ? 'eligible' : 'ineligible';

  if (process.env.DB_NAME && tenantId && clientInsuranceId) {
    const encryptedResponse = encryptJson(parsed);
    await pool.query(
      `UPDATE client_insurance
       SET eligibility_response_enc = ?,
           eligibility_checked_at   = NOW(),
           eligibility_status       = ?
       WHERE id = ? AND tenant_id = ?`,
      [encryptedResponse, status, clientInsuranceId, tenantId],
    );
  }

  return { ...parsed, status };
}

// ─── Cached eligibility lookup ────────────────────────────────────────────────

export async function getCachedEligibility(clientInsuranceId, tenantId) {
  if (!process.env.DB_NAME) return null;

  const [rows] = await pool.query(
    `SELECT eligibility_response_enc, eligibility_checked_at, eligibility_status
     FROM client_insurance
     WHERE id = ? AND tenant_id = ?
     LIMIT 1`,
    [clientInsuranceId, tenantId],
  );

  const row = rows[0];
  if (!row || !row.eligibility_checked_at) return null;

  return {
    status: row.eligibility_status ?? null,
    checkedAt: row.eligibility_checked_at,
    result: row.eligibility_response_enc ? decryptJson(row.eligibility_response_enc) : null,
  };
}
