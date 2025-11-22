const { initializeDb, exec, get, run } = require('./config/database');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
  try {
    await initializeDb();

    // Create users table if it doesn't exist
    await exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        is_admin INTEGER DEFAULT 0,
        refresh_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Check if admin user exists
    const existingAdmin = await get('SELECT id FROM users WHERE email = ? AND is_admin = 1', ['admin@wickwaxrelax.com']);

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash('admin123', saltRounds);

    // Insert admin user
    await run(
      'INSERT INTO users (email, password_hash, first_name, last_name, is_admin) VALUES (?, ?, ?, ?, ?)',
      ['admin@wickwaxrelax.com', passwordHash, 'Admin', 'User', 1]
    );

    console.log('Admin user created successfully');
    console.log('Email: admin@wickwaxrelax.com');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin();