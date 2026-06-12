import crypto from 'node:crypto';

export const DEMO_FEEDBACK_CATEGORIES = Object.freeze([
  'BUG',
  'ERROR',
  'UNEXPECTED_RESULT',
  'IMPROVEMENT',
]);

export const DEMO_FEEDBACK_ACTIONS = Object.freeze([
  'code_fixed',
  'update_applied',
  'suggestion_not_implemented',
  'suggestion_implemented',
  'bug_fixed',
  'error_fixed',
  'received_and_closed',
]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Feedback submission must be an object');
  }
}

function boundedString(value, field, max, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new TypeError(`${field} is required`);
    return null;
  }
  if (typeof value !== 'string') throw new TypeError(`${field} must be a string`);
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (required && !normalized) throw new TypeError(`${field} is required`);
  if (normalized.length > max) throw new RangeError(`${field} exceeds ${max} characters`);
  return normalized || null;
}

export function canonicalizeDemoRoute(value) {
  const route = boundedString(value, 'route', 500, { required: true });
  const withoutContext = route.split(/[?#]/, 1)[0].trim().toLowerCase();
  if (!withoutContext) throw new TypeError('route is required');
  return withoutContext.slice(0, 500);
}

export function validateDemoFeedbackSubmission(payload) {
  requireObject(payload);

  if (typeof payload.sessionId !== 'string' || !UUID_PATTERN.test(payload.sessionId)) {
    throw new TypeError('sessionId must be a UUID');
  }
  if (!DEMO_FEEDBACK_CATEGORIES.includes(payload.category)) {
    throw new TypeError('category is invalid');
  }
  if (!Array.isArray(payload.breadcrumbs) || payload.breadcrumbs.length > 5) {
    throw new TypeError('breadcrumbs must contain at most five routes');
  }
  if (
    !Number.isInteger(payload.sessionDurationSeconds)
    || payload.sessionDurationSeconds < 0
    || payload.sessionDurationSeconds > 2_592_000
  ) {
    throw new RangeError('session duration must be between 0 and 2592000 seconds');
  }

  const breadcrumbs = payload.breadcrumbs.map((route) => canonicalizeDemoRoute(route));
  const demoVersion = boundedString(payload.demoVersion, 'demoVersion', 100) ?? '';

  return {
    sessionId: payload.sessionId.toLowerCase(),
    route: canonicalizeDemoRoute(payload.route),
    category: payload.category,
    errorMessage: boundedString(payload.errorMessage, 'errorMessage', 4_000),
    note: boundedString(payload.note, 'note', 2_000),
    breadcrumbs,
    demoVersion,
    sessionDurationSeconds: payload.sessionDurationSeconds,
  };
}

function fingerprintPart(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function computeDemoFeedbackFingerprint({
  route,
  category,
  errorMessage = null,
  note = null,
}) {
  const canonicalRoute = canonicalizeDemoRoute(route);
  const normalizedCategory = fingerprintPart(category).toUpperCase();
  if (!DEMO_FEEDBACK_CATEGORIES.includes(normalizedCategory)) {
    throw new TypeError('category is invalid');
  }

  const content = normalizedCategory === 'ERROR' && errorMessage
    ? fingerprintPart(errorMessage)
    : fingerprintPart(note);
  return crypto
    .createHash('sha256')
    .update(`${canonicalRoute}|${normalizedCategory}|${content}`)
    .digest('hex');
}

export function hashDemoSessionId(sessionId) {
  if (typeof sessionId !== 'string' || !UUID_PATTERN.test(sessionId)) {
    throw new TypeError('sessionId must be a UUID');
  }
  return crypto.createHash('sha256').update(sessionId.toLowerCase()).digest('hex');
}

export class DemoFeedbackRateLimitError extends Error {
  constructor() {
    super('Demo feedback rate limit exceeded');
    this.name = 'DemoFeedbackRateLimitError';
    this.code = 'DEMO_FEEDBACK_RATE_LIMITED';
  }
}

function assertUuid(value, field = 'id') {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new TypeError(`${field} must be a UUID`);
  }
  return value.toLowerCase();
}

function parseDateFilter(value, field) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`${field} must be a date`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new TypeError(`${field} must be a date`);
  }
  return date;
}

async function resolveFeedbackIdentity(session, tenantPool, decryptValue) {
  if (!session) return { email: null, role: null };

  if (session.role === 'client' && session.portal_account_id) {
    const [rows] = await tenantPool.query(
      'SELECT email_enc FROM portal_accounts WHERE id = ? AND tenant_id = ? LIMIT 1',
      [session.portal_account_id, session.tenant_id],
    );
    return {
      email: rows[0]?.email_enc ? decryptValue(rows[0].email_enc) : null,
      role: 'client',
    };
  }

  if (session.staff_account_id) {
    const [rows] = await tenantPool.query(
      'SELECT email_enc FROM staff_accounts WHERE id = ? AND tenant_id = ? LIMIT 1',
      [session.staff_account_id, session.tenant_id],
    );
    return {
      email: rows[0]?.email_enc ? decryptValue(rows[0].email_enc) : null,
      role: boundedString(session.role, 'role', 64),
    };
  }

  return { email: null, role: null };
}

