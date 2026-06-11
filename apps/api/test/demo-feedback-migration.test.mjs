import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../../../supabase/migrations/20260611000000_demo_feedback.sql',
  import.meta.url,
);

test('demo feedback migration provides atomic control-plane storage', async () => {
  let sql = '';
  try {
    sql = await readFile(migrationUrl, 'utf8');
  } catch {}

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.demo_feedback_reports/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.demo_feedback_rate_limits/i);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.submit_demo_feedback/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
  assert.match(sql, /ON CONFLICT \(fingerprint\).*hit_count/s);
  assert.match(sql, /processed = false/i);
  assert.match(sql, /action = NULL/i);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /CREATE POLICY deny_all_demo_feedback_reports/i);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.submit_demo_feedback/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.submit_demo_feedback[^;]+ TO postgres/i);
});
