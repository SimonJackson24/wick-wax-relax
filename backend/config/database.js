const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Create database connection
let db;

const initializeDb = async () => {
  try {
    // Use test database in test environment
    const dbName = process.env.NODE_ENV === 'test' ? 'wick_wax_relax_test.db' : 'wick_wax_relax.db';
    const dbPath = path.resolve(__dirname, `../${dbName}`);
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log('Connected to SQLite database at:', dbPath);
    return db;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
};

// Helper function to run queries with the SQLite API
const runQuery = async (sql, params = []) => {
  if (!db) {
    await initializeDb();
  }
  
  try {
    const result = await db.all(sql, params);
    return { rows: result };
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