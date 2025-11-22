const { initializeDb } = require('../config/database');
const { cleanupTestDb } = require('./test-config');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('Setting up test environment...');
  
  // Clean up any existing test database
  await cleanupTestDb();
  
  // Initialize fresh test database
  try {
    await initializeDb();
    console.log('Test database initialized successfully');
    
    // Run migrations to create tables
    console.log('Running database migrations...');
    const { exec } = require('../config/database');
    
    // Read and execute migration files
    const migrationFiles = [
      '001_initial_schema_sqlite.sql',
      '002_product_categories_sqlite.sql',
      '003_user_accounts_sqlite.sql'
    ];
    
    for (const file of migrationFiles) {
      const migrationPath = path.join(__dirname, '../../migrations', file);
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        try {
          await exec(migrationSQL);
          console.log(`Executed migration: ${file}`);
        } catch (error) {
          console.warn(`Warning: Migration ${file} had issues:`, error.message);
          // Continue with other migrations even if one fails
        }
      }
    }
    
    // Skip seeding for now - let tests create their own data
    // await seedBasicTestData();
    
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
};

async function seedBasicTestData() {
  const { query } = require('../config/database');
  
  try {
    // Create basic categories for testing
    await query(`
      INSERT OR IGNORE INTO categories (name, slug, description) 
      VALUES 
        ('Test Category 1', 'test-category-1', 'Test category for testing'),
        ('Test Category 2', 'test-category-2', 'Another test category')
    `);
    
    console.log('Basic test data seeded successfully');
  } catch (error) {
    console.warn('Warning: Could not seed basic test data:', error.message);
  }
}