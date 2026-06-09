-- ─────────────────────────────────────────────────────────────────────────────
-- Security Remediation: RLS on all public tables + function search_path fix
--
-- Addresses Supabase Security Advisor findings (2026-06-09):
--   WARN  function_search_path_mutable — public.set_updated_at
--   ERROR rls_disabled_in_public      — 95 tables in public schema
--
-- Design notes:
--   • The app connects as the `postgres` superuser (DB_USER = postgres.*),
--     which bypasses RLS in PostgreSQL. Enabling RLS does NOT affect the API.
--   • No RLS policies are added: the intent is to block direct PostgREST /
--     anon access entirely. All data access goes through the Node.js API layer.
--   • set_updated_at is a trigger function; SET search_path = '' pins it to an
--     empty path and prevents search_path injection via function context.
-- ─────────────────────────────────────────────────────────────────────────────

-- Fix mutable search_path on set_updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ─── Enable RLS on all public tables ─────────────────────────────────────────
-- Core platform tables
ALTER TABLE public.schema_migrations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_slugs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_provisioning         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practices                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations                   ENABLE ROW LEVEL SECURITY;

-- Staff and accounts
ALTER TABLE public.staff_members               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_accounts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_licenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_certifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_specialty_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_employment            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_faith_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisor_assignments      ENABLE ROW LEVEL SECURITY;

-- Sessions (app-level auth)
ALTER TABLE public.sessions                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonation_sessions      ENABLE ROW LEVEL SECURITY;

-- Clients and clinical data
ALTER TABLE public.clients                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_lifecycles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_addresses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_phones               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_insurance            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_referring_providers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_diagnoses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_medications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_allergies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_clinical_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_faith_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_legal                ENABLE ROW LEVEL SECURITY;

-- Appointments and scheduling
ALTER TABLE public.appointments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_series          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_overrides      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_metadata           ENABLE ROW LEVEL SECURITY;

-- Clinical records
ALTER TABLE public.consent_records             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_packets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_notes              ENABLE ROW LEVEL SECURITY;

-- Documents and inventory
ALTER TABLE public.document_templates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_assignments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_definitions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_assignments       ENABLE ROW LEVEL SECURITY;

-- Scheduling and notifications
ALTER TABLE public.reminders                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions          ENABLE ROW LEVEL SECURITY;

-- Billing and payments
ALTER TABLE public.service_codes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_schedules               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superbills                  ENABLE ROW LEVEL SECURITY;

-- Portal
ALTER TABLE public.portal_accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_password_resets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_settings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_client_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_resources            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_uploads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_data_right_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_message_threads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_appointment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_registration_requests ENABLE ROW LEVEL SECURITY;

-- Forms
ALTER TABLE public.form_catalog                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_assignments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions            ENABLE ROW LEVEL SECURITY;

-- Offerings and faith-integrated features
ALTER TABLE public.offerings                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_note_templates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_goal_templates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_consent_variants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_resources             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_inventories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_church_referrals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_language_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_pastoral_registers    ENABLE ROW LEVEL SECURITY;

-- Compliance and governance
ALTER TABLE public.audit_events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_policies          ENABLE ROW LEVEL SECURITY;

-- Workflow and telemetry
ALTER TABLE public.workflow_recommendation_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_join_tokens           ENABLE ROW LEVEL SECURITY;

-- Localization governance
ALTER TABLE public.localization_locales               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localization_catalog_versions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localization_validation_reports    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localization_review_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localization_review_decisions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localization_activation_history    ENABLE ROW LEVEL SECURITY;

-- Staff supervision and licensure tracking
ALTER TABLE public.time_entries                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licensure_goals             ENABLE ROW LEVEL SECURITY;

-- Group therapy
ALTER TABLE public.therapy_groups              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_session_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_member_notes          ENABLE ROW LEVEL SECURITY;

-- Relational/family units
ALTER TABLE public.relational_units            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relational_unit_members     ENABLE ROW LEVEL SECURITY;
