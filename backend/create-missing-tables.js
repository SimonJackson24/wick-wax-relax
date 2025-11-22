const { initializeDb } = require('./config/database');

async function createMissingTables() {
  try {
    const db = await initializeDb();

    // From 001_initial_schema.sql
    await db.exec(`
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('AMAZON', 'PWA', 'ETSY')),
        api_key TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity >= 0),
        last_synced DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, channel_id),
        FOREIGN KEY (product_id) REFERENCES product_variants(id) ON DELETE CASCADE,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        external_id VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        total REAL NOT NULL,
        user_id TEXT,
        UNIQUE(channel_id, external_id),
        FOREIGN KEY (channel_id) REFERENCES channels(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Add user_id column if it doesn't exist (for existing tables)
    await db.exec(`
      ALTER TABLE orders ADD COLUMN user_id TEXT REFERENCES users(id)
    `).catch(err => {
      // Ignore error if column already exists
      if (!err.message.includes('duplicate column name')) {
        throw err;
      }
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('APPLE_PAY', 'GOOGLE_PAY', 'KLARNA', 'CLEARPAY')),
        revolut_payment_id VARCHAR(255) NOT NULL UNIQUE,
        amount REAL NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCEEDED', 'REQUIRES_ACTION', 'CANCELED', 'FAILED')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // From 002_product_variants.sql
    await db.exec(`
      CREATE TABLE IF NOT EXISTS channel_pricing (
        id TEXT PRIMARY KEY,
        variant_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        price REAL NOT NULL CHECK (price > 0),
        UNIQUE(variant_id, channel_id),
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
      )
    `);

    // From 003_product_categories.sql
    await db.exec(`
      CREATE TABLE IF NOT EXISTS category_attributes (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        name VARCHAR(50) NOT NULL,
        display_name VARCHAR(50) NOT NULL,
        filter_type VARCHAR(20) NOT NULL CHECK (filter_type IN ('RANGE', 'SELECT', 'BOOLEAN')),
        min_value REAL,
        max_value REAL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    // From 004_user_accounts.sql
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        address_type VARCHAR(20) NOT NULL CHECK (address_type IN ('SHIPPING', 'BILLING')),
        full_name VARCHAR(100) NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL DEFAULT 'United Kingdom',
        phone VARCHAR(20),
        is_default BOOLEAN DEFAULT false,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id TEXT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        interval VARCHAR(20) NOT NULL CHECK (interval IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY')),
        discount_percentage REAL DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        variant_id TEXT NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED')) DEFAULT 'ACTIVE',
        next_order_date DATE NOT NULL,
        last_order_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        cancelled_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS subscription_orders (
        id TEXT PRIMARY KEY,
        subscription_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // From 005_order_items.sql
    await db.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        variant_id TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price REAL NOT NULL CHECK (unit_price > 0),
        total_price REAL NOT NULL CHECK (total_price > 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES product_variants(id)
      )
    `);

    // Indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_inventory_channel ON inventory(channel_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_channel_pricing_variant ON channel_pricing(variant_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_user_subscriptions_product ON user_subscriptions(product_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_subscription_orders_subscription ON subscription_orders(subscription_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id)`);

    console.log('All missing tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createMissingTables();