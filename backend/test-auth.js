const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('./config/database');

async function testAuth() {
  try {
    console.log('Testing JWT authentication...');

    // Test JWT secret consistency
    const testPayload = { userId: 1, email: 'test@example.com' };
    const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';

    console.log('JWT_SECRET from env:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    console.log('Using secret:', secret);

    // Create token
    const token = jwt.sign(testPayload, secret, { expiresIn: '15m' });
    console.log('Token created successfully');

    // Verify token
    const decoded = jwt.verify(token, secret);
    console.log('Token verified successfully:', { userId: decoded.userId, email: decoded.email });

    // Test password hashing
    const password = 'testpassword';
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    const isValid = await bcrypt.compare(password, hash);
    console.log('Password verification:', isValid ? 'SUCCESS' : 'FAILED');

    // Test database connection
    const result = await query('SELECT COUNT(*) as count FROM users');
    console.log('Database query successful, users count:', result.rows[0].count);

    console.log('All authentication tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('Authentication test failed:', error.message);
    process.exit(1);
  }
}

testAuth();