/**
 * ERA reconciler — polls Stedi for pending 835 remittances, matches payment
 * lines to claims, and posts payments.
 *
 * Idempotent: claims with era_received_at already set are skipped, so
 * re-running on the same ERA never double-posts.
 *
 * Acknowledgement happens AFTER the DB write succeeds. If the DB write fails,
 * the ERA stays in 'pending' state on Stedi and will be retried next cycle.
 */

const STEDI_BASE_URL = 'https://healthcare.us.stedi.com/2024-04-01';

async function stediRequest(method, path) {
  const apiKey = process.env.STEDI_API_KEY;
  if (!apiKey) throw new Error('STEDI_API_KEY not configured');
  const res = await fetch(`${STEDI_BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Stedi ${res.status}: ${text.slice(0, 200)}`);
  }
  return method === 'GET' ? res.json() : null;
}

async function listPendingEras() {
  const result = await stediRequest('GET', '/edi/remittances?status=pending&limit=50');
  return (result?.items ?? result?.remittances ?? []).map((era) => ({
    eraId: era.id,
    payerName: era.payerName ?? null,
    paymentDate: era.paymentDate ?? null,
  }));
}

async function getEraDetail(eraId) {
  return stediRequest('GET', `/edi/remittances/${encodeURIComponent(eraId)}`);
}

async function acknowledgeEra(eraId) {
  await stediRequest('POST', `/edi/remittances/${encodeURIComponent(eraId)}/acknowledge`);
}

function parsePaymentLines(eraDetail) {
  const claims = eraDetail.claims
    ?? eraDetail.claimPayments
    ?? eraDetail.transactions?.flatMap((t) => t.claims ?? t.claimPayments ?? [])
    ?? [];

  return (Array.isArray(claims) ? claims : []).map((claim) => {
    const paidAmount = Number(claim.claimPaymentAmount ?? claim.paidAmount ?? 0);
    const billedAmount = Number(claim.claimChargeAmount ?? claim.billedAmount ?? 0);

    const groups = claim.claimAdjustmentGroups ?? claim.adjustmentGroups ?? [];
    let adjustmentReason = null;
    if (Array.isArray(groups) && groups.length > 0) {
      const g = groups[0];
      const adjs = g.adjustments ?? g.items ?? [];
      const rc = Array.isArray(adjs) && adjs.length > 0 ? (adjs[0].reasonCode ?? adjs[0].code ?? '') : '';
      const gc = g.groupCode ?? g.code ?? '';
      adjustmentReason = rc ? `${gc}-${rc}` : gc || null;
    }

    let eraStatus = paidAmount <= 0 ? 'denied' : paidAmount < billedAmount ? 'partially_paid' : 'paid';

    return {
      payerClaimNumber: claim.payerClaimControlNumber ?? claim.payerClaimNumber ?? null,
      patientControlNumber: claim.patientControlNumber ?? claim.claimControlNumber ?? null,
      paidAmount,
      adjustmentReason,
      eraStatus,
    };
  });
}

export async function processEraReconciliation(pool, tenantId) {
  if (!process.env.DB_NAME || !process.env.STEDI_API_KEY) return;

  let eras;
  try {
    eras = await listPendingEras();
  } catch (err) {
    console.error(`[era-reconciler] [${tenantId}] Failed to list ERAs:`, err.message);
    return;
  }

  if (eras.length === 0) return;

  console.log(`[era-reconciler] [${tenantId}] Processing ${eras.length} pending ERA(s)`);

  for (const { eraId } of eras) {
    let detail;
    try {
      detail = await getEraDetail(eraId);
    } catch (err) {
      console.error(`[era-reconciler] [${tenantId}] Failed to fetch ERA ${eraId}:`, err.message);
      continue;
    }

    const lines = parsePaymentLines(detail);
    let allSucceeded = true;

    for (const line of lines) {
      const claimRef = line.payerClaimNumber ?? line.patientControlNumber;
      if (!claimRef) continue;

      try {
        // Look up by payer_claim_number first, fall back to id (patientControlNumber = our claim id)
        const [rows] = await pool.query(
          `SELECT id, era_received_at FROM claims
           WHERE tenant_id = ? AND (payer_claim_number = ? OR id = ?)
           LIMIT 1`,
          [tenantId, line.payerClaimNumber ?? '', line.patientControlNumber ?? ''],
        );

        if (rows.length === 0) {
          console.warn(`[era-reconciler] [${tenantId}] No claim found for ref ${claimRef}`);
          continue;
        }

        const claim = rows[0];

        // Idempotency guard — already reconciled
        if (claim.era_received_at) {
          continue;
        }

        await pool.query(
          `UPDATE claims
           SET status = ?, paid_amount = ?, adjustment_reason = ?
           WHERE id = ? AND tenant_id = ?`,
          [line.eraStatus, line.paidAmount, line.adjustmentReason, claim.id, tenantId],
        );
      } catch (err) {
        console.error(`[era-reconciler] [${tenantId}] Failed to post payment for ${claimRef}:`, err.message);
        allSucceeded = false;
      }
    }

    // Acknowledge only after all DB writes succeed
    if (allSucceeded) {
      try {
        await acknowledgeEra(eraId);

        // Stamp era_received_at on all matched claims for this ERA
        for (const line of lines) {
          const ref = line.payerClaimNumber ?? line.patientControlNumber;
          if (!ref) continue;
          await pool.query(
            `UPDATE claims SET era_received_at = NOW()
             WHERE tenant_id = ? AND (payer_claim_number = ? OR id = ?) AND era_received_at IS NULL`,
            [tenantId, line.payerClaimNumber ?? '', line.patientControlNumber ?? ''],
          ).catch(() => {});
        }
      } catch (err) {
        console.error(`[era-reconciler] [${tenantId}] Failed to acknowledge ERA ${eraId}:`, err.message);
      }
    }
  }
}
