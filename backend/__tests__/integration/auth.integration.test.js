const request = require('supertest');
const { query } = require('../../config/database');
const app = require('../../server');

describe('Authentication Integration Tests', () => {
  let testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  };

  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    // Clean up any existing test user
    await query('DELETE FROM users WHERE email = ?', [testUser.email]);
  });

  afterAll(async () => {
    // Clean up test user
    await query('DELETE FROM users WHERE email = ?', [testUser.email]);
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.firstName).toBe(testUser.firstName);
      expect(response.body.user.lastName).toBe(testUser.lastName);

      // isAdmin field may or may not be present depending on implementation
      if (response.body.user.isAdmin !== undefined) {
        expect(typeof response.body.user.isAdmin).toBe('boolean');
      }

      // Check cookies are set
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'].some(cookie =>
        cookie.includes('accessToken')
      )).toBe(true);
    });

    test('should reject registration with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'User already exists');
    });

    test('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    test('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'weak@example.com',
          password: '123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);

      // isAdmin field may or may not be present depending on implementation
      if (response.body.user.isAdmin !== undefined) {
        expect(typeof response.body.user.isAdmin).toBe('boolean');
      }

      // Store tokens for later tests
      const cookies = response.headers['set-cookie'];
      accessToken = cookies.find(cookie => cookie.includes('accessToken'));
      refreshToken = cookies.find(cookie => cookie.includes('refreshToken'));
    });

    test('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', [accessToken])
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.firstName).toBe(testUser.firstName);
      expect(response.body.lastName).toBe(testUser.lastName);
    });

    test('should reject profile access without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    test('should reject profile access with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', ['accessToken=invalid'])
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [refreshToken])
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Token refreshed successfully');

      // Check new cookies are set
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('should reject refresh without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Refresh token required');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [accessToken, refreshToken])
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limiting on auth endpoints', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: testUser.email,
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponse = responses.find(r => r.status === 429);

      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse.body).toHaveProperty('error');
      expect(rateLimitedResponse.body.error).toMatch(/Too many/i);
    });
  });
});