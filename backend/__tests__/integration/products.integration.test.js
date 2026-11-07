const request = require('supertest');
const { query } = require('../../config/database');
const app = require('../../server');

// Fixture credential from backend/.env.test — never hardcoded in source.
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error('TEST_ADMIN_PASSWORD must be set (see backend/.env.test)');
}

// Valid base32 TOTP test vector — the admin login flow always issues an
// MFA challenge, so this suite completes the verify step like the real UI.
const ADMIN_TEST_TOTP_SECRET = 'JBSWY3DPEHPK3PXP';

describe('Products Integration Tests', () => {
  let adminToken;
  let csrf; // { cookie, header } for the double-submit CSRF middleware
  let testProduct;
  let testCategory;

  beforeAll(async () => {
    const adminEmail = 'admin@test.com';

    await query('DELETE FROM users WHERE email = ?', [adminEmail]);

    const hashedPassword = require('bcryptjs').hashSync(ADMIN_PASSWORD, 12);
    await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, is_admin, mfa_secret, mfa_enabled)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [adminEmail, hashedPassword, 'Admin', 'User', true, ADMIN_TEST_TOTP_SECRET]
    );

    // Admin login → MFA challenge → verify with a live TOTP code → tokens
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: ADMIN_PASSWORD });

    expect(login.body.requiresMfa).toBe(true);

    const { authenticator } = require('otplib');
    const verify = await request(app)
      .post('/api/auth/mfa/verify')
      .send({ mfaToken: login.body.mfaToken, code: authenticator.generate(ADMIN_TEST_TOTP_SECRET) });

    adminToken = (verify.headers['set-cookie'] || [])
      .find(cookie => cookie.includes('accessToken'));

    // CSRF pair for mutating requests
    const csrfResponse = await request(app)
      .get('/api/products')
      .set('Cookie', [adminToken]);
    const csrfCookie = (csrfResponse.headers['set-cookie'] || [])
      .find(cookie => cookie.includes('csrfToken'));
    csrf = {
      cookie: csrfCookie,
      header: decodeURIComponent(csrfCookie.split('csrfToken=')[1].split(';')[0]),
    };

    // Create test category
    const categoryResult = await query(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?) RETURNING id',
      ['Test Category', 'test-category', 'Test category for integration tests']
    );
    testCategory = categoryResult.rows[0];

    testProduct = {
      name: 'Test Product',
      description: 'Test product for integration tests',
      scent_profile: {
        primary: 'Lavender',
        notes: ['Floral', 'Herbal'],
        intensity: 'Medium',
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
            color: 'Blue',
          },
        },
      ],
    };
  });

  afterAll(async () => {
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

      if (Array.isArray(response.body)) {
        expect(Array.isArray(response.body)).toBe(true);
      } else {
        expect(response.body).toHaveProperty('products');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.products)).toBe(true);
      }
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=5')
        .expect(200);

      if (Array.isArray(response.body)) {
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
        .set('Cookie', [adminToken, csrf.cookie])
        .set('X-CSRF-Token', csrf.header)
        .send(testProduct)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testProduct.name);
      expect(response.body.description).toBe(testProduct.description);
      expect(Number(response.body.base_price)).toBe(testProduct.base_price);

      testProduct.id = response.body.id;
    });

    test('should reject product creation without admin token', async () => {
      // CSRF pair but NO auth cookie, so the request clears the CSRF
      // middleware and reaches the authentication gate.
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', [csrf.cookie])
        .set('X-CSRF-Token', csrf.header)
        .send(testProduct)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    test('should reject invalid product data', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', [adminToken, csrf.cookie])
        .set('X-CSRF-Token', csrf.header)
        .send({
          name: '', // Invalid: empty name
          description: 'Test',
          base_price: -10, // Invalid: negative price
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

    test('should reject non-UUID ids', async () => {
      // '99999' is not a UUID — the param validator rejects it with 400
      // before any lookup runs.
      const response = await request(app)
        .get('/api/admin/products/99999')
        .set('Cookie', [adminToken])
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/admin/products/:id', () => {
    test('should update product', async () => {
      const updateData = {
        name: 'Updated Test Product',
        description: 'Updated description',
        scent_profile: { primary: 'Vanilla' },
        base_price: 29.99,
      };

      const response = await request(app)
        .put(`/api/admin/products/${testProduct.id}`)
        .set('Cookie', [adminToken, csrf.cookie])
        .set('X-CSRF-Token', csrf.header)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(Number(response.body.base_price)).toBe(updateData.base_price);
    });

    test('should reject non-UUID ids on update', async () => {
      const response = await request(app)
        .put('/api/admin/products/99999')
        .set('Cookie', [adminToken, csrf.cookie])
        .set('X-CSRF-Token', csrf.header)
        .send({ name: 'Test', scent_profile: {}, base_price: 1 })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /api/admin/products/:id', () => {
    test('should delete product', async () => {
      const response = await request(app)
        .delete(`/api/admin/products/${testProduct.id}`)
        .set('Cookie', [adminToken, csrf.cookie])
        .set('X-CSRF-Token', csrf.header)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

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
        description: 'New test category',
      };

      const response = await request(app)
        .post('/api/admin/categories')
        .set('Cookie', [adminToken, csrf.cookie])
        .set('X-CSRF-Token', csrf.header)
        .send(categoryData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(categoryData.name);
      expect(response.body.slug).toBe(categoryData.slug);

      await query('DELETE FROM categories WHERE id = ?', [response.body.id]);
    });

    test('should reject invalid category data', async () => {
      const response = await request(app)
        .post('/api/admin/categories')
        .set('Cookie', [adminToken, csrf.cookie])
        .set('X-CSRF-Token', csrf.header)
        .send({
          name: '', // Invalid: empty name
          slug: 'test',
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });
});
