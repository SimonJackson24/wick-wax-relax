const { initializeDb } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runPerformanceMigration() {
  try {
    const db = await initializeDb();

    console.log('Running performance indexes migration...');

    const migrationPath = path.join(__dirname, '../migrations/011_performance_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL commands and execute them
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim().length > 0);

    for (const command of commands) {
      if (command.trim()) {
        console.log('Executing:', command.trim().substring(0, 50) + '...');
        await db.exec(command.trim());
      }
    }

    console.log('Performance indexes migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runPerformanceMigration();