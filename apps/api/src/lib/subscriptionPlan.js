/**
 * Subscription Plan Limits + UI Persona service.
 *
 * Manages plan-based counselor/client limits with a grace period, and the
 * ui_persona field that tells the frontend which UI mode to render.
 *
 * Tenant isolation is enforced on every DB query.
 * No PHI is logged.
 */

// ─── Plan configuration ───────────────────────────────────────────────────────

const PLAN_LIMITS = {
  solo:     { counselorLimit: 3,    clientLimit: 100,  uiPersona: 'solo' },
  group:    { counselorLimit: null, clientLimit: null,  uiPersona: 'practice' },
  standard: { counselorLimit: null, clientLimit: null,  uiPersona: 'practice' },
  ministry: { counselorLimit: null, clientLimit: null,  uiPersona: 'practice' },
};

const GRACE_PERIOD_DAYS = 14;
const PERSONA_MUTE_THRESHOLD = 6;

const VALID_PERSONAS = new Set(['solo', 'practice']);

// ─── Display name map ─────────────────────────────────────────────────────────

function planDisplayName(planType) {
  const map = {
    solo:     'Personal',
    group:    'Practice',
    standard: 'Practice',
    ministry: 'Ministry',
  };
  return map[planType] ?? 'Practice';
}

// ─── Exported functions ───────────────────────────────────────────────────────

/**
 * Returns the raw plan/persona/limit row for a tenant, or null if not found.
 *
 * @param {string} tenantId
 * @param {object} db  pg pool
 * @returns {Promise<object|null>}
 */
