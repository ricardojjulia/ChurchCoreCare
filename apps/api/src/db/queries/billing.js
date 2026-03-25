import pool from '../pool.js';
import { encryptJson, decryptJson } from '../../lib/encrypt.js';

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToServiceCode(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    code: row.code,
    description: row.description,
    unitRate: row.unit_rate,
    billingCategory: row.billing_category,
    cptCode: row.cpt_code,
    createdAt: row.created_at,
  };
}

function rowToFeeSchedule(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    rateType: row.rate_type,
    baseRate: row.base_rate,
    insurancePlans: typeof row.insurance_plans === 'string' ? JSON.parse(row.insurance_plans) : row.insurance_plans,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    createdAt: row.created_at,
  };
}

function rowToInvoice(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientId: row.client_id,
    lineItems: typeof row.line_items === 'string' ? JSON.parse(row.line_items) : row.line_items,
    insuranceInfo: row.insurance_info_enc ? decryptJson(row.insurance_info_enc) : null,
    status: row.status,
    dueDate: row.due_date,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
  };
}

function rowToPayment(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientId: row.client_id,
    invoiceId: row.invoice_id,
    amount: row.amount,
    paymentMethod: row.payment_method,
    paidAt: row.paid_at instanceof Date ? row.paid_at.toISOString() : row.paid_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function rowToSuperbill(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientId: row.client_id,
    invoiceId: row.invoice_id,
    serviceDate: row.service_date,
    diagnosisCodes: typeof row.diagnosis_codes === 'string' ? JSON.parse(row.diagnosis_codes) : row.diagnosis_codes,
    procedureCodes: typeof row.procedure_codes === 'string' ? JSON.parse(row.procedure_codes) : row.procedure_codes,
    renderingProvider: row.rendering_provider,
    insurancePlan: row.insurance_plan,
    totalCharge: row.total_charge,
    status: row.status,
    createdAt: row.created_at,
  };
}

function rowToClaim(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientId: row.client_id,
    superbillId: row.superbill_id,
    insurancePlan: row.insurance_plan,
    submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : row.submitted_at,
    status: row.status,
    adjudicationNotes: row.adjudication_notes,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Service Codes
// ---------------------------------------------------------------------------

export async function listServiceCodes(tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM service_codes WHERE tenant_id = ?',
    [tenantId]
  );
  return rows.map(rowToServiceCode);
}

export async function getServiceCodeById(id, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM service_codes WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToServiceCode(rows[0]);
}

export async function createServiceCode({ id, tenantId, code, description, unitRate, billingCategory, cptCode }) {
  await pool.query(
    `INSERT INTO service_codes (id, tenant_id, code, description, unit_rate, billing_category, cpt_code)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, code, description, unitRate, billingCategory, cptCode]
  );
  return getServiceCodeById(id, tenantId);
}

export async function updateServiceCode(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.code !== undefined) { setClauses.push('code = ?'); values.push(fields.code); }
  if (fields.description !== undefined) { setClauses.push('description = ?'); values.push(fields.description); }
  if (fields.unitRate !== undefined) { setClauses.push('unit_rate = ?'); values.push(fields.unitRate); }
  if (fields.billingCategory !== undefined) { setClauses.push('billing_category = ?'); values.push(fields.billingCategory); }
  if (fields.cptCode !== undefined) { setClauses.push('cpt_code = ?'); values.push(fields.cptCode); }

  if (setClauses.length > 0) {
    values.push(id, tenantId);
    await pool.query(
      `UPDATE service_codes SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
  }

  return getServiceCodeById(id, tenantId);
}

// ---------------------------------------------------------------------------
// Fee Schedules
// ---------------------------------------------------------------------------

export async function listFeeSchedules(tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM fee_schedules WHERE tenant_id = ?',
    [tenantId]
  );
  return rows.map(rowToFeeSchedule);
}

export async function getFeeScheduleById(id, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM fee_schedules WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToFeeSchedule(rows[0]);
}

