const { initializeDb } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runAllMigrations() {
  try {
    const db = await initializeDb();

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure proper order

    for (const migrationFile of migrationFiles) {
      console.log(`Running migration: ${migrationFile}`);
      const migrationPath = path.join(migrationsDir, migrationFile);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Split SQL commands and execute them
      const commands = migrationSQL.split(';').filter(cmd => cmd.trim().length > 0);

      for (const command of commands) {
        if (command.trim()) {
          console.log('Executing:', command.trim().substring(0, 50) + '...');
          await db.exec(command.trim());
        }
      }

      console.log(`Migration ${migrationFile} completed`);
    }

    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runAllMigrations();