export async function getTenantPlanInfo(tenantId, db) {
  const result = await db.query(
    `SELECT plan_type,
            ui_persona,
            counselor_limit,
            client_limit,
            limit_grace_started_at,
            persona_upgrade_dismiss_count,
            persona_upgrade_muted
       FROM tenants
      WHERE id = $1
      LIMIT 1`,
    [tenantId],
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

/**
 * Returns the active (non-archived) counselor and client counts for a tenant.
 *
 * @param {string} tenantId
 * @param {object} db  pg pool
 * @returns {Promise<{ activeCounselors: number, activeClients: number }>}
 */
export async function getUsageCounts(tenantId, db) {
  const [counselorResult, clientResult] = await Promise.all([
    db.query(
      `SELECT COUNT(*) AS cnt
         FROM staff_members
        WHERE tenant_id = $1
          AND (archived IS NULL OR archived = FALSE)`,
      [tenantId],
    ),
    db.query(
      `SELECT COUNT(*) AS cnt
         FROM clients
        WHERE tenant_id = $1
          AND (archived IS NULL OR archived = FALSE)`,
      [tenantId],
    ),
  ]);

  return {
    activeCounselors: Number(counselorResult.rows[0].cnt ?? 0),
    activeClients:    Number(clientResult.rows[0].cnt ?? 0),
  };
}

/**
 * Returns a full subscription summary for the tenant.
 *
 * @param {string} tenantId
 * @param {object} db  pg pool
 * @returns {Promise<object>}
 */
export async function getSubscriptionSummary(tenantId, db) {
  const [info, usage] = await Promise.all([
    getTenantPlanInfo(tenantId, db),
    getUsageCounts(tenantId, db),
  ]);

  const planType   = info?.plan_type    ?? 'standard';
  const limits     = PLAN_LIMITS[planType] ?? PLAN_LIMITS.standard;
  const uiPersona  = info?.ui_persona   ?? 'practice';
  const counselorLimit = info?.counselor_limit ?? limits.counselorLimit ?? null;
  const clientLimit    = info?.client_limit    ?? limits.clientLimit    ?? null;

  // Grace period computation (read-only — writing grace timestamps happens in checkLimitBlock)
  const graceStartedAt = info?.limit_grace_started_at ?? null;
  let graceDaysRemaining = null;
  let graceExpired       = false;
  let counselorsInGrace  = false;
  let clientsInGrace     = false;

  if (graceStartedAt) {
    const elapsedMs = Date.now() - new Date(graceStartedAt).getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    graceExpired = elapsedDays >= GRACE_PERIOD_DAYS;
    graceDaysRemaining = graceExpired ? 0 : Math.ceil(GRACE_PERIOD_DAYS - elapsedDays);

    if (counselorLimit !== null && usage.activeCounselors >= counselorLimit) {
      counselorsInGrace = !graceExpired;
    }
    if (clientLimit !== null && usage.activeClients >= clientLimit) {
      clientsInGrace = !graceExpired;
    }
  }

  const dismissCount = Number(info?.persona_upgrade_dismiss_count ?? 0);
  const muted        = Boolean(info?.persona_upgrade_muted ?? false);

  return {
    plan: {
      planType,
      uiPersona,
      planDisplayName: planDisplayName(planType),
      counselorLimit,
      clientLimit,
    },
    usage: {
      activeCounselors: usage.activeCounselors,
      activeClients:    usage.activeClients,
    },
    grace: {
      counselorsInGrace,
      clientsInGrace,
      graceStartedAt:     graceStartedAt ? new Date(graceStartedAt).toISOString() : null,
      graceDaysRemaining: graceExpired ? 0 : graceDaysRemaining,
      graceExpired,
    },
    personaUpgrade: {
      dismissCount,
      muted,
      shouldPromptUpgrade: uiPersona === 'solo' && usage.activeCounselors >= 2 && !muted,
    },
  };
}

/**
 * Checks whether creating a new counselor or client would be blocked by plan limits.
 * Starts the grace period on first breach if it hasn't started yet (writes to DB).
 *
 * @param {string} tenantId
 * @param {'counselor'|'client'} resourceType
 * @param {object} db  pg pool
 * @returns {Promise<{ blocked: boolean, reason?: string, graceStarted?: boolean, graceDaysRemaining?: number }>}
 */
export async function checkLimitBlock(tenantId, resourceType, db) {
  const [info, usage] = await Promise.all([
    getTenantPlanInfo(tenantId, db),
    getUsageCounts(tenantId, db),
  ]);

  const planType = info?.plan_type ?? 'standard';
  const limits   = PLAN_LIMITS[planType] ?? PLAN_LIMITS.standard;

  const limit   = resourceType === 'counselor'
    ? (info?.counselor_limit ?? limits.counselorLimit ?? null)
    : (info?.client_limit    ?? limits.clientLimit    ?? null);

  const current = resourceType === 'counselor'
    ? usage.activeCounselors
    : usage.activeClients;

  // No limit configured — never blocked
  if (limit === null) {
    return { blocked: false };
  }

  // Below the limit — not blocked
  if (current < limit) {
    return { blocked: false };
  }

  // At or above the limit — grace period logic
  const graceStartedAt = info?.limit_grace_started_at ?? null;

  if (graceStartedAt === null) {
    // Start grace period now
    await db.query(
      `UPDATE tenants SET limit_grace_started_at = NOW() WHERE id = $1`,
      [tenantId],
    );
    return { blocked: false, graceStarted: true, graceDaysRemaining: GRACE_PERIOD_DAYS };
  }

  const elapsedMs   = Date.now() - new Date(graceStartedAt).getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

  if (elapsedDays < GRACE_PERIOD_DAYS) {
    const graceDaysRemaining = Math.ceil(GRACE_PERIOD_DAYS - elapsedDays);
    return { blocked: false, graceDaysRemaining };
  }

  // Grace has expired — hard block
  return { blocked: true, reason: 'limit_exceeded_grace_expired' };
}

/**
 * Sets the ui_persona field on a tenant.
 *
 * @param {string} tenantId
 * @param {'solo'|'practice'} persona
 * @param {object} db  pg pool
 * @returns {Promise<{ updated: true }>}
 */
export async function setUiPersona(tenantId, persona, db) {
  if (!VALID_PERSONAS.has(persona)) {
    const err = new Error(`Invalid persona: ${persona}`);
    err.code = 'validation_error';
    err.field = 'persona';
    throw err;
  }

  const result = await db.query(
    `UPDATE tenants SET ui_persona = $1 WHERE id = $2`,
    [persona, tenantId],
  );

  if (result.rowCount === 0) {
    const err = new Error('Tenant not found');
    err.code = 'tenant_not_found';
    throw err;
  }

  return { updated: true };
}

/**
 * Increments the persona upgrade dismiss counter for a tenant.
 *
 * @param {string} tenantId
 * @param {object} db  pg pool
 * @returns {Promise<{ dismissCount: number }>}
 */
export async function recordPersonaDismiss(tenantId, db) {
  const result = await db.query(
    `UPDATE tenants
        SET persona_upgrade_dismiss_count = persona_upgrade_dismiss_count + 1
      WHERE id = $1
  RETURNING persona_upgrade_dismiss_count`,
    [tenantId],
  );

  const dismissCount = Number(result.rows[0]?.persona_upgrade_dismiss_count ?? 1);
  return { dismissCount };
}

/**
 * Mutes the persona upgrade prompt for a tenant (sets persona_upgrade_muted = TRUE).
 *
 * @param {string} tenantId
 * @param {object} db  pg pool
 * @returns {Promise<{ muted: true }>}
 */
export async function mutePersonaUpgrade(tenantId, db) {
  await db.query(
    `UPDATE tenants SET persona_upgrade_muted = TRUE WHERE id = $1`,
    [tenantId],
  );
  return { muted: true };
}

/**
 * Applies the canonical plan defaults (limits + ui_persona) for a given plan type.
 * Called during tenant provisioning.
 *
 * @param {string} tenantId
 * @param {string} planType
 * @param {object} db  pg pool or connection
 */
export async function applyPlanDefaults(tenantId, planType, db) {
  const limits = PLAN_LIMITS[planType] ?? PLAN_LIMITS.standard;
  await db.query(
    `UPDATE tenants
        SET counselor_limit = $1,
            client_limit    = $2,
            ui_persona      = $3
      WHERE id = $4`,
    [limits.counselorLimit, limits.clientLimit, limits.uiPersona, tenantId],
  );
}
