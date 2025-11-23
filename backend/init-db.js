#!/usr/bin/env node

const { initializeDb } = require('./config/database');
const fs = require('fs');
const path = require('path');

/**
 * Simple PostgreSQL database initialization
 * Replaces the complex migration system with direct schema setup
 */

class DatabaseInitializer {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the database with complete schema
   */
  async initialize() {
    if (this.initialized) {
      console.log('Database already initialized');
      return;
    }

    try {
      console.log('Initializing PostgreSQL database...');

      // Read and execute schema files in order
      const schemaFiles = [
        '001_initial_schema.sql',
        '002_product_categories.sql',
        '003_user_accounts.sql',
        '004_orders_and_payments.sql',
        '005_inventory_tracking.sql',
        '006_product_variants.sql',
        '007_product_images.sql',
        '008_user_addresses.sql',
        '009_audit_and_security.sql',
        '010_gdpr_compliance.sql',
        '011_performance_indexes.sql',
        '012_hierarchical_categories.sql'
      ];

      for (const file of schemaFiles) {
        await this.executeSchemaFile(file);
      }

      // Seed initial data
      await this.seedInitialData();

      this.initialized = true;
      console.log('✅ Database initialization completed successfully');

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute a single schema file
   */
  async executeSchemaFile(filename) {
    const filePath = path.join(__dirname, '../migrations', filename);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Schema file not found: ${filename} - skipping`);
      return;
    }

    console.log(`📄 Executing schema: ${filename}`);

    const sql = fs.readFileSync(filePath, 'utf8');
    const { query } = require('./config/database');

    // Split SQL into statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (error) {
          // Ignore common errors (table already exists, etc.)
          if (!error.message.includes('already exists') &&
              !error.message.includes('does not exist')) {
            console.warn(`⚠️  Warning in ${filename}:`, error.message);
          }
        }
      }
    }
  }

  /**
   * Seed initial data
   */
  async seedInitialData() {
    console.log('🌱 Seeding initial data...');

    const { query } = require('./config/database');

    try {
      // Seed channels
      await query(`
        INSERT INTO channels (id, name, api_key)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO NOTHING
      `, ['pwa-channel', 'PWA', 'pwa-api-key']);

      // Seed admin user (you should change this password)
      const bcrypt = require('bcrypt');
      const adminPassword = await bcrypt.hash('admin123', 10);

      await query(`
        INSERT INTO users (id, email, password_hash, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
      `, ['admin-user', 'admin@wickwaxrelax.co.uk', adminPassword, 'Admin', 'User']);

      console.log('✅ Initial data seeded');

    } catch (error) {
      console.warn('⚠️  Warning during data seeding:', error.message);
    }
  }

  /**
   * Reset database (drop all and recreate)
   */
  async reset() {
    console.log('🔄 Resetting database...');

    const { query } = require('./config/database');

    try {
      // Drop all tables in correct order (reverse dependencies)
      const dropStatements = [
        'DROP TABLE IF EXISTS audit_log CASCADE;',
        'DROP TABLE IF EXISTS user_consents CASCADE;',
        'DROP TABLE IF EXISTS user_addresses CASCADE;',
        'DROP TABLE IF EXISTS payments CASCADE;',
        'DROP TABLE IF EXISTS orders CASCADE;',
        'DROP TABLE IF EXISTS product_variants CASCADE;',
        'DROP TABLE IF EXISTS product_images CASCADE;',
        'DROP TABLE IF EXISTS product_categories CASCADE;',
        'DROP TABLE IF EXISTS inventory CASCADE;',
        'DROP TABLE IF EXISTS products CASCADE;',
        'DROP TABLE IF EXISTS categories CASCADE;',
        'DROP TABLE IF EXISTS users CASCADE;',
        'DROP TABLE IF EXISTS channels CASCADE;'
      ];

      for (const statement of dropStatements) {
        await query(statement);
      }

      console.log('✅ Database reset completed');
      this.initialized = false;

    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  }
}

// CLI interface
const program = require('commander');

program
  .name('init-db')
  .description('PostgreSQL database initialization for Wick Wax Relax')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize the database with complete schema')
  .action(async () => {
    const initializer = new DatabaseInitializer();
    try {
      await initializer.initialize();
      process.exit(0);
    } catch (error) {
      console.error('Initialization failed:', error);
      process.exit(1);
    }
  });

program
  .command('reset')
  .description('Reset database (drop all tables and data)')
  .action(async () => {
    const initializer = new DatabaseInitializer();
    try {
      await initializer.reset();
      process.exit(0);
    } catch (error) {
      console.error('Reset failed:', error);
      process.exit(1);
    }
  });

// Run CLI if called directly
if (require.main === module) {
  program.parse();
}

module.exports = { DatabaseInitializer };