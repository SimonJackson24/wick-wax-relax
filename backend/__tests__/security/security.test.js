const request = require('supertest');
const { query } = require('../../config/database');
const app = require('../../server');

// Test fixture credentials come from backend/.env.test (loaded by
// jest.setup.js) — never hardcoded in source.
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const USER_EMAIL = 'user@test.com';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD;
const REGISTER_PASSWORD = process.env.TEST_REGISTER_PASSWORD;

if (!ADMIN_PASSWORD || !USER_PASSWORD || !REGISTER_PASSWORD) {
  throw new Error(
    'TEST_ADMIN_PASSWORD / TEST_USER_PASSWORD / TEST_REGISTER_PASSWORD must be set (see backend/.env.test)'
  );
}

describe('Security Tests', () => {
  let adminToken;
  let userToken;
  let csrf; // { cookie, header } for the double-submit CSRF middleware

  beforeAll(async () => {
    await createTestUsers();
    adminToken = await getAuthToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    userToken = await getAuthToken(USER_EMAIL, USER_PASSWORD);
    csrf = await getCsrfTokens(adminToken);
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  describe('Authentication Security', () => {
    test('should prevent SQL injection in login', async () => {
      const maliciousEmail = "' OR '1'='1'; --";
      // 400, not 401: the email validator rejects the payload before any
      // credential check or query runs.
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousEmail,
          password: 'password'
        })
        .expect(400);

      expect(response.body).not.toHaveProperty('accessToken');
    });

    test('should prevent XSS in user input', async () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'xss@test.com',
          password: REGISTER_PASSWORD,
          firstName: maliciousInput,
          lastName: 'Test'
        })
        .expect(400);

      // Markup in names is rejected outright by charset validation — it
      // can never be stored or echoed back.
      expect(response.body).not.toHaveProperty('user');
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

      // Mounted admin routes gate on requireAdminMfa; the wording differs
      // from the legacy requireAdminFresh check.
      expect(response.body).toHaveProperty('error', 'Admin MFA session required');
    });

    test('should allow authorized access to admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', [adminToken])
        .expect(200);

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
      // Percent-encoded traversal: supertest normalizes literal ../..
      // client-side, so the payload must arrive encoded for Express to
      // route it into the :id param validator.
      const response = await request(app)
        .get('/api/admin/products/..%2F..%2F..%2Fetc%2Fpasswd')
        .set('Cookie', [adminToken])
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('should validate numeric inputs', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', [adminToken, csrf.cookie])
        .set('X-CSRF-Token', csrf.header)
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
        .set('Cookie', [adminToken, csrf.cookie])
        .set('X-CSRF-Token', csrf.header)
        .send({
          name: maliciousInput,
          description: 'Test',
          scent_profile: { primary: 'test' },
          base_price: 10
        })
        .expect(201);

      // Parameterized queries make the string inert: it is stored
      // verbatim and nothing is executed. Round-trip it to prove storage
      // didn't interpret the payload.
      expect(response.body.name).toBe(maliciousInput);

      // Clean up
      if (response.body.id) {
        await query('DELETE FROM products WHERE id = ?', [response.body.id]);
      }
    });
  });

  describe('Data Exposure Security', () => {
    test('should not expose sensitive user data', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Cookie', [adminToken])
        .expect(200);

      // Check that sensitive fields are not exposed (the list endpoint
      // returns a concatenated `name`, not raw columns)
      const user = response.body.users[0];
      expect(user).toBeDefined();
      expect(user).not.toHaveProperty('password_hash');
      expect(user).not.toHaveProperty('refresh_token');
      expect(user).not.toHaveProperty('mfa_secret');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
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
          email: USER_EMAIL,
          password: USER_PASSWORD
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      const sessionToken = cookies.find(cookie => cookie.includes('accessToken'));
      const sessionRefresh = cookies.find(cookie => cookie.includes('refreshToken'));
      const sessionCsrf = await getCsrfTokens(sessionToken);

      // Logout (mutating request: needs the CSRF double-submit pair)
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [sessionToken, sessionCsrf.cookie])
        .set('X-CSRF-Token', sessionCsrf.header)
        .expect(200);

      // Session cookies are cleared...
      const cleared = (logoutResponse.headers['set-cookie'] || [])
        .filter(c => c.includes('accessToken') || c.includes('refreshToken'));
      expect(cleared.length).toBeGreaterThan(0);

      // ...and the server-side refresh token is revoked, so the session
      // cannot be extended. The 15-minute stateless access token itself
      // is allowed to expire naturally (short-TTL design, no denylist).
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [sessionRefresh]);

      expect([401, 403]).toContain(refreshResponse.status);
      expect(refreshResponse.body).not.toHaveProperty('accessToken');
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
      const response = await request(app)
        .post('/api/upload/product-image')
        .set('Cookie', [adminToken, csrf.cookie])
        .set('X-CSRF-Token', csrf.header)
        .attach('image', Buffer.from('fake file content'), 'test.exe')
        .expect(400);

      // Should reject executable files
      expect(response.body).toHaveProperty('error');
    });

    test('should prevent large file uploads', async () => {
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB file

      const response = await request(app)
        .post('/api/upload/product-image')
        .set('Cookie', [adminToken, csrf.cookie])
        .set('X-CSRF-Token', csrf.header)
        .attach('image', largeFile, 'large.jpg');

      // Rejected somehow — by the upload route's own size limit or the
      // body parser — never accepted with a 2xx.
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('CORS Security', () => {
    test('should handle CORS properly', async () => {
      // 204 is the correct preflight success status emitted by the cors
      // middleware — 200 was never guaranteed by the spec.
      const response = await request(app)
        .options('/api/products')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

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

// Valid base32 TOTP secret for the admin test fixture (classic test vector,
// never used anywhere real). The login flow always sends admins through the
// MFA challenge, so the helper completes the verify step with a live TOTP
// code — the same dance the real admin UI performs.
const ADMIN_TEST_TOTP_SECRET = 'JBSWY3DPEHPK3PXP';

async function createTestUsers() {
  try {
    // Create admin user. (INSERT OR IGNORE is SQLite syntax; Postgres uses
    // ON CONFLICT DO NOTHING — the old form failed silently on every run,
    // so test users never existed and every authenticated test cascaded.)
    const bcrypt = require('bcryptjs');
    const adminPassword = bcrypt.hashSync(ADMIN_PASSWORD, 12);
    await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, is_admin, mfa_secret, mfa_enabled)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@test.com', adminPassword, 'Admin', 'User', true, ADMIN_TEST_TOTP_SECRET]
    );
    // If the row already existed (ON CONFLICT DO NOTHING), make sure MFA is
    // still satisfied so login issues tokens instead of enrolling again.
    await query(
      'UPDATE users SET mfa_secret = ?, mfa_enabled = TRUE WHERE email = ?',
      [ADMIN_TEST_TOTP_SECRET, 'admin@test.com']
    );

    // Create regular user
    const userPassword = bcrypt.hashSync(USER_PASSWORD, 12);
    await query(
      'INSERT INTO users (email, password_hash, first_name, last_name, is_admin) VALUES (?, ?, ?, ?, ?) ON CONFLICT (email) DO NOTHING',
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
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (login.body.requiresMfa) {
    // Admin path: exchange the single-use mfaToken for real tokens.
    const { authenticator } = require('otplib');
    const code = authenticator.generate(ADMIN_TEST_TOTP_SECRET);
    const verify = await request(app)
      .post('/api/auth/mfa/verify')
      .send({ mfaToken: login.body.mfaToken, code });

    const verifyCookies = verify.headers['set-cookie'] || [];
    return verifyCookies.find(cookie => cookie.includes('accessToken'));
  }

  const cookies = login.headers['set-cookie'];
  return cookies.find(cookie => cookie.includes('accessToken'));
}

// Obtain a CSRF cookie/header pair for mutating requests. Any safe /api
// request issues the csrfToken cookie; the caller echoes it back.
async function getCsrfTokens(authCookie) {
  const response = await request(app)
    .get('/api/products')
    .set('Cookie', authCookie ? [authCookie] : []);

  const cookie = (response.headers['set-cookie'] || [])
    .find(c => c.includes('csrfToken'));
  const header = decodeURIComponent(cookie.split('csrfToken=')[1].split(';')[0]);
  return { cookie, header };
}
