const { initializeDb } = require('./config/database');

async function checkDb() {
  try {
    const db = await initializeDb();
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:', tables.map(t => t.name));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDb();