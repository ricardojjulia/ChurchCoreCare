import pg from 'pg';

export function createDirectPostgresClient(env = process.env) {
  return new pg.Client({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 57322),
    database: env.DB_NAME || 'postgres',
    user: env.DB_USER || 'postgres',
    password: env.DB_PASSWORD || 'postgres',
    ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  });
}
