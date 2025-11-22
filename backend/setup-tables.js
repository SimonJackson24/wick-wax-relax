const { initializeDb } = require('./config/database');

async function setupTables() {
  try {
    const db = await initializeDb();

    // Create products table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        scent_profile TEXT NOT NULL,
        base_price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create product_variants table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        sku TEXT,
        name TEXT,
        price REAL,
        inventory_quantity INTEGER DEFAULT 0,
        attributes TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Create categories table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        description TEXT,
        parent_id TEXT,
        display_order INTEGER DEFAULT 0,
        FOREIGN KEY (parent_id) REFERENCES categories(id)
      )
    `);

    // Create product_categories junction table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS product_categories (
        product_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        PRIMARY KEY (product_id, category_id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    console.log('Tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up tables:', error);
    process.exit(1);
  }
}

setupTables();