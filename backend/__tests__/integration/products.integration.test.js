const request = require('supertest');
const { query } = require('../../config/database');
const app = require('../../server');

describe('Products Integration Tests', () => {
  let adminToken;
  let testProduct;
  let testCategory;

  beforeAll(async () => {
    // Create admin user for testing
    const adminUser = {
      email: 'admin@test.com',
      password: 'AdminPass123!',
      first_name: 'Admin',
      last_name: 'User'
    };

    // Clean up existing admin user
    await query('DELETE FROM users WHERE email = ?', [adminUser.email]);

    // Create admin user
    const hashedPassword = require('bcryptjs').hashSync(adminUser.password, 12);
    await query(
      'INSERT INTO users (email, password_hash, first_name, last_name, is_admin) VALUES (?, ?, ?, ?, ?)',
      [adminUser.email, hashedPassword, adminUser.first_name, adminUser.last_name, true]
    );

    // Login to get admin token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password
      });

    const cookies = loginResponse.headers['set-cookie'];
    adminToken = cookies.find(cookie => cookie.includes('accessToken'));

    // Create test category
    const categoryResult = await query(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?) RETURNING id',
      ['Test Category', 'test-category', 'Test category for integration tests']
    );
    testCategory = categoryResult.rows[0];

    // Create test product
    testProduct = {
      name: 'Test Product',
      description: 'Test product for integration tests',
      scent_profile: {
        primary: 'Lavender',
        notes: ['Floral', 'Herbal'],
        intensity: 'Medium'
      },
      base_price: 25.99,
      categories: [testCategory.id],
      variants: [
        {
          sku: 'TEST-001',
          name: 'Test Variant 1',
          price: 25.99,
          inventory_quantity: 100,
          attributes: {
            size: 'Medium',
            color: 'Blue'
          }
        }
      ]
    };
  });

  afterAll(async () => {
    // Clean up test data
    if (testProduct && testProduct.id) {
      await query('DELETE FROM products WHERE id = ?', [testProduct.id]);
    }
    if (testCategory && testCategory.id) {
      await query('DELETE FROM categories WHERE id = ?', [testCategory.id]);
    }
    await query('DELETE FROM users WHERE email = ?', ['admin@test.com']);
  });

  describe('GET /api/products', () => {
    test('should get products list', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      // Handle both response formats: {products: [], pagination: {}} or []
      if (Array.isArray(response.body)) {
        // API returns array directly
        expect(Array.isArray(response.body)).toBe(true);
      } else {
        // API returns object with products and pagination
        expect(response.body).toHaveProperty('products');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.products)).toBe(true);
      }
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=5')
        .expect(200);

      // Handle both response formats
      if (Array.isArray(response.body)) {
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeLessThanOrEqual(5);
      } else {
        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 5);
        expect(response.body.products.length).toBeLessThanOrEqual(5);
      }
    });

    test('should support search', async () => {
      const response = await request(app)
        .get('/api/products?search=test')
        .expect(200);

      // Handle both response formats
      if (Array.isArray(response.body)) {
        expect(Array.isArray(response.body)).toBe(true);
      } else {
        expect(Array.isArray(response.body.products)).toBe(true);
      }
    });

    test('should support category filtering', async () => {
      const response = await request(app)
        .get(`/api/products?category=${testCategory.id}`)
        .expect(200);

      // Handle both response formats
      if (Array.isArray(response.body)) {
        expect(Array.isArray(response.body)).toBe(true);
      } else {
        expect(Array.isArray(response.body.products)).toBe(true);
      }
    });
  });

  describe('POST /api/admin/products', () => {
    test('should create product with admin token', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', [adminToken])
        .send(testProduct)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testProduct.name);
      expect(response.body.description).toBe(testProduct.description);
      expect(response.body.base_price).toBe(testProduct.base_price);

      // Store product ID for cleanup
      testProduct.id = response.body.id;
    });

    test('should reject product creation without admin token', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .send(testProduct)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    test('should reject invalid product data', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', [adminToken])
        .send({
          name: '', // Invalid: empty name
          description: 'Test',
          base_price: -10 // Invalid: negative price
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('GET /api/admin/products/:id', () => {
    test('should get product by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/products/${testProduct.id}`)
        .set('Cookie', [adminToken])
        .expect(200);

      expect(response.body).toHaveProperty('id', testProduct.id);
      expect(response.body.name).toBe(testProduct.name);
      expect(response.body).toHaveProperty('variants');
      expect(Array.isArray(response.body.variants)).toBe(true);
    });

    test('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/admin/products/99999')
        .set('Cookie', [adminToken])
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });

  describe('PUT /api/admin/products/:id', () => {
    test('should update product', async () => {
      const updateData = {
        name: 'Updated Test Product',
        description: 'Updated description',
        base_price: 29.99
      };

      const response = await request(app)
        .put(`/api/admin/products/${testProduct.id}`)
        .set('Cookie', [adminToken])
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.base_price).toBe(updateData.base_price);
    });

    test('should reject update for non-existent product', async () => {
      const response = await request(app)
        .put('/api/admin/products/99999')
        .set('Cookie', [adminToken])
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });

  describe('DELETE /api/admin/products/:id', () => {
    test('should delete product', async () => {
      const response = await request(app)
        .delete(`/api/admin/products/${testProduct.id}`)
        .set('Cookie', [adminToken])
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify product is deleted
      const checkResponse = await request(app)
        .get(`/api/admin/products/${testProduct.id}`)
        .set('Cookie', [adminToken])
        .expect(404);
    });
  });

  describe('GET /api/admin/categories', () => {
    test('should get categories list', async () => {
      const response = await request(app)
        .get('/api/admin/categories')
        .set('Cookie', [adminToken])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/admin/categories', () => {
    test('should create category', async () => {
      const categoryData = {
        name: 'New Test Category',
        slug: 'new-test-category',
        description: 'New test category'
      };

      const response = await request(app)
        .post('/api/admin/categories')
        .set('Cookie', [adminToken])
        .send(categoryData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(categoryData.name);
      expect(response.body.slug).toBe(categoryData.slug);

      // Clean up
      await query('DELETE FROM categories WHERE id = ?', [response.body.id]);
    });

    test('should reject invalid category data', async () => {
      const response = await request(app)
        .post('/api/admin/categories')
        .set('Cookie', [adminToken])
        .send({
          name: '', // Invalid: empty name
          slug: 'test'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });
});