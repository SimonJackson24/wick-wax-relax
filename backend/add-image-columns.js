const { initializeDb } = require('./config/database');

async function addImageColumns() {
  try {
    const db = await initializeDb();

    console.log('Adding image columns to products table...');

    // Add image columns one by one with error handling
    const productColumns = [
      'ALTER TABLE products ADD COLUMN image_url VARCHAR(500);',
      'ALTER TABLE products ADD COLUMN image_alt_text VARCHAR(255);',
      'ALTER TABLE products ADD COLUMN thumbnail_url VARCHAR(500);',
      'ALTER TABLE products ADD COLUMN updated_at DATETIME;'
    ];

    for (const column of productColumns) {
      try {
        await db.exec(column);
        console.log('Added column to products:', column.split('ADD COLUMN')[1].trim());
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log('Column already exists in products:', column.split('ADD COLUMN')[1].trim());
        } else {
          throw error;
        }
      }
    }

    console.log('Adding image columns to product_variants table...');

    const variantColumns = [
      'ALTER TABLE product_variants ADD COLUMN image_url VARCHAR(500);',
      'ALTER TABLE product_variants ADD COLUMN image_alt_text VARCHAR(255);',
      'ALTER TABLE product_variants ADD COLUMN thumbnail_url VARCHAR(500);',
      'ALTER TABLE product_variants ADD COLUMN updated_at DATETIME;'
    ];

    for (const column of variantColumns) {
      try {
        await db.exec(column);
        console.log('Added column to variants:', column.split('ADD COLUMN')[1].trim());
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log('Column already exists in variants:', column.split('ADD COLUMN')[1].trim());
        } else {
          throw error;
        }
      }
    }

    console.log('Creating indexes for image columns...');
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_image_url ON products(image_url);
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_variants_image_url ON product_variants(image_url);
    `);

    console.log('Image columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding image columns:', error);
    process.exit(1);
  }
}

addImageColumns();