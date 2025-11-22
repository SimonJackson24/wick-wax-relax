const request = require('supertest');
const { query } = require('../../config/database');
const app = require('../../server');

describe('Security Tests', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    // Create test users
    await createTestUsers();

    // Get tokens
    adminToken = await getAuthToken('admin@test.com', 'AdminPass123!');
    userToken = await getAuthToken('user@test.com', 'UserPass123!');
  });

  afterAll(async () => {
    // Clean up test users
    await cleanupTestUsers();
  });

  describe('Authentication Security', () => {
    test('should prevent SQL injection in login', async () => {
      const maliciousEmail = "' OR '1'='1'; --";
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousEmail,
          password: 'password'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should prevent XSS in user input', async () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'xss@test.com',
          password: 'Password123!',
          firstName: maliciousInput,
          lastName: 'Test'
        })
        .expect(201);

      // Check that malicious input is sanitized
      expect(response.body.firstName).not.toContain('<script>');
    });

    test('should enforce password complexity', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weak@test.com',
          password: '123', // Too short
          firstName: 'Weak',
          lastName: 'Password'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('should prevent brute force attacks with rate limiting', async () => {
      // Make multiple rapid requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponse = responses.find(r => r.status === 429);

      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse.body).toHaveProperty('error');
    });
  });

  describe('Authorization Security', () => {
    test('should prevent unauthorized access to admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', [userToken])
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Admin access required');
    });

    test('should allow authorized access to admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', [adminToken])
        .expect(200);

      expect(response.body).toHaveProperty('orderStats');
      expect(response.body).toHaveProperty('lowStockAlerts');
    });

    test('should prevent access to other users\' data', async () => {
      // Create another user
      const otherUserResult = await query(
        'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?) RETURNING id',
        ['other@test.com', 'hashedpass', 'Other', 'User']
      );
      const otherUserId = otherUserResult.rows[0].id;

      const response = await request(app)
        .get(`/api/admin/users/${otherUserId}`)
        .set('Cookie', [userToken])
        .expect(403);

      // Clean up
      await query('DELETE FROM users WHERE id = ?', [otherUserId]);
    });
  });

  describe('Input Validation Security', () => {
    test('should validate UUID parameters', async () => {
      const response = await request(app)
        .get('/api/admin/products/invalid-uuid')
        .set('Cookie', [adminToken])
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('should prevent path traversal attacks', async () => {
      const response = await request(app)
        .get('/api/admin/products/../../../etc/passwd')
        .set('Cookie', [adminToken])
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('should validate numeric inputs', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', [adminToken])
        .send({
          name: 'Test Product',
          description: 'Test',
          scent_profile: {},
          base_price: 'not-a-number'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('should prevent command injection', async () => {
      const maliciousInput = '; rm -rf /;';
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', [adminToken])
        .send({
          name: maliciousInput,
          description: 'Test',
          scent_profile: {},
          base_price: 10
        })
        .expect(201);

      // Check that malicious input is sanitized
      expect(response.body.name).not.toContain(';');
      expect(response.body.name).not.toContain('rm');
    });
  });

  describe('Data Exposure Security', () => {
    test('should not expose sensitive user data', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Cookie', [adminToken])
        .expect(200);

      // Check that sensitive fields are not exposed
      const user = response.body.users[0];
      expect(user).not.toHaveProperty('password_hash');
      expect(user).not.toHaveProperty('refresh_token');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('first_name');
    });

    test('should not expose internal system information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Should not expose server information
      expect(response.body).not.toHaveProperty('server_version');
      expect(response.body).not.toHaveProperty('database_version');
      expect(response.body).toHaveProperty('status', 'OK');
    });
  });

  describe('Session Security', () => {
    test('should invalidate session on logout', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'UserPass123!'
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      const sessionToken = cookies.find(cookie => cookie.includes('accessToken'));

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [sessionToken])
        .expect(200);

      // Try to access protected route with old token
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', [sessionToken])
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });

    test('should handle expired tokens gracefully', async () => {
      // Create a token that's already expired
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 1, email: 'test@example.com' },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '-1h' } // Already expired
      );

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', [`accessToken=${expiredToken}`])
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });

  describe('File Upload Security', () => {
    test('should validate file types', async () => {
      // This would test file upload endpoints if they exist
      // For now, just test that the endpoint exists and handles security
      const response = await request(app)
        .post('/api/upload')
        .set('Cookie', [adminToken])
        .attach('file', Buffer.from('fake file content'), 'test.exe')
        .expect(400);

      // Should reject executable files
      expect(response.body).toHaveProperty('error');
    });

    test('should prevent large file uploads', async () => {
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB file

      const response = await request(app)
        .post('/api/upload')
        .set('Cookie', [adminToken])
        .attach('file', largeFile, 'large.jpg')
        .expect(413); // Payload Too Large

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('CORS Security', () => {
    test('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/products')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    test('should reject unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Origin', 'http://malicious-site.com')
        .expect(500); // CORS error

      // The request should fail due to CORS
      expect(response.status).toBe(500);
    });
  });

  describe('Error Handling Security', () => {
    test('should not expose stack traces', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      // Should not contain stack trace information
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).toHaveProperty('error', 'Route not found');
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{invalid json}')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

async function createTestUsers() {
  try {
    // Create admin user
    const adminPassword = require('bcryptjs').hashSync('AdminPass123!', 12);
    await query(
      'INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, is_admin) VALUES (?, ?, ?, ?, ?)',
      ['admin@test.com', adminPassword, 'Admin', 'User', true]
    );

    // Create regular user
    const userPassword = require('bcryptjs').hashSync('UserPass123!', 12);
    await query(
      'INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, is_admin) VALUES (?, ?, ?, ?, ?)',
      ['user@test.com', userPassword, 'Regular', 'User', false]
    );

    console.log('Test users created');
  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

async function cleanupTestUsers() {
  try {
    await query('DELETE FROM users WHERE email IN (?, ?)', ['admin@test.com', 'user@test.com']);
    console.log('Test users cleaned up');
  } catch (error) {
    console.error('Error cleaning up test users:', error);
  }
}

async function getAuthToken(email, password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  const cookies = response.headers['set-cookie'];
  return cookies.find(cookie => cookie.includes('accessToken'));
}