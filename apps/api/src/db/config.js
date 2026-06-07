const REQUIRED_DATABASE_ENV = Object.freeze(['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']);
const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

export function isTestDatabaseAllowed(env = process.env) {
  return env.CHURCHCORE_ALLOW_TEST_DATABASE === 'true';
}

export function assertOnlineDatabaseHost(host, env = process.env) {
  const normalized = String(host ?? '').trim().toLowerCase();
  if (!normalized) throw new Error('DB_HOST is required');
  if (normalized.startsWith('/')) {
    throw new Error('Unix-socket database hosts are not allowed for ChurchCore Care SaaS runtime');
  }
  if (LOCAL_DATABASE_HOSTS.has(normalized) && !isTestDatabaseAllowed(env)) {
    throw new Error('Local database hosts are not allowed for ChurchCore Care SaaS runtime');
  }
}

export function requireDatabaseEnv(env = process.env) {
  for (const name of REQUIRED_DATABASE_ENV) {
    if (!String(env[name] ?? '').trim()) {
      throw new Error(`${name} is required for ChurchCore Care SaaS runtime`);
    }
  }
  assertOnlineDatabaseHost(env.DB_HOST, env);
  if (String(env.DB_SSL).toLowerCase() !== 'true' && !isTestDatabaseAllowed(env)) {
    throw new Error('DB_SSL=true is required for ChurchCore Care SaaS runtime');
  }
}

export function databaseConfigFromEnv(env = process.env) {
  requireDatabaseEnv(env);
  const defaultConnectionLimit = env.VERCEL === '1' ? 1 : 10;
  const connectionLimit = Number(env.DB_POOL_MAX ?? defaultConnectionLimit);
  if (!Number.isInteger(connectionLimit) || connectionLimit < 1 || connectionLimit > 20) {
    throw new Error('DB_POOL_MAX must be an integer between 1 and 20');
  }
  return {
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL,
    sslRejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED,
    connectionLimit,
  };
}
