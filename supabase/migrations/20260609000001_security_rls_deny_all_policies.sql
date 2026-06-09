-- ─────────────────────────────────────────────────────────────────────────────
-- Security: Explicit deny-all RLS policies on all public tables
--
-- Addresses Supabase Security Advisor INFO findings:
--   rls_enabled_no_policy — RLS enabled but no policies defined
--
-- Design notes:
--   • The app connects as the `postgres` superuser which bypasses RLS entirely.
--     These policies do NOT affect application behavior.
--   • RESTRICTIVE FOR ALL USING (false) WITH CHECK (false) is an explicit
--     deny for every non-superuser role (anon, authenticated, etc.) on every
--     operation (SELECT, INSERT, UPDATE, DELETE). This makes the intent
--     unambiguous: all data access goes through the Node.js API layer only.
-- ─────────────────────────────────────────────────────────────────────────────

-- Core platform tables
CREATE POLICY deny_all ON public.schema_migrations            AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.tenants                      AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.tenant_slugs                 AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.tenant_subscriptions         AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.tenant_provisioning          AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.practices                    AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.locations                    AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Staff and accounts
CREATE POLICY deny_all ON public.staff_members                AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.staff_accounts               AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.staff_licenses               AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.staff_certifications         AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.staff_specialty_profiles     AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.staff_employment             AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.staff_faith_profiles         AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.supervisor_assignments       AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Sessions (app-level auth)
CREATE POLICY deny_all ON public.sessions                     AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.impersonation_sessions       AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Clients and clinical data
CREATE POLICY deny_all ON public.clients                      AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.client_lifecycles            AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.client_addresses             AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.client_phones                AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.client_contacts              AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.client_insurance             AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.client_referring_providers   AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.client_diagnoses             AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.client_medications           AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.client_allergies             AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.client_clinical_history      AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.client_faith_profiles        AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.client_legal                 AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Appointments and scheduling
CREATE POLICY deny_all ON public.appointments                 AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.appointment_series           AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.availability_templates       AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.availability_overrides       AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.waitlist_metadata            AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Clinical records
CREATE POLICY deny_all ON public.consent_records              AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.intake_packets               AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.treatment_plans              AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.progress_notes               AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Documents and inventory
CREATE POLICY deny_all ON public.document_templates           AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.document_assignments         AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.inventory_definitions        AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.inventory_assignments        AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Scheduling and notifications
CREATE POLICY deny_all ON public.reminders                    AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.push_subscriptions           AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Billing and payments
CREATE POLICY deny_all ON public.service_codes                AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.fee_schedules                AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.claims                       AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.invoices                     AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.payments                     AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.superbills                   AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Portal
CREATE POLICY deny_all ON public.portal_accounts              AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.portal_sessions              AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.portal_password_resets       AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.portal_settings              AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.portal_client_profiles       AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.portal_resources             AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.portal_uploads               AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.portal_data_right_requests   AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.portal_message_threads       AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.portal_messages              AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.portal_appointment_requests  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.portal_registration_requests AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Forms
CREATE POLICY deny_all ON public.form_catalog                 AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.form_assignments             AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.form_submissions             AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Offerings and faith-integrated features
CREATE POLICY deny_all ON public.offerings                    AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.faith_note_templates         AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.faith_goal_templates         AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.faith_consent_variants       AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.faith_resources              AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.faith_inventories            AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.faith_church_referrals       AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.faith_language_preferences   AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.faith_pastoral_registers     AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Compliance and governance
CREATE POLICY deny_all ON public.audit_events                 AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.data_export_jobs             AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.retention_policies           AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Workflow and telemetry
CREATE POLICY deny_all ON public.workflow_recommendation_states AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.video_join_tokens            AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Localization governance
CREATE POLICY deny_all ON public.localization_locales               AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.localization_catalog_versions      AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.localization_validation_reports    AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.localization_review_assignments    AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.localization_review_decisions      AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.localization_activation_history    AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Staff supervision and licensure tracking
CREATE POLICY deny_all ON public.time_entries                 AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.licensure_goals              AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Group therapy
CREATE POLICY deny_all ON public.therapy_groups               AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.group_members                AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.group_sessions               AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.group_session_notes          AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.group_member_notes           AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

-- Relational/family units
CREATE POLICY deny_all ON public.relational_units             AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY deny_all ON public.relational_unit_members      AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
