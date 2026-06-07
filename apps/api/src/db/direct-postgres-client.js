import pg from 'pg';

import { databaseConfigFromEnv } from './config.js';
import { buildDatabaseSslConfig } from './ssl.js';

export function createDirectPostgresClient(env = process.env) {
  const dbConfig = databaseConfigFromEnv(env);
  return new pg.Client({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    ssl: buildDatabaseSslConfig(env),
  });
}
