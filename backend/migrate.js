#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { initializeDb } = require('./config/database');
const { program } = require('commander');

// Migration table name
const MIGRATIONS_TABLE = 'schema_migrations';

class MigrationManager {
  constructor(db) {
    this.db = db;
  }

  /**
   * Initialize the migrations table if it doesn't exist
   */
  async ensureMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        batch INTEGER NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await this.db.run(createTableSQL);
    console.log('Migrations table initialized');
  }

  /**
   * Get all migration files from the migrations directory
   */
  getMigrationFiles() {
    const migrationsDir = path.resolve(__dirname, '../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    return fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .filter(file => !file.includes('_sqlite')) // Exclude SQLite files for now
      .sort(); // This will sort numerically due to the prefix (001_, 002_, etc.)
  }

  /**
   * Get the list of already executed migrations
   */
  async getExecutedMigrations() {
    const result = await this.db.all(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`);
    return result.map(row => row.name);
  }

  /**
   * Convert PostgreSQL SQL to SQLite compatible SQL
   */
  convertPostgresToSqlite(sql, migrationFile) {
    // Special handling for the problematic 007_add_product_images.sql migration
    if (migrationFile === '007_add_product_images.sql') {
      return `-- Manually converted migration for SQLite compatibility
-- Add image fields to products table
ALTER TABLE products ADD COLUMN image_url TEXT;
ALTER TABLE products ADD COLUMN image_alt_text TEXT;
ALTER TABLE products ADD COLUMN additional_images TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN seo_title TEXT;
ALTER TABLE products ADD COLUMN seo_description TEXT;
ALTER TABLE products ADD COLUMN seo_keywords TEXT;
ALTER TABLE products ADD COLUMN is_featured INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN tags TEXT;
ALTER TABLE products ADD COLUMN weight_grams INTEGER;
ALTER TABLE products ADD COLUMN dimensions TEXT;
ALTER TABLE products ADD COLUMN care_instructions TEXT;
ALTER TABLE products ADD COLUMN ingredients TEXT;
ALTER TABLE products ADD COLUMN allergens TEXT;
ALTER TABLE products ADD COLUMN country_of_origin TEXT;
ALTER TABLE products ADD COLUMN brand TEXT;
ALTER TABLE products ADD COLUMN warranty_info TEXT;
ALTER TABLE products ADD COLUMN return_policy TEXT;

-- Create product images table for better image management
CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- Update existing products to be active by default
UPDATE products SET is_active = 1 WHERE is_active IS NULL;`;
    }
    
    // Special handling for the 009_security_audit_log.sql migration
    if (migrationFile === '009_security_audit_log.sql') {
      return `-- Manually converted migration for SQLite compatibility
-- Create security audit log table for comprehensive security event tracking
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  resource TEXT,
  action TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_email ON audit_log(email);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource);

-- Create composite indexes for common query patterns (SQLite doesn't support WHERE in indexes)
CREATE INDEX IF NOT EXISTS idx_audit_security_events ON audit_log(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_user_events ON audit_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_ip_events ON audit_log(ip_address, created_at);

-- Insert initial audit log entry
INSERT INTO audit_log (event_type, details) VALUES ('SYSTEM_AUDIT_LOG_INITIALIZED', '{"message": "Security audit logging system initialized", "version": "1.0"}');`;
    }
    
    // Special handling for the 010_gdpr_consent_tracking.sql migration
    if (migrationFile === '010_gdpr_consent_tracking.sql') {
      return `-- Manually converted migration for SQLite compatibility
-- Create GDPR consent tracking table
CREATE TABLE IF NOT EXISTS user_consents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add GDPR-related columns to users table
ALTER TABLE users ADD COLUMN marketing_consent BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN marketing_consent_date DATETIME;
ALTER TABLE users ADD COLUMN marketing_consent_version TEXT;
ALTER TABLE users ADD COLUMN analytics_consent BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN analytics_consent_date DATETIME;
ALTER TABLE users ADD COLUMN analytics_consent_version TEXT;
ALTER TABLE users ADD COLUMN third_party_consent BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN third_party_consent_date DATETIME;
ALTER TABLE users ADD COLUMN third_party_consent_version TEXT;
ALTER TABLE users ADD COLUMN data_processing_consent BOOLEAN DEFAULT 1;
ALTER TABLE users ADD COLUMN data_processing_consent_date DATETIME;
ALTER TABLE users ADD COLUMN data_processing_consent_version TEXT DEFAULT '1.0';
ALTER TABLE users ADD COLUMN gdpr_deleted BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN gdpr_deletion_date DATETIME;
ALTER TABLE users ADD COLUMN gdpr_deletion_reason TEXT;

-- Add GDPR anonymization flag to orders
ALTER TABLE orders ADD COLUMN gdpr_anonymized BOOLEAN DEFAULT 0;

-- Create indexes for GDPR compliance
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_created ON user_consents(created_at);
CREATE INDEX IF NOT EXISTS idx_users_gdpr_deleted ON users(gdpr_deleted);
CREATE INDEX IF NOT EXISTS idx_users_gdpr_deletion_date ON users(gdpr_deletion_date);
CREATE INDEX IF NOT EXISTS idx_orders_gdpr_anonymized ON orders(gdpr_anonymized);

-- Insert default consent records for existing users
INSERT INTO user_consents (user_id, consent_type, consent_given, consent_version)
SELECT
  id,
  'data_processing',
  1,
  '1.0'
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_consents
  WHERE user_consents.user_id = users.id
  AND user_consents.consent_type = 'data_processing'
);

-- Update existing users with default consent values
UPDATE users SET
  data_processing_consent = 1,
  data_processing_consent_date = CURRENT_TIMESTAMP,
  data_processing_consent_version = '1.0'
WHERE data_processing_consent IS NULL;`;
    }
    
    // Special handling for the 011_performance_indexes.sql migration
    if (migrationFile === '011_performance_indexes.sql') {
      return `-- Performance optimization indexes for frequently queried columns

-- Products table indexes (only for existing columns)
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);

-- Product variants indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_inventory_quantity ON product_variants(inventory_quantity) WHERE inventory_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_product_variants_price ON product_variants(price);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_display_order_name ON categories(display_order, name);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- User addresses indexes
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_type_default ON user_addresses(user_id, address_type, is_default DESC);
CREATE INDEX IF NOT EXISTS idx_user_addresses_created_at ON user_addresses(created_at DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_status_order_date ON orders(status, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_channel_status ON orders(channel_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_orders_status_channel_order_date ON orders(status, channel_id, order_date DESC);`;
    }
    
    // Special handling for the 003_product_categories.sql migration
    if (migrationFile === '003_product_categories.sql') {
      return `-- Manually converted migration for SQLite compatibility
-- Create product categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product-category relationship
CREATE TABLE IF NOT EXISTS product_categories (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Create category attributes for filtering
CREATE TABLE IF NOT EXISTS category_attributes (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  filter_type TEXT NOT NULL,
  min_value REAL,
  max_value REAL,
  sort_order INTEGER DEFAULT 0
);

-- Insert core categories
INSERT INTO categories (name, slug, description, display_order) VALUES
('Wax Melts', 'wax-melts', 'Hand-poured soy wax melts for electric warmers', 1),
('Candles', 'candles', 'Premium soy wax candles with wooden wicks', 2),
('Bath Bombs', 'bath-bombs', 'Fizzy bath bombs with therapeutic essential oils', 3),
('Diffusers', 'diffusers', 'Reed diffusers for continuous fragrance', 4);

-- Insert subcategories
INSERT INTO categories (name, slug, description, parent_id, display_order) VALUES
('Floral Scents', 'floral', 'Rose, jasmine, and lavender blends',
 (SELECT id FROM categories WHERE slug = 'wax-melts'), 1),
('Citrus Scents', 'citrus', 'Lemon, orange, and grapefruit blends',
 (SELECT id FROM categories WHERE slug = 'wax-melts'), 2),
('Seasonal Collections', 'seasonal', 'Limited edition holiday scents',
 (SELECT id FROM categories WHERE slug = 'wax-melts'), 3);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);

-- Note: Skipping category attributes for now due to SQLite compatibility issues
-- These can be added manually later if needed`;
    }
    
    // Remove PostgreSQL-specific extensions
    sql = sql.replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/g, '');
    
    // Replace UUID type with TEXT and remove DEFAULT values with functions (SQLite doesn't support them)
    sql = sql.replace(/UUID PRIMARY KEY DEFAULT [^,]+/g, 'TEXT PRIMARY KEY');
    sql = sql.replace(/UUID/g, 'TEXT');
    
    // Replace UUID generation functions in other contexts
    sql = sql.replace(/uuid_generate_v4\(\)/g, "lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))");
    
    // Replace TIMESTAMPTZ with TIMESTAMP (SQLite doesn't have timezone-aware timestamps)
    sql = sql.replace(/TIMESTAMPTZ/g, 'TIMESTAMP');
    
    // Replace JSONB with TEXT (SQLite doesn't have native JSONB type)
    sql = sql.replace(/JSONB/g, 'TEXT');
    
    // Replace NUMERIC with REAL (SQLite doesn't have NUMERIC type)
    sql = sql.replace(/NUMERIC\((\d+),(\d+)\)/g, 'REAL');
    
    // Replace VARCHAR with TEXT (SQLite doesn't have VARCHAR)
    sql = sql.replace(/VARCHAR\(\d+\)/g, 'TEXT');
    
    // Add IF NOT EXISTS to CREATE TABLE statements
    sql = sql.replace(/CREATE TABLE ([a-zA-Z_]+)/g, 'CREATE TABLE IF NOT EXISTS $1');
    
    // Add IF NOT EXISTS to CREATE INDEX statements
    sql = sql.replace(/CREATE INDEX ([a-zA-Z_]+)/g, 'CREATE INDEX IF NOT EXISTS $1');
    
    // Remove CHECK constraints for enum values that might not exist yet
    sql = sql.replace(/CHECK \([^)]+ IN \('[^)]+'\)\)/g, '');
    
    // Remove PostgreSQL-specific function calls that don't exist in SQLite
    sql = sql.replace(/NOW\(\)/g, "datetime('now')");
    
    // Handle DEFAULT values for timestamps (SQLite doesn't support function calls in DEFAULT)
    sql = sql.replace(/DEFAULT datetime\('now'\)/g, 'DEFAULT CURRENT_TIMESTAMP');
    
    // Handle complex ALTER TABLE operations that SQLite doesn't support
    // Convert DROP CONSTRAINT/ADD CONSTRAINT to simpler operations
    sql = sql.replace(/ALTER TABLE (\w+)\s+DROP CONSTRAINT (\w+),\s+ADD CONSTRAINT (\w+)\s+FOREIGN KEY \((\w+)\) REFERENCES (\w+)\(id\) ON DELETE CASCADE/g,
      '-- SQLite does not support complex ALTER TABLE with DROP/ADD CONSTRAINT in one statement\n' +
      '-- Manual intervention required for table $1 to update foreign key from $2 to $3');
    
    // Handle other ALTER TABLE operations that SQLite doesn't support
    sql = sql.replace(/ALTER TABLE (\w+)\s+DROP CONSTRAINT (\w+)/g,
      '-- SQLite does not support DROP CONSTRAINT\n' +
      '-- Manual intervention required for table $1 to drop constraint $2');
    
    // Handle ADD CONSTRAINT operations
    sql = sql.replace(/ALTER TABLE (\w+)\s+ADD CONSTRAINT (\w+)\s+FOREIGN KEY \((\w+)\) REFERENCES (\w+)\(id\)(\s+ON DELETE CASCADE)?/g,
      '-- SQLite does not support ADD CONSTRAINT with FOREIGN KEY\n' +
      '-- Manual intervention required for table $1 to add foreign key constraint $2');
    
    // Handle multiple ADD COLUMN operations in a single ALTER TABLE statement
    // SQLite only supports one ADD COLUMN at a time
    const alterTableRegex = /ALTER TABLE (\w+)\s+((?:ADD COLUMN [\w\s_(),']+,\s*)+ADD COLUMN [\w\s_(),']+)/g;
    sql = sql.replace(alterTableRegex, (match, tableName, columns) => {
      // Split columns by comma, but be careful about commas inside quotes or parentheses
      const columnList = [];
      let currentColumn = '';
      let inQuotes = false;
      let inParentheses = 0;
      
      for (let i = 0; i < columns.length; i++) {
        const char = columns[i];
        
        if (char === "'" && (i === 0 || columns[i-1] !== '\\')) {
          inQuotes = !inQuotes;
        }
        
        if (!inQuotes) {
          if (char === '(') inParentheses++;
          if (char === ')') inParentheses--;
        }
        
        if (char === ',' && !inQuotes && inParentheses === 0) {
          columnList.push(currentColumn.trim().replace(/^ADD COLUMN\s+/, ''));
          currentColumn = '';
        } else {
          currentColumn += char;
        }
      }
      
      // Add the last column
      if (currentColumn.trim()) {
        columnList.push(currentColumn.trim().replace(/^ADD COLUMN\s+/, ''));
      }
      
      let result = '';
      
      columnList.forEach(column => {
        // Handle JSONB columns with default values
        if (column.includes("JSONB DEFAULT '[]'::jsonb")) {
          result += `-- SQLite does not support JSONB with default values\n`;
          result += `-- Converting to TEXT with empty string default\n`;
          result += `ALTER TABLE ${tableName} ADD COLUMN additional_images TEXT DEFAULT '';\n`;
          return;
        }
        
        // Handle malformed JSONB default values with PostgreSQL cast syntax
        if (column.includes("'[]'::jsonb")) {
          result += `-- SQLite does not support JSONB with PostgreSQL cast syntax\n`;
          result += `-- Converting to TEXT with empty string default\n`;
          result += `ALTER TABLE ${tableName} ADD COLUMN additional_images TEXT DEFAULT '';\n`;
          return;
        }
        
        // Skip fragments that aren't complete column definitions
        if (column.includes("'[]'::jsonb") && !column.includes('ADD COLUMN')) {
          result += `-- Skipping malformed column fragment: ${column}\n`;
          return;
        }
        
        // Skip fragments that start with "::jsonb" or similar
        if (column.trim().startsWith("::") || column.trim().startsWith("'[]'")) {
          result += `-- Skipping malformed column fragment: ${column}\n`;
          return;
        }
        
        // Convert JSONB to TEXT
        const sqliteColumn = column.replace(/JSONB/g, 'TEXT');
        
        // Convert BOOLEAN to INTEGER (SQLite doesn't have BOOLEAN type)
        const finalColumn = sqliteColumn
          .replace(/BOOLEAN DEFAULT false/g, 'INTEGER DEFAULT 0')
          .replace(/BOOLEAN DEFAULT true/g, 'INTEGER DEFAULT 1')
          .replace(/BOOLEAN/g, 'INTEGER');
        
        // Skip adding columns that might already exist to avoid errors
        result += `-- SQLite does not support ADD COLUMN IF NOT EXISTS\n`;
        result += `-- Manual check required for table ${tableName} column ${column.split(' ')[0]}\n`;
        result += `ALTER TABLE ${tableName} ADD COLUMN ${finalColumn};\n`;
      });
      
      return result;
    });
    
    return sql;
  }

  /**
   * Execute a migration file
   */
  async executeMigration(migrationFile) {
    const migrationsDir = path.resolve(__dirname, '../migrations');
    const filePath = path.join(migrationsDir, migrationFile);
    let sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Executing migration: ${migrationFile}`);
    
    // Convert PostgreSQL SQL to SQLite compatible SQL
    console.log(`Converting SQL for ${migrationFile}`);
    sql = this.convertPostgresToSqlite(sql, migrationFile);
    console.log(`Converted SQL for ${migrationFile}: ${sql.substring(0, 100)}...`);
    
    // Split SQL into individual statements
    // This is a simple approach that works for basic SQL files
    // For more complex SQL with transactions, you might need a more sophisticated parser
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Log all statements for debugging
    console.log(`Statements in ${migrationFile}:`);
    statements.forEach((statement, index) => {
      console.log(`  ${index + 1}: ${statement.substring(0, 50)}...`);
      console.log(`    Full statement: ${statement}`);
    });
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.length === 0) continue;
      
      // Skip comment-only statements
      const trimmedStatement = statement.trim();
      const lines = trimmedStatement.split('\n');
      const nonCommentLines = lines.filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*') && line.trim().length > 0);
      
      if (nonCommentLines.length === 0) {
        console.log(`Skipping comment-only statement in ${migrationFile}: ${trimmedStatement.substring(0, 50)}...`);
        continue;
      }
      
      // For INSERT statements with subqueries, we need to ensure they're split correctly
      // This handles multi-line INSERT statements that SQLite doesn't support in the same way as PostgreSQL
      if (trimmedStatement.startsWith('INSERT INTO')) {
        // Check if this is a multi-line INSERT with subqueries
        if (trimmedStatement.includes('(SELECT id FROM')) {
          console.log(`Handling complex INSERT statement with subqueries in ${migrationFile}`);
        }
      }
      
      // Log the statement being executed
      console.log(`Executing statement in ${migrationFile}: ${trimmedStatement.substring(0, 50)}...`);
      
      try {
        await this.db.run(statement);
      } catch (error) {
        // Ignore duplicate column errors (SQLite doesn't support IF NOT EXISTS for columns)
        if (error.code === 'SQLITE_ERROR' && error.message.includes('duplicate column name')) {
          console.log(`Column already exists, skipping in ${migrationFile}`);
          continue;
        }
        
        // Ignore index already exists errors
        if (error.code === 'SQLITE_ERROR' && error.message.includes('index idx_') && error.message.includes('already exists')) {
          console.log(`Index already exists, skipping in ${migrationFile}`);
          continue;
        }
        
        // Ignore table already exists errors
        if (error.code === 'SQLITE_ERROR' && error.message.includes('table ') && error.message.includes(' already exists')) {
          console.log(`Table already exists, skipping in ${migrationFile}`);
          continue;
        }
        
        console.error(`Error executing statement in ${migrationFile}:`, error);
        console.error('Statement:', statement);
        throw error;
      }
    }
    
    // Record the migration as executed
    const currentBatch = await this.getCurrentBatch() + 1;
    await this.db.run(
      `INSERT INTO ${MIGRATIONS_TABLE} (name, batch) VALUES (?, ?)`,
      [migrationFile, currentBatch]
    );
    
    console.log(`Migration ${migrationFile} executed successfully`);
  }

  /**
   * Get the current batch number
   */
  async getCurrentBatch() {
    const result = await this.db.get(`SELECT MAX(batch) as max_batch FROM ${MIGRATIONS_TABLE}`);
    return result.max_batch || 0;
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    await this.ensureMigrationsTable();
    
    const migrationFiles = this.getMigrationFiles();
    const executedMigrations = await this.getExecutedMigrations();
    
    const pendingMigrations = migrationFiles.filter(file => !executedMigrations.includes(file));
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    // Begin transaction
    await this.db.exec('BEGIN TRANSACTION');
    
    try {
      for (const migrationFile of pendingMigrations) {
        await this.executeMigration(migrationFile);
      }
      
      // Commit transaction
      await this.db.exec('COMMIT');
      console.log('All migrations completed successfully');
    } catch (error) {
      // Rollback on error
      await this.db.exec('ROLLBACK');
      console.error('Migration failed, rolled back changes:', error);
      throw error;
    }
  }

  /**
   * Rollback the last batch of migrations
   */
  async rollback() {
    await this.ensureMigrationsTable();
    
    const currentBatch = await this.getCurrentBatch();
    
    if (currentBatch === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    // Get migrations in the current batch (in reverse order)
    const migrationsToRollback = await this.db.all(
      `SELECT name FROM ${MIGRATIONS_TABLE} 
       WHERE batch = ? 
       ORDER BY name DESC`,
      [currentBatch]
    );
    
    if (migrationsToRollback.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    console.log(`Rolling back ${migrationsToRollback.length} migrations from batch ${currentBatch}`);
    
    // Begin transaction
    await this.db.exec('BEGIN TRANSACTION');
    
    try {
      for (const migration of migrationsToRollback) {
        await this.rollbackMigration(migration.name);
      }
      
      // Commit transaction
      await this.db.exec('COMMIT');
      console.log('Rollback completed successfully');
    } catch (error) {
      // Rollback on error
      await this.db.exec('ROLLBACK');
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Rollback a specific migration
   */
  async rollbackMigration(migrationFile) {
    // Note: This is a simplified implementation
    // In a real-world scenario, you would need to implement down migrations
    // or have a way to determine the reverse operations for each migration
    
    console.log(`WARNING: Rollback for ${migrationFile} is not implemented`);
    console.log('Manual intervention required to undo this migration');
    
    // Remove from migrations table
    await this.db.run(
      `DELETE FROM ${MIGRATIONS_TABLE} WHERE name = ?`,
      [migrationFile]
    );
  }

  /**
   * Show the status of all migrations
   */
  async status() {
    await this.ensureMigrationsTable();
    
    const migrationFiles = this.getMigrationFiles();
    const executedMigrations = await this.getExecutedMigrations();
    
    console.log('Migration Status:');
    console.log('================');
    
    for (const file of migrationFiles) {
      const status = executedMigrations.includes(file) ? '✓ Executed' : '○ Pending';
      console.log(`${status} ${file}`);
    }
  }
}

// Main function
async function main() {
  try {
    // Initialize database
    const db = await initializeDb();
    const migrationManager = new MigrationManager(db);
    
    // Setup CLI commands
    program
      .name('migrate')
      .description('Database migration tool for Wick Wax & Relax')
      .version('1.0.0');
    
    program
      .command('up')
      .description('Run all pending migrations')
      .action(async () => {
        try {
          await migrationManager.runMigrations();
          process.exit(0);
        } catch (error) {
          console.error('Migration failed:', error);
          process.exit(1);
        }
      });
    
    program
      .command('rollback')
      .description('Rollback the last batch of migrations')
      .action(async () => {
        try {
          await migrationManager.rollback();
          process.exit(0);
        } catch (error) {
          console.error('Rollback failed:', error);
          process.exit(1);
        }
      });
    
    program
      .command('status')
      .description('Show migration status')
      .action(async () => {
        try {
          await migrationManager.status();
          process.exit(0);
        } catch (error) {
          console.error('Failed to get status:', error);
          process.exit(1);
        }
      });
    
    // Parse command line arguments
    await program.parseAsync();
  } catch (error) {
    console.error('Failed to initialize migration manager:', error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = { MigrationManager };