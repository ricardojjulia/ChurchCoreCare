#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import pool from '../../apps/api/src/db/pool.js';
import { closeDemoDatasetPool, verifyDemoDataset } from '../demo-dataset/common.mjs';
import { assertDemoEnvironment } from './demo-guard.mjs';

export async function verifySupabaseDeployment(env = process.env) {
  assertDemoEnvironment(env);
  const dataset = await verifyDemoDataset();
  if (dataset.skipped || !dataset.passed) {
    throw new Error('Synthetic dataset verification failed');
  }

  const [tenantRows] = await pool.query(
    'SELECT COUNT(*)::int AS count FROM tenants WHERE id = ?',
    ['system'],
  );
  const [localeRows] = await pool.query(
    'SELECT COUNT(*)::int AS count FROM localization_locales WHERE tenant_id = ?',
    ['system'],
  );
  const result = {
    tenantCount: Number(tenantRows[0]?.count ?? 0),
    localeCount: Number(localeRows[0]?.count ?? 0),
    datasetInvariantCount: dataset.invariants.length,
    passed: dataset.passed
      && Number(tenantRows[0]?.count ?? 0) === 1
      && Number(localeRows[0]?.count ?? 0) >= 4,
  };
  if (!result.passed) throw new Error('Supabase deployment verification failed');
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    const result = await verifySupabaseDeployment();
    console.log(JSON.stringify({ action: 'supabase-demo-verify', ...result }));
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  } finally {
    await closeDemoDatasetPool();
  }
}
