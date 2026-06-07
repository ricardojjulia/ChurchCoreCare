#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { assertDemoEnvironment } from './demo-guard.mjs';
import { databaseConfigFromEnv } from '../../apps/api/src/db/config.js';
import { buildDatabaseSslConfig } from '../../apps/api/src/db/ssl.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const requireFromApiWorkspace = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const pg = requireFromApiWorkspace('pg');

const REQUIRED_ENV = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_ENCRYPTION_KEY'];

export function validateSupabaseEnvironment(env = process.env) {
  assertDemoEnvironment(env);
  for (const name of REQUIRED_ENV) {
    if (!String(env[name] ?? '').trim()) {
      throw new Error(`${name} is required for Supabase deployment`);
    }
  }
  if (!/^[a-f0-9]{64}$/i.test(env.DB_ENCRYPTION_KEY)) {
    throw new Error('DB_ENCRYPTION_KEY must be a 64-character hexadecimal value');
  }
}

export function buildDeploymentSteps() {
  return [
    { name: 'initial-schema', type: 'sql', file: 'supabase/migrations/20260425000000_initial_schema.sql' },
    { name: 'incremental-migrations', type: 'node', args: ['apps/api/src/db/migrate.js'] },
    { name: 'synthetic-dataset', type: 'node', args: ['ops/demo-dataset/apply.mjs'] },
    {
      name: 'localization-catalog',
      type: 'node',
      args: ['ops/localization-governance/migrate-churchcore.mjs', '--postgres', '--tenant', 'system', '--write'],
    },
    { name: 'verification', type: 'node', args: ['ops/deployment/verify-supabase.mjs'] },
  ];
}

function databaseConfig(env) {
  const dbConfig = databaseConfigFromEnv(env);
  return { ...dbConfig, ssl: buildDatabaseSslConfig(env) };
}

async function runNode(args, env) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: ROOT,
      env: {
        ...env,
        NODE_ENV: 'production',
        SEED_DEV_PORTAL_DATA: 'false',
      },
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Deployment command failed (${signal || code}): node ${args.join(' ')}`));
    });
  });
}

export async function applySupabaseDeployment(env = process.env) {
  validateSupabaseEnvironment(env);
  const client = new pg.Client(databaseConfig(env));
  const completed = [];

  for (const step of buildDeploymentSteps()) {
    console.log(JSON.stringify({ event: 'deployment.step.start', step: step.name }));
    if (step.type === 'sql') {
      const sql = await readFile(path.join(ROOT, step.file), 'utf8');
      await client.connect();
      try {
        await client.query(sql);
      } finally {
        await client.end();
      }
    } else {
      await runNode(step.args, env);
    }
    completed.push(step.name);
    console.log(JSON.stringify({ event: 'deployment.step.complete', step: step.name }));
  }

  return { completed };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    const result = await applySupabaseDeployment();
    console.log(JSON.stringify({ action: 'supabase-demo-deploy', ...result }));
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}
