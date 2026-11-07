// Test configuration for PostgreSQL database setup
const { Pool } = require('pg');
const net = require('net');

// Get available port for testing
const getAvailablePort = (startPort = 3001) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });

    server.on('error', () => {
      // If port is in use, try next port
      resolve(getAvailablePort(startPort + 1));
    });
  });
};

// PostgreSQL test database configuration
const getTestDbConfig = () => {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'wick_wax_relax_test',
    max: 5,
    idleTimeoutMillis: 30000,
  };
};

// Create test database pool
const createTestPool = () => {
  return new Pool(getTestDbConfig());
};

// Test environment variables
const getTestEnv = () => {
  return {
    NODE_ENV: 'test',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 5432,
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
    DB_NAME: 'wick_wax_relax_test',
    JWT_SECRET: 'test_jwt_secret_for_testing_only',
    JWT_REFRESH_SECRET: 'test_refresh_secret_for_testing_only',
    FRONTEND_URL: 'http://localhost:3000',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    REVOLUT_API_KEY: process.env.REVOLUT_API_KEY || 'test_api_key',
    REVOLUT_WEBHOOK_SECRET: process.env.REVOLUT_WEBHOOK_SECRET || 'test_webhook_secret'
  };
};

// Clean up test database
const cleanupTestDb = async () => {
  let pool;
  try {
    pool = createTestPool();
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Test database cleaned up');
  } catch (error) {
    console.warn('Could not clean up test database:', error.message);
  } finally {
    if (pool) await pool.end();
  }
};

// Initialize test database schema using the REAL migration runner.
//
// The previous version hand-wrote a mini-schema here (TEXT ids, REAL
// prices, hardcoded 'pwa-channel' string PK) that drifted from the actual
// migrations (UUID ids, NUMERIC prices) — tests were asserting against a
// database shape that never existed anywhere else. Applying the real
// migrations means the test DB is byte-identical in structure to
// production, and migration/code drift shows up as a failing test
// instead of a runtime surprise.
const initializeTestDb = async () => {
  try {
    const { MigrationRunner } = require('../init-db');
    const runner = new MigrationRunner();
    await runner.testConnection();
    await runner.initialize();
    console.log('Test database schema initialized (real migrations applied)');
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
};

module.exports = {
  getAvailablePort,
  getTestDbConfig,
  createTestPool,
  getTestEnv,
  cleanupTestDb,
  initializeTestDb
};