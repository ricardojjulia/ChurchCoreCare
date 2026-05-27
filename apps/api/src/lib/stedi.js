/**
 * Stedi EDI clearinghouse integration.
 *
 * Handles:
 *   - 837P professional claim submission
 *   - 277 claim status polling
 *   - 835 ERA (Electronic Remittance Advice) ingestion trigger
 *   - 270/271 insurance eligibility (see eligibility.js)
 *
 * API docs: https://www.stedi.com/docs
 */

const STEDI_BASE_URL = 'https://healthcare.us.stedi.com/2024-04-01';

function getApiKey() {
  if (!process.env.STEDI_API_KEY) {
    throw new Error('STEDI_API_KEY not configured');
  }
  return process.env.STEDI_API_KEY;
}

async function stediRequest(method, path, body = null) {
  const headers = {
    'Authorization': `Key ${getApiKey()}`,
    'Content-Type': 'application/json',
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${STEDI_BASE_URL}${path}`, options);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Stedi API error ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

// ─── 837P Claim builder ───────────────────────────────────────────────────────

/**
 * Builds a Stedi-format 837P claim payload from ChurchCore claim data.
 *
 * @param {object} params
 * @param {object} params.claim         - claim record from billing.js
 * @param {object} params.client        - client record (decrypted)
 * @param {object} params.insurance     - client_insurance record (decrypted)
 * @param {object} params.provider      - staff/practice record
 * @param {object} params.serviceLines  - array of service line items
 */
export function build837PPayload({ claim, client, insurance, provider, serviceLines }) {
  return {
    controlNumber: claim.id.replace(/[^0-9]/g, '').slice(0, 9).padStart(9, '0'),
    tradingPartnerServiceId: insurance.payerCode,
    submitter: {
      organizationName: provider.practiceName,
      taxId: provider.taxId ?? provider.npi,
      contactInformation: {
        name: provider.practiceName,
        phoneNumber: provider.phone?.replace(/\D/g, '') ?? '0000000000',
      },
    },
    receiver: {
      organizationName: insurance.payerName,
    },
    subscriber: {
      memberId: insurance.memberId,
      paymentResponsibilityLevelCode: 'P',
      firstName: client.firstName,
      lastName: client.lastName,
      gender: client.gender ?? 'U',
      dateOfBirth: client.dateOfBirth
        ? client.dateOfBirth.replace(/-/g, '')
        : '19000101',
      address: {
        address1: client.addressLine1 ?? '123 Unknown St',
        city: client.city ?? 'Unknown',
        state: client.state ?? 'XX',
        postalCode: client.postalCode?.replace(/\D/g, '').slice(0, 9) ?? '00000',
      },
    },
    providers: [
      {
        providerType: 'BillingProvider',
        npi: provider.npi,
        employerId: provider.taxId ?? provider.npi,
        organizationName: provider.practiceName,
        address: {
          address1: provider.addressLine1 ?? '123 Practice Ln',
          city: provider.city ?? 'Unknown',
          state: provider.state ?? 'XX',
          postalCode: provider.postalCode?.replace(/\D/g, '').slice(0, 9) ?? '00000',
        },
      },
      {
        providerType: 'RenderingProvider',
        npi: provider.npi,
        firstName: provider.firstName,
        lastName: provider.lastName,
      },
    ],
    claimInformation: {
      claimFilingCode: 'MC',
      patientControlNumber: claim.id,
      claimChargeAmount: String(
        serviceLines.reduce((sum, l) => sum + Number(l.chargeAmount ?? 0), 0).toFixed(2),
      ),
      placeOfServiceCode: claim.placeOfServiceCode ?? '11',
      claimFrequencyCode: '1',
      signatureIndicator: 'Y',
      planParticipationCode: 'A',
      benefitsAssignmentCertificationIndicator: 'Y',
      releaseInformationCode: 'Y',
      serviceFacilityLocation: {
        organizationName: provider.practiceName,
        npi: provider.npi,
        address: {
          address1: provider.addressLine1 ?? '123 Practice Ln',
          city: provider.city ?? 'Unknown',
          state: provider.state ?? 'XX',
          postalCode: provider.postalCode?.replace(/\D/g, '').slice(0, 9) ?? '00000',
        },
      },
      serviceLines: serviceLines.map((line, idx) => ({
        serviceDate: claim.serviceDate.replace(/-/g, ''),
        professionalService: {
          procedureCode: line.cptCode,
          procedureModifiers: line.modifiers ?? [],
          description: line.description ?? 'Mental health service',
          lineItemChargeAmount: String(Number(line.chargeAmount ?? 0).toFixed(2)),
          measurementUnit: 'UN',
          serviceUnitCount: String(line.units ?? 1),
          diagnosisCodePointers: ['1'],
        },
      })),
      healthCareCodeInformation: (claim.diagnosisCodes ?? []).slice(0, 12).map((code, idx) => ({
        diagnosisTypeCode: idx === 0 ? 'ABK' : 'ABF',
        diagnosisCode: code.replace('.', ''),
      })),
    },
  };
}

// ─── Submit claim ─────────────────────────────────────────────────────────────

export async function submitClaim(claimPayload) {
  const result = await stediRequest('POST', '/claim-submission', {
    controlNumber: claimPayload.controlNumber,
    tradingPartnerServiceId: claimPayload.tradingPartnerServiceId,
    claim: claimPayload,
  });
  return {
    submissionId: result.id ?? result.controlNumber,
    status: result.status ?? 'submitted',
    raw: result,
  };
}

// ─── Claim status ─────────────────────────────────────────────────────────────

export async function getClaimStatus(submissionId) {
  const result = await stediRequest('GET', `/claim-status/${encodeURIComponent(submissionId)}`);
  return {
    submissionId,
    status: result.status ?? 'unknown',
    payerClaimNumber: result.payerClaimNumber ?? null,
    rejectionReason: result.rejectionReason ?? null,
    raw: result,
  };
}

// ─── ERA (835) ingestion ──────────────────────────────────────────────────────

export async function listPendingEras() {
  const result = await stediRequest('GET', '/edi/remittances?status=pending&limit=50');
  return (result.items ?? result.remittances ?? []).map((era) => ({
    eraId: era.id,
    payerName: era.payerName ?? null,
    paymentDate: era.paymentDate ?? null,
    totalAmount: era.totalAmount ?? null,
  }));
}

export async function acknowledgeEra(eraId) {
  await stediRequest('POST', `/edi/remittances/${encodeURIComponent(eraId)}/acknowledge`);
}
