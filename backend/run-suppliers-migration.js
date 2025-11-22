const { initializeDb } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runSuppliersMigration() {
  try {
    const db = await initializeDb();

    console.log('Running suppliers migration...');
    const migrationPath = path.join(__dirname, '../migrations/009_suppliers.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL commands and execute them
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim().length > 0);

    for (const command of commands) {
      if (command.trim()) {
        console.log('Executing:', command.trim().substring(0, 50) + '...');
        await db.exec(command.trim());
      }
    }

    console.log('Suppliers migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runSuppliersMigration();