const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const router = express.Router();

// Stricter rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => {
    // Use IP + email for more specific rate limiting
    return `${req.ip}-${req.body.email || 'unknown'}`;
  }
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: {
    error: 'Too many password reset requests, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.ip}-${req.body.email || 'unknown'}`;
  }
});

// Auto-configure secure cookie options for any environment
function getSecureCookieOptions(maxAge) {
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  const options = {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'strict' : 'lax', // Strict for production, lax for development
    path: '/',
    maxAge: maxAge
  };
  
  // Auto-detect domain for cookie compatibility
  if (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
    // For localhost development, set domain explicitly for cross-origin cookie support
    options.domain = 'localhost';
  } else {
    // For production domains, extract and set the domain
    try {
      const url = new URL(frontendUrl);
      options.domain = url.hostname;
    } catch (e) {
      // Fallback: try to extract domain from string
      const domainMatch = frontendUrl.match(/https?:\/\/([^\/]+)/);
      options.domain = domainMatch ? domainMatch[1] : undefined;
    }
  }
  
  return options;
}

// Register new user
router.post('/register', authRateLimit, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('firstName').trim().isLength({ min: 1, max: 50 }),
  body('lastName').trim().isLength({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;

    // SECURITY: Fail if JWT_SECRET is not configured
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('SECURITY ERROR: JWT secrets not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
      [email, passwordHash, firstName, lastName]
    );

    // Get the inserted user
    const userResult = await query('SELECT id, email, first_name, last_name FROM users WHERE email = ?', [email]);
    const user = userResult.rows[0];

    // Generate access token with explicit algorithm
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' } // Explicit algorithm
    );

    // Generate refresh token with explicit algorithm
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    // SECURITY: Hash refresh token before storing (one-way hash)
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshTokenHash, user.id]);

    // Set httpOnly cookies
    res.cookie('accessToken', accessToken, getSecureCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getSecureCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', authRateLimit, [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // SECURITY: Fail if JWT secrets not configured
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('SECURITY ERROR: JWT secrets not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Find user
    const result = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Generate access token with explicit algorithm
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.is_admin === 1 },
      process.env.JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' } // Explicit algorithm
    );

    // Generate refresh token with explicit algorithm
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    // SECURITY: Hash refresh token before storing (one-way hash)
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshTokenHash, user.id]);

    // Set httpOnly cookies
    res.cookie('accessToken', accessToken, getSecureCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getSecureCookieOptions(7 * 24 * 60 * 60 * 1000));

    // SECURITY: Check if password change is required (enforced on first login)
    const passwordChangeRequired = user.password_change_required === 1;

    const userResponse = {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      firstName: user.first_name,
      lastName: user.last_name,
      isAdmin: user.is_admin === 1,
      passwordChangeRequired: passwordChangeRequired
    };

    res.json({
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, is_admin, created_at, last_login FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const userResponse = {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      firstName: user.first_name,
      lastName: user.last_name,
      isAdmin: user.is_admin === 1,
      createdAt: user.created_at,
      lastLogin: user.last_login
    };

    res.json({
      user: userResponse
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, is_admin, created_at, last_login FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      firstName: user.first_name,
      lastName: user.last_name,
      isAdmin: user.is_admin === 1,
      createdAt: user.created_at,
      lastLogin: user.last_login
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Middleware to authenticate JWT token from cookies
function authenticateToken(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // SECURITY: Fail if JWT_SECRET is not configured
  if (!process.env.JWT_SECRET) {
    console.error('SECURITY ERROR: JWT_SECRET environment variable is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // SECURITY: Explicit algorithm specification to prevent algorithm confusion attacks
  jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // SECURITY: Fail if JWT secrets not configured
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('SECURITY ERROR: JWT secrets not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify refresh token with explicit algorithm
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });

    // SECURITY: Hash the incoming refresh token and compare with stored hash
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Check if refresh token hash exists in database
    const result = await query('SELECT id, email, first_name, last_name, is_admin FROM users WHERE id = ? AND refresh_token = ?', [decoded.userId, refreshTokenHash]);

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const user = result.rows[0];

    // Generate new access token with explicit algorithm
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.is_admin === 1 },
      process.env.JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' }
    );

    // Generate new refresh token with explicit algorithm
    const newRefreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    // SECURITY: Hash new refresh token before storing
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    await query('UPDATE users SET refresh_token = ? WHERE id = ?', [newRefreshTokenHash, user.id]);

    // Set new cookies
    res.cookie('accessToken', newAccessToken, getSecureCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', newRefreshToken, getSecureCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// Logout endpoint - doesn't require authentication since tokens might be expired
router.post('/logout', async (req, res) => {
  try {
    // Try to clear refresh token from database if user is authenticated
    const token = req.cookies.accessToken;
    if (token) {
      try {
        // SECURITY: Fail if JWT_SECRET not configured
        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET not configured');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        // SECURITY: Clear refresh token hash
        await query('UPDATE users SET refresh_token = NULL WHERE id = ?', [decoded.userId]);
      } catch (tokenError) {
        // Token is invalid/expired, just clear cookies
      }
    }

    // Always clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Password reset request
router.post('/forgot-password', passwordResetRateLimit, [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user
    const result = await query('SELECT id, email FROM users WHERE email = ?', [email]);
    if (result.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [
      resetToken,
      resetTokenExpires.toISOString(),
      user.id
    ]);

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    try {
      const emailService = require('../services/emailService');
      await emailService.sendPasswordResetEmail(email, resetToken, resetUrl);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails, just log it
    }

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Password reset confirmation
router.post('/reset-password', [
  body('token').exists(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Find user with valid reset token
    const result = await query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?',
      [token, new Date().toISOString()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Verify reset token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?',
      [token, new Date().toISOString()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ error: 'Failed to verify reset token' });
  }
});

module.exports = router;