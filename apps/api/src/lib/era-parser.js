/**
 * ERA (835) parser — converts a Stedi remittance response into ChurchCore claim
 * payment lines that the reconciler can match against the claims table.
 *
 * Stedi returns a translated JSON representation of the X12 835 document.
 * We extract only what we need: claim reference numbers, paid amounts, and the
 * first adjustment reason code (CO-45 = contractual adjustment, PR-1 = deductible, etc.)
 *
 * This module is pure data transformation — no I/O, no DB.
 */

/**
 * @typedef {object} EraPaymentLine
 * @property {string|null} payerClaimNumber    - payer-assigned claim number (CLM01 / NM109 on loop 2100)
 * @property {string|null} patientControlNumber - our internal claim ID from the 837 (CLM01 on loop 2300)
 * @property {number}      paidAmount          - total payment for this claim
 * @property {string|null} adjustmentReason    - first adjustment reason code label (e.g. "CO-45")
 * @property {string}      eraStatus           - 'paid' | 'partially_paid' | 'denied'
 * @property {Array}       serviceLines        - raw service line data
 */

/**
 * Parses a Stedi 835 ERA payload and returns an array of payment lines.
 *
 * @param {object} eraPayload - JSON returned by Stedi GET /edi/remittances/:id
 * @returns {EraPaymentLine[]}
 */
export function parseEra(eraPayload) {
  if (!eraPayload || typeof eraPayload !== 'object') return [];

  // Stedi may nest claims under different keys depending on version
  const claims = eraPayload.claims
    ?? eraPayload.claimPayments
    ?? eraPayload.transactions?.flatMap((t) => t.claims ?? t.claimPayments ?? [])
    ?? [];

  if (!Array.isArray(claims)) return [];

  return claims.map((claim) => {
    const paidAmount = Number(
      claim.claimPaymentAmount
      ?? claim.paidAmount
      ?? claim.paymentAmount
      ?? 0,
    );

    // Collect all adjustment groups (CO, OA, PI, PR, etc.)
    const groups = claim.claimAdjustmentGroups
      ?? claim.adjustmentGroups
      ?? claim.adjustments
      ?? [];

    let adjustmentReason = null;
    if (Array.isArray(groups) && groups.length > 0) {
      const firstGroup = groups[0];
      const groupCode = firstGroup.groupCode ?? firstGroup.code ?? '';
      const adjs = firstGroup.adjustments ?? firstGroup.items ?? [];
      if (Array.isArray(adjs) && adjs.length > 0) {
        const reasonCode = adjs[0].reasonCode ?? adjs[0].code ?? '';
        adjustmentReason = reasonCode ? `${groupCode}-${reasonCode}` : groupCode || null;
      }
    }

    const billedAmount = Number(
      claim.claimChargeAmount
      ?? claim.billedAmount
      ?? claim.chargeAmount
      ?? 0,
    );

    let eraStatus;
    if (paidAmount <= 0) {
      eraStatus = 'denied';
    } else if (paidAmount < billedAmount) {
      eraStatus = 'partially_paid';
    } else {
      eraStatus = 'paid';
    }

    return {
      payerClaimNumber: claim.payerClaimControlNumber
        ?? claim.payerClaimNumber
        ?? claim.claimNumber
        ?? null,
      patientControlNumber: claim.patientControlNumber
        ?? claim.claimControlNumber
        ?? null,
      paidAmount,
      adjustmentReason,
      eraStatus,
      serviceLines: claim.serviceLines ?? claim.lines ?? [],
    };
  });
}
