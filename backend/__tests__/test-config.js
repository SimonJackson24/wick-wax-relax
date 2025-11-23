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

// Initialize test database schema
const initializeTestDb = async () => {
  let pool;
  try {
    pool = createTestPool();

    // Create basic schema for testing
    const schemaSQL = `
      -- Create channels table
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        api_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create products table
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        scent_profile TEXT NOT NULL,
        base_price REAL NOT NULL CHECK (base_price > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create categories table
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert test data
      INSERT INTO channels (id, name, api_key) VALUES
      ('pwa-channel', 'PWA', 'pwa-api-key')
      ON CONFLICT (name) DO NOTHING;

      INSERT INTO categories (id, name, slug, description) VALUES
      ('test-cat-1', 'Test Category', 'test-category', 'Test category for testing')
      ON CONFLICT (name) DO NOTHING;
    `;

    await pool.query(schemaSQL);
    console.log('Test database schema initialized');

  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  } finally {
    if (pool) await pool.end();
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