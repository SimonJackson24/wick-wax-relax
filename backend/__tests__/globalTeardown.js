const { cleanupTestDb } = require('./test-config');
const { createTestPool } = require('./test-config');

module.exports = async () => {
  console.log('Tearing down PostgreSQL test environment...');

  try {
    // Clean up test data
    await cleanupTestData();

    // Clean up test database schema
    await cleanupTestDb();

    console.log('PostgreSQL test environment cleaned up successfully');
  } catch (error) {
    console.error('Error during PostgreSQL test teardown:', error);
  }
};

async function cleanupTestData() {
  let pool;
  try {
    pool = createTestPool();

    // Clean up test users
    await pool.query("DELETE FROM users WHERE email LIKE $1 OR email LIKE $2", ['%test%', '%@example.com']);

    // Clean up test products
    await pool.query("DELETE FROM products WHERE name LIKE $1", ['Test%']);

    // Clean up test categories
    await pool.query("DELETE FROM categories WHERE name LIKE $1", ['Test%']);

    // Clean up any other test data
    await pool.query(`
      DELETE FROM product_categories
      WHERE product_id IN (SELECT id FROM products WHERE name LIKE $1)
    `, ['Test%']);

    console.log('Test data cleaned up successfully');
  } catch (error) {
    console.warn('Warning: Could not clean up all test data:', error.message);
  } finally {
    if (pool) await pool.end();
  }
}