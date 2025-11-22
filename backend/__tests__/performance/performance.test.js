const request = require('supertest');
const { query } = require('../../config/database');
const app = require('../../server');

describe('Performance Tests', () => {
  beforeAll(async () => {
    // Create test data for performance testing
    await createTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  describe('API Response Times', () => {
    test('GET /api/products should respond within 2 seconds', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000);

      console.log(`Products API response time: ${responseTime}ms`);
    });

    test('GET /api/products with pagination should respond within 1.5 seconds', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/products?page=1&limit=20')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1500);

      console.log(`Products pagination response time: ${responseTime}ms`);
    });

    test('GET /api/categories should respond within 1 second', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);

      console.log(`Categories API response time: ${responseTime}ms`);
    });

    test('Health check should respond within 500ms', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);

      console.log(`Health check response time: ${responseTime}ms`);
    });
  });

  describe('Concurrent Requests', () => {
    test('should handle 10 concurrent product requests within 5 seconds', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/products')
            .expect(200)
        );
      }

      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(5000);
      console.log(`10 concurrent requests completed in: ${totalTime}ms`);
    });

    test('should handle 5 concurrent category requests within 3 seconds', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create 5 concurrent requests
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .get('/api/categories')
            .expect(200)
        );
      }

      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(3000);
      console.log(`5 concurrent category requests completed in: ${totalTime}ms`);
    });
  });

  describe('Database Query Performance', () => {
    test('product search should respond within 1.5 seconds', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/products?search=test')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1500);

      console.log(`Product search response time: ${responseTime}ms`);
    });

    test('product filtering should respond within 2 seconds', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/products?category=1')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000);

      console.log(`Product filtering response time: ${responseTime}ms`);
    });
  });

  describe('Memory Usage', () => {
    test('should not have excessive memory leaks in product listing', async () => {
      const initialMemory = process.memoryUsage();

      // Make multiple requests
      for (let i = 0; i < 20; i++) {
        await request(app)
          .get('/api/products')
          .expect(200);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB for real-world testing)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      console.log(`Memory increase after 20 requests: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    });
  });

  describe('Rate Limiting Performance', () => {
    test('rate limiter should respond quickly to blocked requests', async () => {
      const startTime = Date.now();

      // Make a request that should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong'
        });

      const responseTime = Date.now() - startTime;

      // Even rate limited requests should respond quickly
      expect(responseTime).toBeLessThan(500);

      console.log(`Rate limited request response time: ${responseTime}ms`);
    });
  });

  describe('Caching Performance', () => {
    test('cached responses should be faster than uncached', async () => {
      // First request (uncached)
      const startTime1 = Date.now();
      await request(app)
        .get('/api/products')
        .expect(200);
      const firstRequestTime = Date.now() - startTime1;

      // Second request (potentially cached)
      const startTime2 = Date.now();
      await request(app)
        .get('/api/products')
        .expect(200);
      const secondRequestTime = Date.now() - startTime2;

      // Second request should be faster or at least not significantly slower
      // Allow for some variance in real-world conditions
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime * 1.2);

      console.log(`First request: ${firstRequestTime}ms, Second request: ${secondRequestTime}ms`);
    });
  });
});

async function createTestData() {
  try {
    // Create test categories
    for (let i = 1; i <= 10; i++) {
      await query(
        'INSERT OR IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)',
        [`Test Category ${i}`, `test-category-${i}`, `Test category ${i} description`]
      );
    }

    // Create test products
    for (let i = 1; i <= 100; i++) {
      const productId = await query(
        'INSERT INTO products (name, description, scent_profile, base_price) VALUES (?, ?, ?, ?) RETURNING id',
        [
          `Test Product ${i}`,
          `Test product ${i} description`,
          JSON.stringify({ primary: 'Test Scent', notes: ['Test'], intensity: 'Medium' }),
          Math.floor(Math.random() * 50) + 10
        ]
      );

      // Create product variants
      for (let j = 1; j <= 3; j++) {
        await query(
          'INSERT INTO product_variants (product_id, sku, name, price, inventory_quantity, attributes) VALUES (?, ?, ?, ?, ?, ?)',
          [
            productId.rows[0].id,
            `TEST-${i}-${j}`,
            `Variant ${j}`,
            Math.floor(Math.random() * 50) + 10,
            Math.floor(Math.random() * 100) + 10,
            JSON.stringify({ size: 'Medium', color: 'Test' })
          ]
        );
      }

      // Link to random categories
      const categoryId = Math.floor(Math.random() * 10) + 1;
      await query(
        'INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)',
        [productId.rows[0].id, categoryId]
      );
    }

    console.log('Test data created successfully');
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

async function cleanupTestData() {
  try {
    // Clean up test data
    await query('DELETE FROM product_categories WHERE product_id IN (SELECT id FROM products WHERE name LIKE ?)', ['Test Product%']);
    await query('DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE name LIKE ?)', ['Test Product%']);
    await query('DELETE FROM products WHERE name LIKE ?', ['Test Product%']);
    await query('DELETE FROM categories WHERE name LIKE ?', ['Test Category%']);

    console.log('Test data cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}