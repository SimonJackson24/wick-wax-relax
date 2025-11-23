const { Pool } = require('pg');
const path = require('path');

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize connection pool
const initializeDb = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL database');
    return pool;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
};

// Helper function to run queries with PostgreSQL
const runQuery = async (sql, params = []) => {
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper function to run a single query (for inserts, updates, etc.)
const runSingle = async (sql, params = []) => {
  if (!db) {
    await initializeDb();
  }
  
  try {
    const result = await db.run(sql, params);
    return result;
  } catch (error) {
    console.error('Database run error:', error);
    throw error;
  }
};

// Helper function to get a single row
const getSingle = async (sql, params = []) => {
  if (!db) {
    await initializeDb();
  }
  
  try {
    const result = await db.get(sql, params);
    return result;
  } catch (error) {
    console.error('Database get error:', error);
    throw error;
  }
};

// Helper function to execute raw SQL (for table creation, etc.)
const executeRaw = async (sql) => {
  if (!db) {
    await initializeDb();
  }
  
  try {
    await db.exec(sql);
    return { success: true };
  } catch (error) {
    console.error('Database exec error:', error);
    throw error;
  }
};

module.exports = {
  query: runQuery,
  run: runSingle,
  get: getSingle,
  exec: executeRaw,
  db: () => db,
  initializeDb
};