export async function createFeeSchedule({
  id,
  tenantId,
  name,
  rateType,
  baseRate,
  insurancePlans,
  effectiveFrom,
  effectiveTo,
}) {
  await pool.query(
    `INSERT INTO fee_schedules
       (id, tenant_id, name, rate_type, base_rate, insurance_plans, effective_from, effective_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, name, rateType, baseRate, JSON.stringify(insurancePlans), effectiveFrom, effectiveTo]
  );
  return getFeeScheduleById(id, tenantId);
}

export async function updateFeeSchedule(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.name !== undefined) { setClauses.push('name = ?'); values.push(fields.name); }
  if (fields.rateType !== undefined) { setClauses.push('rate_type = ?'); values.push(fields.rateType); }
  if (fields.baseRate !== undefined) { setClauses.push('base_rate = ?'); values.push(fields.baseRate); }
  if (fields.insurancePlans !== undefined) { setClauses.push('insurance_plans = ?'); values.push(JSON.stringify(fields.insurancePlans)); }
  if (fields.effectiveFrom !== undefined) { setClauses.push('effective_from = ?'); values.push(fields.effectiveFrom); }
  if (fields.effectiveTo !== undefined) { setClauses.push('effective_to = ?'); values.push(fields.effectiveTo); }

  if (setClauses.length > 0) {
    values.push(id, tenantId);
    await pool.query(
      `UPDATE fee_schedules SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
  }

  return getFeeScheduleById(id, tenantId);
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export async function listInvoices(tenantId, clientId) {
  if (clientId !== undefined) {
    const [rows] = await pool.query(
      'SELECT * FROM invoices WHERE tenant_id = ? AND client_id = ?',
      [tenantId, clientId]
    );
    return rows.map(rowToInvoice);
  }
  const [rows] = await pool.query(
    'SELECT * FROM invoices WHERE tenant_id = ?',
    [tenantId]
  );
  return rows.map(rowToInvoice);
}

export async function getInvoiceById(id, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM invoices WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToInvoice(rows[0]);
}

export async function createInvoice({
  id,
  tenantId,
  clientId,
  lineItems,
  insuranceInfo,
  status,
  dueDate,
  totalAmount,
}) {
  await pool.query(
    `INSERT INTO invoices
       (id, tenant_id, client_id, line_items, insurance_info_enc, status, due_date, total_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tenantId,
      clientId,
      JSON.stringify(lineItems),
      insuranceInfo ? encryptJson(insuranceInfo) : null,
      status,
      dueDate,
      totalAmount,
    ]
  );
  return getInvoiceById(id, tenantId);
}

export async function updateInvoice(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.clientId !== undefined) { setClauses.push('client_id = ?'); values.push(fields.clientId); }
  if (fields.lineItems !== undefined) { setClauses.push('line_items = ?'); values.push(JSON.stringify(fields.lineItems)); }
  if (fields.insuranceInfo !== undefined) { setClauses.push('insurance_info_enc = ?'); values.push(encryptJson(fields.insuranceInfo)); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }
  if (fields.dueDate !== undefined) { setClauses.push('due_date = ?'); values.push(fields.dueDate); }
  if (fields.totalAmount !== undefined) { setClauses.push('total_amount = ?'); values.push(fields.totalAmount); }

  if (setClauses.length > 0) {
    values.push(id, tenantId);
    await pool.query(
      `UPDATE invoices SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
  }

  return getInvoiceById(id, tenantId);
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function listPayments(tenantId, invoiceId) {
  if (invoiceId !== undefined) {
    const [rows] = await pool.query(
      'SELECT * FROM payments WHERE tenant_id = ? AND invoice_id = ?',
      [tenantId, invoiceId]
    );
    return rows.map(rowToPayment);
  }
  const [rows] = await pool.query(
    'SELECT * FROM payments WHERE tenant_id = ?',
    [tenantId]
  );
  return rows.map(rowToPayment);
}

export async function createPayment({
  id,
  tenantId,
  clientId,
  invoiceId,
  amount,
  paymentMethod,
  paidAt,
  notes,
}) {
  await pool.query(
    `INSERT INTO payments
       (id, tenant_id, client_id, invoice_id, amount, payment_method, paid_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, clientId, invoiceId, amount, paymentMethod, paidAt, notes]
  );
  const [rows] = await pool.query(
    'SELECT * FROM payments WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  return rowToPayment(rows[0]);
}

// ---------------------------------------------------------------------------
// Superbills
// ---------------------------------------------------------------------------

export async function listSuperbills(tenantId, clientId) {
  if (clientId !== undefined) {
    const [rows] = await pool.query(
      'SELECT * FROM superbills WHERE tenant_id = ? AND client_id = ?',
      [tenantId, clientId]
    );
    return rows.map(rowToSuperbill);
  }
  const [rows] = await pool.query(
    'SELECT * FROM superbills WHERE tenant_id = ?',
    [tenantId]
  );
  return rows.map(rowToSuperbill);
}

export async function createSuperbill({
  id,
  tenantId,
  clientId,
  invoiceId,
  serviceDate,
  diagnosisCodes,
  procedureCodes,
  renderingProvider,
  insurancePlan,
  totalCharge,
  status,
}) {
  await pool.query(
    `INSERT INTO superbills
       (id, tenant_id, client_id, invoice_id, service_date, diagnosis_codes, procedure_codes,
        rendering_provider, insurance_plan, total_charge, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tenantId,
      clientId,
      invoiceId,
      serviceDate,
      JSON.stringify(diagnosisCodes),
      JSON.stringify(procedureCodes),
      renderingProvider,
      insurancePlan,
      totalCharge,
      status,
    ]
  );
  const [rows] = await pool.query(
    'SELECT * FROM superbills WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  return rowToSuperbill(rows[0]);
}

export async function updateSuperbill(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.clientId !== undefined) { setClauses.push('client_id = ?'); values.push(fields.clientId); }
  if (fields.invoiceId !== undefined) { setClauses.push('invoice_id = ?'); values.push(fields.invoiceId); }
  if (fields.serviceDate !== undefined) { setClauses.push('service_date = ?'); values.push(fields.serviceDate); }
  if (fields.diagnosisCodes !== undefined) { setClauses.push('diagnosis_codes = ?'); values.push(JSON.stringify(fields.diagnosisCodes)); }
  if (fields.procedureCodes !== undefined) { setClauses.push('procedure_codes = ?'); values.push(JSON.stringify(fields.procedureCodes)); }
  if (fields.renderingProvider !== undefined) { setClauses.push('rendering_provider = ?'); values.push(fields.renderingProvider); }
  if (fields.insurancePlan !== undefined) { setClauses.push('insurance_plan = ?'); values.push(fields.insurancePlan); }
  if (fields.totalCharge !== undefined) { setClauses.push('total_charge = ?'); values.push(fields.totalCharge); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }

  if (setClauses.length > 0) {
    values.push(id, tenantId);
    await pool.query(
      `UPDATE superbills SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
  }

  const [rows] = await pool.query(
    'SELECT * FROM superbills WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToSuperbill(rows[0]);
}

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

export async function listClaims(tenantId, status) {
  if (status !== undefined) {
    const [rows] = await pool.query(
      'SELECT * FROM claims WHERE tenant_id = ? AND status = ?',
      [tenantId, status]
    );
    return rows.map(rowToClaim);
  }
  const [rows] = await pool.query(
    'SELECT * FROM claims WHERE tenant_id = ?',
    [tenantId]
  );
  return rows.map(rowToClaim);
}

export async function createClaim({
  id,
  tenantId,
  clientId,
  superbillId,
  insurancePlan,
  submittedAt,
  status,
  adjudicationNotes,
}) {
  await pool.query(
    `INSERT INTO claims
       (id, tenant_id, client_id, superbill_id, insurance_plan, submitted_at, status, adjudication_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, clientId, superbillId, insurancePlan, submittedAt, status, adjudicationNotes]
  );
  const [rows] = await pool.query(
    'SELECT * FROM claims WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  return rowToClaim(rows[0]);
}

export async function updateClaim(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.clientId !== undefined) { setClauses.push('client_id = ?'); values.push(fields.clientId); }
  if (fields.superbillId !== undefined) { setClauses.push('superbill_id = ?'); values.push(fields.superbillId); }
  if (fields.insurancePlan !== undefined) { setClauses.push('insurance_plan = ?'); values.push(fields.insurancePlan); }
  if (fields.submittedAt !== undefined) { setClauses.push('submitted_at = ?'); values.push(fields.submittedAt); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }
  if (fields.adjudicationNotes !== undefined) { setClauses.push('adjudication_notes = ?'); values.push(fields.adjudicationNotes); }

  if (setClauses.length > 0) {
    values.push(id, tenantId);
    await pool.query(
      `UPDATE claims SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
  }

  const [rows] = await pool.query(
    'SELECT * FROM claims WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToClaim(rows[0]);
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function getAgingReport(tenantId) {
  const [rows] = await pool.query(
    'SELECT status, COUNT(*) as count, SUM(total_amount) as total FROM invoices WHERE tenant_id = ? GROUP BY status',
    [tenantId]
  );
  return rows;
}
