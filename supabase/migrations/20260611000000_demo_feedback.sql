-- Demo feedback control-plane storage.
-- Browser roles are denied; the Node API writes with the Supabase postgres role.

CREATE TABLE IF NOT EXISTS public.demo_feedback_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint CHAR(64) NOT NULL UNIQUE,
  session_id UUID NOT NULL,
  route VARCHAR(500) NOT NULL,
  category VARCHAR(32) NOT NULL
    CHECK (category IN ('BUG', 'ERROR', 'UNEXPECTED_RESULT', 'IMPROVEMENT')),
  error_message_enc TEXT NULL,
  note_enc TEXT NULL,
  breadcrumbs JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_email_enc TEXT NULL,
  user_role VARCHAR(64) NULL,
  demo_version VARCHAR(100) NOT NULL DEFAULT '',
  session_duration_seconds INTEGER NULL
    CHECK (session_duration_seconds IS NULL OR session_duration_seconds >= 0),
  hit_count INTEGER NOT NULL DEFAULT 1 CHECK (hit_count >= 1),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed BOOLEAN NOT NULL DEFAULT false,
  action VARCHAR(64) NULL
    CHECK (action IS NULL OR action IN (
      'code_fixed',
      'update_applied',
      'suggestion_not_implemented',
      'suggestion_implemented',
      'bug_fixed',
      'error_fixed',
      'received_and_closed'
    )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.demo_feedback_rate_limits (
  session_key_hash CHAR(64) PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  accepted_count INTEGER NOT NULL CHECK (accepted_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_feedback_route
  ON public.demo_feedback_reports (route);
CREATE INDEX IF NOT EXISTS idx_demo_feedback_category
  ON public.demo_feedback_reports (category);
CREATE INDEX IF NOT EXISTS idx_demo_feedback_session
  ON public.demo_feedback_reports (session_id);
CREATE INDEX IF NOT EXISTS idx_demo_feedback_created_desc
  ON public.demo_feedback_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_feedback_triage
  ON public.demo_feedback_reports (processed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_feedback_rate_limit_updated
  ON public.demo_feedback_rate_limits (updated_at);

ALTER TABLE public.demo_feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_feedback_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deny_all_demo_feedback_reports ON public.demo_feedback_reports;
CREATE POLICY deny_all_demo_feedback_reports
  ON public.demo_feedback_reports
  AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS deny_all_demo_feedback_rate_limits ON public.demo_feedback_rate_limits;
CREATE POLICY deny_all_demo_feedback_rate_limits
  ON public.demo_feedback_rate_limits
  AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.submit_demo_feedback(
  p_session_key_hash CHAR(64),
  p_fingerprint CHAR(64),
  p_session_id UUID,
  p_route VARCHAR(500),
  p_category VARCHAR(32),
  p_error_message_enc TEXT,
  p_note_enc TEXT,
  p_breadcrumbs JSONB,
  p_user_email_enc TEXT,
  p_user_role VARCHAR(64),
  p_demo_version VARCHAR(100),
  p_session_duration_seconds INTEGER,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  report_id UUID,
  hit_count INTEGER,
  rate_limited BOOLEAN
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_count INTEGER;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_session_key_hash, 0)
  );

  DELETE FROM public.demo_feedback_rate_limits
   WHERE updated_at < v_now - INTERVAL '1 day';

  INSERT INTO public.demo_feedback_rate_limits (
    session_key_hash,
    window_started_at,
    accepted_count,
    updated_at
  )
  VALUES (p_session_key_hash, v_now, 1, v_now)
  ON CONFLICT (session_key_hash) DO UPDATE
  SET window_started_at = CASE
        WHEN public.demo_feedback_rate_limits.window_started_at <= v_now - INTERVAL '60 seconds'
          THEN v_now
        ELSE public.demo_feedback_rate_limits.window_started_at
      END,
      accepted_count = CASE
        WHEN public.demo_feedback_rate_limits.window_started_at <= v_now - INTERVAL '60 seconds'
          THEN 1
        ELSE public.demo_feedback_rate_limits.accepted_count + 1
      END,
      updated_at = v_now
  RETURNING accepted_count INTO v_count;

  IF v_count > 20 THEN
    UPDATE public.demo_feedback_rate_limits
       SET accepted_count = 20,
           updated_at = v_now
     WHERE session_key_hash = p_session_key_hash;
    RETURN QUERY SELECT NULL::UUID, 0, true;
    RETURN;
  END IF;

  RETURN QUERY
  INSERT INTO public.demo_feedback_reports (
    fingerprint,
    session_id,
    route,
    category,
    error_message_enc,
    note_enc,
    breadcrumbs,
    user_email_enc,
    user_role,
    demo_version,
    session_duration_seconds,
    metadata
  )
  VALUES (
    p_fingerprint,
    p_session_id,
    p_route,
    p_category,
    p_error_message_enc,
    p_note_enc,
    COALESCE(p_breadcrumbs, '[]'::jsonb),
    p_user_email_enc,
    p_user_role,
    p_demo_version,
    p_session_duration_seconds,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (fingerprint) DO UPDATE
  SET session_id = EXCLUDED.session_id,
      route = EXCLUDED.route,
      category = EXCLUDED.category,
      error_message_enc = EXCLUDED.error_message_enc,
      note_enc = EXCLUDED.note_enc,
      breadcrumbs = EXCLUDED.breadcrumbs,
      user_email_enc = EXCLUDED.user_email_enc,
      user_role = EXCLUDED.user_role,
      demo_version = EXCLUDED.demo_version,
      session_duration_seconds = EXCLUDED.session_duration_seconds,
      metadata = EXCLUDED.metadata,
      hit_count = public.demo_feedback_reports.hit_count + 1,
      processed = false,
      action = NULL,
      updated_at = v_now
  RETURNING id, public.demo_feedback_reports.hit_count, false;
END;
$$;

REVOKE ALL ON TABLE public.demo_feedback_reports FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.demo_feedback_rate_limits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_demo_feedback(
  CHAR(64), CHAR(64), UUID, VARCHAR(500), VARCHAR(32), TEXT, TEXT, JSONB,
  TEXT, VARCHAR(64), VARCHAR(100), INTEGER, JSONB
) FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.demo_feedback_reports TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.demo_feedback_rate_limits TO postgres;
GRANT EXECUTE ON FUNCTION public.submit_demo_feedback(
  CHAR(64), CHAR(64), UUID, VARCHAR(500), VARCHAR(32), TEXT, TEXT, JSONB,
  TEXT, VARCHAR(64), VARCHAR(100), INTEGER, JSONB
) TO postgres;
