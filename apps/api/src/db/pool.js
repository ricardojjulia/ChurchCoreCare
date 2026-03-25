/**
 * MySQL connection pool — singleton.
 * All database modules import from here.
 *
 * Environment variables:
 *   DB_HOST        (default: 127.0.0.1)
 *   DB_PORT        (default: 3306)
 *   DB_NAME        (required)
 *   DB_USER        (required)
 *   DB_PASSWORD    (required)
 *   DB_SSL         set to "true" to require TLS (production)
 */

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           'Z',   // store/retrieve timestamps as UTC
  decimalNumbers:     true,
  // Fail fast if connection string is badly formed
  connectTimeout:     10_000,
});

// Verify connectivity at startup so misconfigured DB_* vars surface immediately.
export async function verifyConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}

export default pool;