function mapFeedbackRow(row, decryptValue) {
  if (!row) return null;
  return {
    id: row.id,
    sessionId: row.session_id,
    route: row.route,
    category: row.category,
    errorMessage: row.error_message_enc ? decryptValue(row.error_message_enc) : null,
    note: row.note_enc ? decryptValue(row.note_enc) : null,
    breadcrumbs: Array.isArray(row.breadcrumbs) ? row.breadcrumbs : [],
    userEmail: row.user_email_enc ? decryptValue(row.user_email_enc) : null,
    userRole: row.user_role,
    demoVersion: row.demo_version,
    sessionDurationSeconds: row.session_duration_seconds,
    hitCount: Number(row.hit_count ?? 1),
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
    processed: Boolean(row.processed),
    action: row.action,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createDemoFeedbackService({
  tenantPool,
  systemPool,
  encrypt: encryptValue,
  decrypt: decryptValue,
}) {
  if (!tenantPool || !systemPool) throw new TypeError('tenantPool and systemPool are required');
  if (typeof encryptValue !== 'function' || typeof decryptValue !== 'function') {
    throw new TypeError('encrypt and decrypt functions are required');
  }

  return {
    async submit(payload, session) {
      const input = validateDemoFeedbackSubmission(payload);
      const identity = await resolveFeedbackIdentity(session, tenantPool, decryptValue);
      const fingerprint = computeDemoFeedbackFingerprint(input);
      const sessionKeyHash = hashDemoSessionId(input.sessionId);
      const [rows] = await systemPool.query(
        `SELECT * FROM public.submit_demo_feedback(
          ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?, ?, ?::jsonb
        )`,
        [
          sessionKeyHash,
          fingerprint,
          input.sessionId,
          input.route,
          input.category,
          encryptValue(input.errorMessage),
          encryptValue(input.note),
          JSON.stringify(input.breadcrumbs),
          encryptValue(identity.email),
          identity.role,
          input.demoVersion,
          input.sessionDurationSeconds,
          JSON.stringify({ source: 'demo_feedback' }),
        ],
      );
      const result = rows[0];
      if (result?.rate_limited) throw new DemoFeedbackRateLimitError();
      return {
        id: result?.report_id,
        hitCount: Number(result?.hit_count ?? 1),
      };
    },

    async list(filters = {}) {
      const where = [];
      const params = [];

      if (filters.view === 'open') where.push('processed = false');
      if (filters.view === 'done') where.push('processed = true');
      if (filters.category) {
        if (!DEMO_FEEDBACK_CATEGORIES.includes(filters.category)) {
          throw new TypeError('category is invalid');
        }
        where.push('category = ?');
        params.push(filters.category);
      }
      const fromDate = parseDateFilter(filters.from, 'from');
      const toDate = parseDateFilter(filters.to, 'to');
      if (fromDate) {
        where.push('created_at >= ?');
        params.push(fromDate.toISOString());
      }
      if (toDate) {
        toDate.setUTCDate(toDate.getUTCDate() + 1);
        where.push('created_at < ?');
        params.push(toDate.toISOString());
      }

      const [rows] = await systemPool.query(
        `SELECT * FROM public.demo_feedback_reports
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY processed ASC, created_at DESC
         LIMIT 500`,
        params,
      );
      const identityFilter = boundedString(filters.identity, 'identity', 320);
      const items = rows.map((row) => mapFeedbackRow(row, decryptValue));
      if (!identityFilter) return items;
      const needle = identityFilter.toLowerCase();
      return items.filter((item) => (
        item.userEmail?.toLowerCase().includes(needle)
        || item.userRole?.toLowerCase().includes(needle)
      ));
    },

    async updateTriage(id, patch) {
      const reportId = assertUuid(id);
      requireObject(patch);
      if (typeof patch.processed !== 'boolean') {
        throw new TypeError('processed must be a boolean');
      }
      const action = patch.action === null || patch.action === undefined
        ? null
        : boundedString(patch.action, 'action', 64);
      if (action !== null && !DEMO_FEEDBACK_ACTIONS.includes(action)) {
        throw new TypeError('action is invalid');
      }

      const [rows] = await systemPool.query(
        `UPDATE public.demo_feedback_reports
         SET processed = ?, action = ?, updated_at = NOW()
         WHERE id = ?
         RETURNING *`,
        [patch.processed, action, reportId],
      );
      return mapFeedbackRow(rows[0], decryptValue);
    },
  };
}
