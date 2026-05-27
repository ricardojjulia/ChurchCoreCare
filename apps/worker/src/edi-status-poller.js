/**
 * EDI claim status poller.
 *
 * Queries claims with status='submitted' and a stedi_submission_id, then
 * fetches the current status from Stedi and updates the record accordingly.
 *
 * Transitions:
 *   submitted → accepted  (when Stedi confirms payer acceptance)
 *   submitted → rejected  (when Stedi reports rejection)
 *   submitted → submitted (still pending — no change)
 */

const STEDI_BASE_URL = 'https://healthcare.us.stedi.com/2024-04-01';

async function stediGet(path) {
  const apiKey = process.env.STEDI_API_KEY;
  if (!apiKey) throw new Error('STEDI_API_KEY not configured');
  const res = await fetch(`${STEDI_BASE_URL}${path}`, {
    headers: { Authorization: `Key ${apiKey}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Stedi ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function mapStediStatus(raw) {
  const s = (raw ?? '').toLowerCase();
  if (s === 'accepted' || s === 'approved') return 'accepted';
  if (s === 'rejected' || s === 'denied') return 'rejected';
  return null; // still pending
}

export async function pollClaimStatuses(pool, tenantId) {
  if (!process.env.DB_NAME || !process.env.STEDI_API_KEY) return;

  let rows;
  try {
    const result = await pool.query(
      `SELECT id, stedi_submission_id FROM claims
       WHERE tenant_id = $1 AND status = 'submitted' AND stedi_submission_id IS NOT NULL
       LIMIT 50`,
      [tenantId],
    );
    rows = result.rows;
  } catch (err) {
    console.error('[edi-poller] DB query failed:', err.message);
    return;
  }

  for (const row of rows) {
    try {
      const data = await stediGet(`/claim-status/${encodeURIComponent(row.stedi_submission_id)}`);
      const newStatus = mapStediStatus(data.status);
      const fields = {
        payerClaimNumber: data.payerClaimNumber ?? null,
        rejectionReason: data.rejectionReason ?? null,
      };
      if (newStatus === 'accepted') {
        fields.status = 'accepted';
      } else if (newStatus === 'rejected') {
        fields.status = 'rejected';
      }

      const setClauses = [];
      const values = [];
      if (fields.status) { setClauses.push(`status = $${values.length + 1}`); values.push(fields.status); }
      if (fields.payerClaimNumber != null) { setClauses.push(`payer_claim_number = $${values.length + 1}`); values.push(fields.payerClaimNumber); }
      if (fields.rejectionReason != null) { setClauses.push(`rejection_reason = $${values.length + 1}`); values.push(fields.rejectionReason); }

      if (setClauses.length > 0) {
        values.push(row.id, tenantId);
        await pool.query(
          `UPDATE claims SET ${setClauses.join(', ')} WHERE id = $${values.length - 1} AND tenant_id = $${values.length}`,
          values,
        );
      }
    } catch (err) {
      console.error(`[edi-poller] Failed to update claim ${row.id}:`, err.message);
    }
  }
}
