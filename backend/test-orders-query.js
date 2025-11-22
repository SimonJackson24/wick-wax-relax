const { initializeDb } = require('./config/database');

async function testOrdersQuery() {
  try {
    const db = await initializeDb();

    // Test basic query on orders table
    const result = await db.all("SELECT id, channel_id, external_id, status, total, user_id FROM orders LIMIT 5");
    console.log('Orders query successful:', result.length, 'rows found');

    // Test query with user_id
    const result2 = await db.all("SELECT COUNT(*) as order_count FROM orders WHERE user_id IS NOT NULL");
    console.log('Orders with user_id:', result2[0].order_count);

    console.log('Backend queries execute successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error testing orders query:', error);
    process.exit(1);
  }
}

testOrdersQuery();