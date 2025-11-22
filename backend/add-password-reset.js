const { initializeDb } = require('./config/database');

async function addPasswordResetFields() {
  try {
    const db = await initializeDb();

    console.log('Adding password reset fields to users table...');

    // Add password reset fields one by one with error handling
    const resetColumns = [
      'ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);',
      'ALTER TABLE users ADD COLUMN reset_token_expires DATETIME;',
      'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;'
    ];

    for (const column of resetColumns) {
      try {
        await db.exec(column);
        console.log('Added column to users:', column.split('ADD COLUMN')[1].trim());
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log('Column already exists in users:', column.split('ADD COLUMN')[1].trim());
        } else {
          throw error;
        }
      }
    }

    console.log('Creating index for reset token...');
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
    `);

    console.log('Password reset fields added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding password reset fields:', error);
    process.exit(1);
  }
}

addPasswordResetFields();