const request = require('supertest');
const { query, initializeDb } = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../../server');

describe('Authentication Routes', () => {
  const testUser = {
    email: 'test-auth@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  };

  beforeEach(async () => {
    // Clean up test user before each test
    await query('DELETE FROM users WHERE email = ?', [testUser.email]);
  });

  afterAll(async () => {
    // Clean up test user after all tests
    await query('DELETE FROM users WHERE email = ?', [testUser.email]);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.firstName).toBe(testUser.firstName);
      expect(response.body.user.lastName).toBe(testUser.lastName);

      // Verify user was actually created in database
      const dbUser = await query('SELECT * FROM users WHERE email = ?', [testUser.email]);
      expect(dbUser.rows).toHaveLength(1);
      expect(dbUser.rows[0].email).toBe(testUser.email);
    });

    it('should return 400 for existing user', async () => {
      // Create user first
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Try to register again
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body.error).toBe('User already exists');
    });

    it('should validate email format', async () => {
      const invalidData = { ...testUser, email: 'invalid-email' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should validate password length', async () => {
      const invalidData = { ...testUser, password: '123' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should require all fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should validate email format', async () => {
      const invalidData = { email: 'invalid-email', password: testUser.password };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should require password', async () => {
      const invalidData = { email: testUser.email };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;

    beforeEach(async () => {
      // Register and login to get token
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      authToken = cookies.find(cookie => cookie.includes('accessToken'));
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', [authToken])
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.firstName).toBe(testUser.firstName);
      expect(response.body.lastName).toBe(testUser.lastName);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return 403 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', ['accessToken=invalid-token'])
        .expect(403);

      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      // Register and login to get token
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      authToken = cookies.find(cookie => cookie.includes('accessToken'));
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [authToken])
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);
    });

    it('should send reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.message).toContain('reset link has been sent');
    });

    it('should not reveal if email exists', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.message).toContain('reset link has been sent');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Security Features', () => {
    it('should handle SQL injection attempts in login', async () => {
      const maliciousData = {
        email: "' OR '1'='1",
        password: "' OR '1'='1"
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should handle XSS attempts in registration', async () => {
      const maliciousData = {
        email: 'xss-test@example.com',
        password: 'TestPassword123!',
        firstName: '<script>alert("xss")</script>John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData)
        .expect(201);

      // The input should be sanitized by the middleware
      expect(response.body.user.firstName).not.toContain('<script>');
    });
  });
});