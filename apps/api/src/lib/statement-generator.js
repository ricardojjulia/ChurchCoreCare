/**
 * Patient statement generator — produces a print-ready HTML document.
 *
 * No PDF library required; the browser's print dialog saves to PDF.
 * The response uses Content-Type: text/html; charset=utf-8 with
 * print-optimised CSS embedded. PHI is decrypted only for this response
 * and never logged.
 *
 * The generator is pure (no I/O). Callers fetch the data and pass it in.
 */

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return String(iso); }
}

function fmtCurrency(n) {
  if (n == null) return '—';
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * @param {object} opts
 * @param {object} opts.practice       - { name, addressLine1, city, state, postalCode, phone }
 * @param {object} opts.client         - { firstName, lastName } (already decrypted)
 * @param {object[]} opts.claims       - array of claim rows
 * @param {object[]} opts.invoices     - array of invoice rows
 * @param {string}  opts.generatedAt   - ISO date string
 * @returns {string} HTML document
 */
export function generateStatement({ practice, client, claims, invoices, generatedAt }) {
  const clientName = esc(`${client?.firstName ?? ''} ${client?.lastName ?? ''}`.trim() || 'Patient');
  const practiceName = esc(practice?.name ?? 'ChurchCore Care Practice');
  const practiceAddress = [practice?.addressLine1, practice?.city, practice?.state, practice?.postalCode]
    .filter(Boolean).join(', ');
  const practicePhone = esc(practice?.phone ?? '');
  const dateStr = fmtDate(generatedAt);

  const claimRows = (claims ?? []).map((c) => `
    <tr>
      <td>${esc(c.id?.slice(0, 8))}…</td>
      <td>${fmtDate(c.serviceDate ?? c.submittedAt)}</td>
      <td>${esc(c.status ?? '—')}</td>
      <td class="amount">${fmtCurrency(c.amount ?? null)}</td>
      <td class="amount">${fmtCurrency(c.paidAmount)}</td>
      <td class="amount">${c.adjustmentReason ? esc(c.adjustmentReason) : '—'}</td>
    </tr>`).join('');

  const invoiceRows = (invoices ?? []).map((inv) => `
    <tr>
      <td>${fmtDate(inv.dueAt ?? inv.createdAt)}</td>
      <td class="amount">${fmtCurrency(inv.amount)}</td>
      <td class="amount">${fmtCurrency(inv.balance)}</td>
      <td>${esc(inv.status ?? '—')}</td>
    </tr>`).join('');

  const totalBalance = (invoices ?? []).reduce((s, inv) => s + Number(inv.balance ?? 0), 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Patient Statement — ${clientName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #111; padding: 32px; max-width: 780px; margin: 0 auto; }
  h1 { font-size: 18pt; color: #1c3d5a; margin-bottom: 4px; }
  h2 { font-size: 12pt; color: #1c3d5a; margin: 20px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .practice-info { font-size: 10pt; color: #555; }
  .meta { font-size: 10pt; color: #555; text-align: right; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f0f4f8; text-align: left; padding: 6px 8px; font-size: 10pt; border-bottom: 2px solid #ccc; }
  td { padding: 5px 8px; font-size: 10pt; border-bottom: 1px solid #e8e8e8; vertical-align: top; }
  .amount { text-align: right; font-variant-numeric: tabular-nums; }
  .total-row { font-weight: bold; background: #f8f9fa; }
  .footer { margin-top: 40px; font-size: 9pt; color: #888; border-top: 1px solid #ddd; padding-top: 12px; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>${practiceName}</h1>
    <div class="practice-info">${esc(practiceAddress)}</div>
    ${practicePhone ? `<div class="practice-info">${practicePhone}</div>` : ''}
  </div>
  <div class="meta">
    <div><strong>Patient Statement</strong></div>
    <div>Generated: ${dateStr}</div>
    <div>Patient: ${clientName}</div>
  </div>
</div>

<h2>Insurance Claims</h2>
${claimRows ? `
<table>
  <thead><tr>
    <th>Claim ID</th><th>Service Date</th><th>Status</th>
    <th class="amount">Billed</th><th class="amount">Paid</th><th>Adj. Code</th>
  </tr></thead>
  <tbody>${claimRows}</tbody>
</table>` : '<p style="color:#888;font-size:10pt;">No claims on file.</p>'}

<h2>Account Balance</h2>
${invoiceRows ? `
<table>
  <thead><tr>
    <th>Due Date</th><th class="amount">Amount</th><th class="amount">Balance</th><th>Status</th>
  </tr></thead>
  <tbody>${invoiceRows}
  <tr class="total-row">
    <td colspan="2">Total Outstanding</td>
    <td class="amount">${fmtCurrency(totalBalance)}</td>
    <td></td>
  </tr>
  </tbody>
</table>` : '<p style="color:#888;font-size:10pt;">No balance on file.</p>'}

<div class="footer">
  This statement is for informational purposes. For billing questions contact ${esc(practicePhone || practiceName)}.
  ChurchCore Care — Confidential Patient Record.
</div>

</body>
</html>`;
}
