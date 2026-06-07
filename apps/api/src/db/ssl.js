export function buildDatabaseSslConfig(env = process.env) {
  if (String(env.DB_SSL).toLowerCase() !== 'true') return false;
  return {
    rejectUnauthorized: String(env.DB_SSL_REJECT_UNAUTHORIZED).toLowerCase() !== 'false',
  };
}
