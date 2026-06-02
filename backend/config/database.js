const fs = require('fs');
const { Pool } = require('pg');

function buildSslConfig() {
  if (process.env.NODE_ENV !== 'production') return false;

  // Production: enforce TLS with cert verification. A CA bundle can be supplied
  // via DB_CA_CERT_PATH for self-signed / private-CA databases; if absent we
  // fall back to the system trust store (suitable for publicly trusted certs).
  // Leaving validation enabled with no CA configured is the correct secure
  // default — the connection will fail if the server presents a cert we cannot
  // verify.
  const caPath = process.env.DB_CA_CERT_PATH;
  const sslOpts = { rejectUnauthorized: true };
  if (caPath && fs.existsSync(caPath)) {
    sslOpts.ca = fs.readFileSync(caPath, 'utf8');
  }
  return sslOpts;
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: buildSslConfig(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const initializeDb = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL database');
    return pool;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    if (error.code === '28P01') {
      console.error('🔐 Authentication failed. Please check:');
      console.error('   - Database user exists');
      console.error('   - Password is correct');
      console.error('   - User has privileges for the database');
      console.error('   - pg_hba.conf allows password authentication');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused. Please check:');
      console.error('   - PostgreSQL server is running');
      console.error('   - Host and port are correct');
      console.error('   - Firewall is not blocking the connection');
    } else if (error.code === '3D000') {
      console.error('🗄️ Database does not exist. Please check:');
      console.error('   - Database name is correct');
      console.error('   - Database has been created');
    }
    throw error;
  }
};

// Sanitise params before logging so PII (emails, names, addresses) is not
// shipped to Sentry, file logs, or third-party aggregators.
const { sanitize } = require('../middleware/piiSanitizer');

function paramsForLog(params) {
  try {
    return JSON.stringify(sanitize(params));
  } catch {
    return '[unserialisable]';
  }
}

// Converts MySQL-style ? placeholders to PostgreSQL $N format
const runQuery = async (sql, params = []) => {
  let convertedSql;
  try {
    let paramIndex = 1;
    convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await pool.query(convertedSql, params);
    return result;
  } catch (error) {
    // Log SQL (truncated) and sanitised params so the on-call engineer can
    // reproduce the failure without exposing PII.
    // eslint-disable-next-line no-console
    console.error(
      '[DB ERROR]',
      error.message,
      '| SQL:',
      (convertedSql || sql).substring(0, 200),
      '| PARAMS:',
      paramsForLog(params)
    );
    throw error;
  }
};

const getClient = async () => {
  const rawClient = await pool.connect();
  // Wrap query() to auto-convert MySQL-style ? to PostgreSQL $N
  const client = {
    ...rawClient,
    query: (sql, params = []) => {
      let paramIndex = 1;
      const convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      return rawClient.query(convertedSql, params);
    }
  };
  return client;
};

async function shutdown() {
  await pool.end().catch(() => {});
}

module.exports = {
  query: runQuery,
  initializeDb,
  getClient,
  pool,
  shutdown,
};
