const { cleanupTestDb } = require('./test-config');
const { query } = require('../config/database');

module.exports = async () => {
  console.log('Tearing down test environment...');
  
  try {
    // Clean up any test data
    await cleanupTestData();
    
    // Clean up test database file
    await cleanupTestDb();
    
    console.log('Test environment cleaned up successfully');
  } catch (error) {
    console.error('Error during test teardown:', error);
  }
};

async function cleanupTestData() {
  try {
    // Clean up test users
    await query('DELETE FROM users WHERE email LIKE ? OR email LIKE ?', ['%test%', '%@example.com']);
    
    // Clean up test products
    await query('DELETE FROM products WHERE name LIKE ?', ['Test%']);
    
    // Clean up test categories
    await query('DELETE FROM categories WHERE name LIKE ?', ['Test%']);
    
    // Clean up any other test data
    await query('DELETE FROM product_categories WHERE product_id IN (SELECT id FROM products WHERE name LIKE ?)', ['Test%']);
    await query('DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE name LIKE ?)', ['Test%']);
    
    console.log('Test data cleaned up successfully');
  } catch (error) {
    console.warn('Warning: Could not clean up all test data:', error.message);
  }
}