const { initializeDb } = require('./config/database');

async function checkSchema() {
  try {
    const db = await initializeDb();

    const tables = ['products', 'orders', 'product_variants', 'categories', 'user_addresses', 'users'];

    for (const table of tables) {
      try {
        console.log(`\nChecking ${table} table schema...`);
        const result = await db.all(`PRAGMA table_info(${table})`);
        console.log(`${table} table columns:`);
        result.forEach(col => {
          console.log(`- ${col.name}: ${col.type}`);
        });
      } catch (error) {
        console.log(`${table} table does not exist`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

checkSchema();