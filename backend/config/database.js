const { Pool } = require('pg');

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

// Converts MySQL-style ? placeholders to PostgreSQL $N format
const runQuery = async (sql, params = []) => {
  let convertedSql;
  try {
    let paramIndex = 1;
    convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await pool.query(convertedSql, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('[DB ERROR] SQL was:', convertedSql ? convertedSql.substring(0, 200) : sql, '| PARAMS:', JSON.stringify(params));
    throw error;
  }
};

module.exports = {
  query: runQuery,
  initializeDb
};