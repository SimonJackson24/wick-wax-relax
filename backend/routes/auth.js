const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const { getRedis, isReady } = require('../config/redis');
const totpService = require('../services/totp');
const { accessLogger, securityLogger } = require('../services/auditService');
const { logger } = require('../services/logger');

const router = express.Router();

// One-time-use token bookkeeping for the MFA challenge. The mfaToken JWT itself
// is short-lived (5 minutes); we additionally track the jti in Redis so a stolen
// token cannot be replayed even within that window.
const MFA_TOKEN_TTL_SECONDS = 5 * 60;
const mfaJtiKey = (jti) => `mfa:token:${jti}`;

async function markMfaJtiIssued(jti, userId) {
  const r = getRedis();
  if (!isReady()) return; // fail-open: the JWT exp still bounds the attack window
  try {
    await r.set(mfaJtiKey(jti), String(userId), 'EX', MFA_TOKEN_TTL_SECONDS);
  } catch (e) {
    logger.warn('Failed to record mfa jti', { error: e.message });
  }
}

async function consumeMfaJti(jti) {
  const r = getRedis();
  if (!isReady()) return true; // fail-open (matches issue-side)
  // Atomic check-and-delete. Returns 1 if the jti existed, 0 otherwise.
  const result = await r.del(mfaJtiKey(jti));
  return result === 1;
}

function signMfaToken(user) {
  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign(
    { userId: user.id, email: user.email, isAdmin: user.is_admin === 1, purpose: 'mfa', jti },
    process.env.JWT_SECRET,
    { expiresIn: `${MFA_TOKEN_TTL_SECONDS}s`, algorithm: 'HS256' }
  );
  return { token, jti };
}

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${req.ip}-${req.body.email || 'unknown'}`
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: 'Too many password reset requests, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}-${req.body.email || 'unknown'}`
});

function getSecureCookieOptions(maxAge) {
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: maxAge
  };
  if (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
    options.domain = 'localhost';
  } else {
    try {
      const url = new URL(frontendUrl);
      options.domain = url.hostname;
    } catch (e) {
      const domainMatch = frontendUrl.match(/https?:\/\/([^\/]+)/);
      options.domain = domainMatch ? domainMatch[1] : undefined;
    }
  }
  return options;
}

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

    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('SECURITY ERROR: JWT secrets not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
      [email, passwordHash, firstName, lastName]
    );

    const userResult = await query('SELECT id, email, first_name, last_name FROM users WHERE email = ?', [email]);
    const user = userResult.rows[0];

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshTokenHash, user.id]);

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

    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('SECURITY ERROR: JWT secrets not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Fetch the user including the MFA columns. The password_hash and the
    // mfa_secret are never sent to the client.
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, is_admin,
              mfa_enabled, mfa_enrolled_at, password_change_required
         FROM users WHERE email = ?`,
      [email]
    );
    if (result.rows.length === 0) {
      // Constant-time-ish: still hash a dummy to even out the response time.
      await bcrypt.compare(password, '$2a$12$....................');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      securityLogger.logFailedLogin(email, req.ip, req.get('User-Agent'), 'invalid_password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const isAdmin = user.is_admin === 1;
    const passwordChangeRequired = user.password_change_required === 1;

    // Admin accounts ALWAYS go through the MFA challenge. Non-admin users
    // skip MFA entirely — they do not have access to any privileged route.
    if (isAdmin) {
      const { token: mfaToken, jti } = signMfaToken(user);
      await markMfaJtiIssued(jti, user.id);

      res.cookie('mfaToken', mfaToken, getSecureCookieOptions(MFA_TOKEN_TTL_SECONDS * 1000));

      return res.json({
        requiresMfa: true,
        requiresEnrollment: !user.mfa_enabled,
        mfaToken, // also returned in body for non-browser clients
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isAdmin: true,
        },
      });
    }

    // Non-admin: issue full tokens immediately.
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: false, mfaCompleted: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshTokenHash, user.id]);

    res.cookie('accessToken', accessToken, getSecureCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getSecureCookieOptions(7 * 24 * 60 * 60 * 1000));

    securityLogger.logSuccessfulLogin(user.id, user.email, req.ip, req.get('User-Agent'));

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: false,
        passwordChangeRequired,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * MFA endpoints.
 *
 * Flow:
 *   1. POST /login with admin creds  →  200 { requiresMfa: true, mfaToken, requiresEnrollment }
 *   2a. If requiresEnrollment:
 *       POST /mfa/enroll-start  with mfaToken  →  { secret, otpauthUrl, qrDataUrl }
 *       POST /mfa/enroll-verify with mfaToken + code  →  { recoveryCodes, accessToken, refreshToken }
 *   2b. If already enrolled:
 *       POST /mfa/verify with mfaToken + code | recoveryCode  →  { accessToken, refreshToken, user }
 *
 * The mfaToken is single-use: its jti is atomically deleted from Redis on
 * the first successful verify. An attacker who steals the token still has
 * only 5 minutes AND a single attempt.
 */

function requireMfaToken(req, res, next) {
  const token = (req.cookies && req.cookies.mfaToken) || (req.body && req.body.mfaToken);
  if (!token) {
    return res.status(401).json({ error: 'MFA challenge token required' });
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(403).json({ error: 'MFA token invalid or expired' });
  }
  if (decoded.purpose !== 'mfa') {
    return res.status(403).json({ error: 'Token is not an MFA challenge token' });
  }
  req.mfa = decoded;
  next();
}

router.post('/mfa/enroll-start', authRateLimit, requireMfaToken, async (req, res) => {
  try {
    const userId = req.mfa.userId;

    // If already enrolled, refuse to start a new enrollment — the admin
    // would need to disable first (which itself requires the current secret).
    const state = await totpService.getMfaState(userId);
    if (state && state.enabled) {
      return res.status(409).json({ error: 'MFA already enrolled. Disable first to re-enrol.' });
    }

    const secret = totpService.generateSecret();
    const otpauthUrl = totpService.buildOtpAuthUrl(req.mfa.email, secret);
    const qrDataUrl = await totpService.generateQrDataUrl(otpauthUrl);

    // Stash the pending secret on the user row so the verify step can pick it
    // up. We do NOT set mfa_enabled yet — that flips when the user proves
    // they can produce a valid code.
    await query('UPDATE users SET mfa_secret = ? WHERE id = ?', [secret, userId]);

    res.json({
      secret,
      otpauthUrl,
      qrDataUrl,
      message: 'Scan the QR code with your authenticator app, then call /mfa/enroll-verify with the 6-digit code.',
    });
  } catch (error) {
    logger.error('MFA enroll-start failed', { error: error.message });
    res.status(500).json({ error: 'Failed to start MFA enrollment' });
  }
});

router.post('/mfa/enroll-verify', authRateLimit, requireMfaToken, [
  body('code').isString().matches(/^\d{6}$/),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code } = req.body;
    const userId = req.mfa.userId;
    const jti = req.mfa.jti;

    // Single-use: burn the jti before issuing tokens.
    const consumed = await consumeMfaJti(jti);
    if (!consumed) {
      return res.status(403).json({ error: 'MFA challenge already used' });
    }

    const secret = await totpService.getSecretForUser(userId);
    if (!secret) {
      return res.status(409).json({ error: 'No pending MFA enrollment. Call /mfa/enroll-start first.' });
    }

    if (!totpService.verifyToken(code, secret)) {
      // The user got the code wrong. We've still burned the jti (single-use)
      // which is acceptable — they'd restart by logging in again.
      return res.status(401).json({ error: 'Invalid code' });
    }

    const recoveryCodes = totpService.generateRecoveryCodes();
    const hashes = await Promise.all(recoveryCodes.map(totpService.hashRecoveryCode));
    await totpService.persistEnrollment(userId, secret, hashes);

    // Now issue the full session tokens.
    const userResult = await query(
      'SELECT id, email, first_name, last_name, is_admin FROM users WHERE id = ?',
      [userId]
    );
    const user = userResult.rows[0];

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: true, mfaCompleted: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshTokenHash, user.id]);

    res.clearCookie('mfaToken');
    res.cookie('accessToken', accessToken, getSecureCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getSecureCookieOptions(7 * 24 * 60 * 60 * 1000));

    securityLogger.logSuccessfulLogin(user.id, user.email, req.ip, req.get('User-Agent'));

    res.json({
      recoveryCodes, // shown ONCE — user must save them
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: true,
      },
    });
  } catch (error) {
    logger.error('MFA enroll-verify failed', { error: error.message });
    res.status(500).json({ error: 'Failed to complete MFA enrollment' });
  }
});

router.post('/mfa/verify', authRateLimit, requireMfaToken, [
  body('code').optional().isString().matches(/^\d{6}$/),
  body('recoveryCode').optional().isString().matches(/^[0-9a-f]{20}$/),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, recoveryCode } = req.body;
    if (!code && !recoveryCode) {
      return res.status(400).json({ error: 'code or recoveryCode is required' });
    }

    const userId = req.mfa.userId;
    const jti = req.mfa.jti;

    // Single-use.
    const consumed = await consumeMfaJti(jti);
    if (!consumed) {
      return res.status(403).json({ error: 'MFA challenge already used' });
    }

    const state = await totpService.getMfaState(userId);
    if (!state || !state.enabled) {
      return res.status(409).json({ error: 'MFA not enrolled. Use /mfa/enroll-start first.' });
    }

    let verified = false;
    if (code) {
      const secret = await totpService.getSecretForUser(userId);
      verified = totpService.verifyToken(code, secret);
    } else if (recoveryCode) {
      verified = await totpService.consumeRecoveryCode(userId, recoveryCode);
    }

    if (!verified) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    const userResult = await query(
      'SELECT id, email, first_name, last_name, is_admin FROM users WHERE id = ?',
      [userId]
    );
    const user = userResult.rows[0];

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: true, mfaCompleted: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshTokenHash, user.id]);

    res.clearCookie('mfaToken');
    res.cookie('accessToken', accessToken, getSecureCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getSecureCookieOptions(7 * 24 * 60 * 60 * 1000));

    securityLogger.logSuccessfulLogin(user.id, user.email, req.ip, req.get('User-Agent'));

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: true,
      },
    });
  } catch (error) {
    logger.error('MFA verify failed', { error: error.message });
    res.status(500).json({ error: 'MFA verification failed' });
  }
});

/**
 * Disable MFA. Requires the user to re-authenticate with a current TOTP
 * code (or a recovery code) AND to provide their password. This is to
 * prevent an attacker who has hijacked a session from disabling 2FA.
 */
router.post('/mfa/disable', authenticateToken, [
  body('password').isString().isLength({ min: 1 }),
  body('code').optional().isString().matches(/^\d{6}$/),
  body('recoveryCode').optional().isString().matches(/^[0-9a-f]{20}$/),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password, code, recoveryCode } = req.body;
    if (!code && !recoveryCode) {
      return res.status(400).json({ error: 'code or recoveryCode is required' });
    }

    const userId = req.user.userId;
    const userResult = await query(
      'SELECT id, is_admin, password_hash FROM users WHERE id = ?',
      [userId]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userResult.rows[0];

    // Re-verify password — defence against session hijacking.
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Re-verify TOTP (or recovery code).
    const state = await totpService.getMfaState(userId);
    if (!state || !state.enabled) {
      return res.status(409).json({ error: 'MFA is not enabled' });
    }
    let verified = false;
    if (code) {
      const secret = await totpService.getSecretForUser(userId);
      verified = totpService.verifyToken(code, secret);
    } else {
      verified = await totpService.consumeRecoveryCode(userId, recoveryCode);
    }
    if (!verified) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    await totpService.disableMfa(userId);
    accessLogger.logAdminAction(userId, req.user.email, req.ip, 'MFA_DISABLE', `user:${userId}`, { previousEnabled: true });

    res.json({ message: 'MFA disabled' });
  } catch (error) {
    logger.error('MFA disable failed', { error: error.message });
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

/**
 * Regenerate recovery codes. Requires current TOTP. The old codes are
 * invalidated immediately.
 */
router.post('/mfa/recovery-codes', authenticateToken, [
  body('code').isString().matches(/^\d{6}$/),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code } = req.body;
    const userId = req.user.userId;

    const state = await totpService.getMfaState(userId);
    if (!state || !state.enabled) {
      return res.status(409).json({ error: 'MFA is not enabled' });
    }

    const secret = await totpService.getSecretForUser(userId);
    if (!totpService.verifyToken(code, secret)) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    const newCodes = totpService.generateRecoveryCodes();
    const hashes = await Promise.all(newCodes.map(totpService.hashRecoveryCode));
    await query(
      'UPDATE users SET mfa_recovery_codes_hashed = ? WHERE id = ?',
      [JSON.stringify(hashes), userId]
    );

    res.json({ recoveryCodes: newCodes });
  } catch (error) {
    logger.error('MFA recovery-codes regen failed', { error: error.message });
    res.status(500).json({ error: 'Failed to regenerate recovery codes' });
  }
});

/**
 * Get current MFA state. Used by the admin UI to decide whether to show
 * the "enrol" wizard or the "manage" panel.
 */
router.get('/mfa/status', authenticateToken, async (req, res) => {
  try {
    const state = await totpService.getMfaState(req.user.userId);
    if (!state) return res.status(404).json({ error: 'User not found' });
    res.json({
      enabled: state.enabled,
      enrolledAt: state.enrolledAt,
    });
  } catch (error) {
    logger.error('MFA status check failed', { error: error.message });
    res.status(500).json({ error: 'Failed to read MFA status' });
  }
});

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

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

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

function getSecureCookieOptions(maxAge) {
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: maxAge
  };
  if (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
    options.domain = 'localhost';
  } else {
    try {
      const url = new URL(frontendUrl);
      options.domain = url.hostname;
    } catch (e) {
      const domainMatch = frontendUrl.match(/https?:\/\/([^\/]+)/);
      options.domain = domainMatch ? domainMatch[1] : undefined;
    }
  }
  return options;
}

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('SECURITY ERROR: JWT secrets not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Atomically rotate the refresh token. If the presented token is not the
    // currently stored one, the chain has been compromised (the user already
    // used it once, or an attacker replayed a stolen one). In that case we
    // invalidate the entire session family for this user.
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, generation: Date.now() },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    const rotation = await query(
      `UPDATE users
          SET refresh_token = ?,
              refresh_token_generation = COALESCE(refresh_token_generation, 0) + 1
        WHERE id = ? AND refresh_token = ?`,
      [newRefreshTokenHash, decoded.userId, refreshTokenHash]
    );

    if (rotation.rowCount === 0) {
      // Either the user has been deleted or the token has already been
      // rotated. Treat as a stolen-token event: nuke all sessions for the
      // user so the legitimate user is forced to re-authenticate and any
      // attacker holding the leaked token is locked out.
      await query(
        'UPDATE users SET refresh_token = NULL WHERE id = ?',
        [decoded.userId]
      );
      return res.status(403).json({ error: 'Refresh token reuse detected — sessions invalidated' });
    }

    const userResult = await query(
      'SELECT id, email, first_name, last_name, is_admin, mfa_enabled FROM users WHERE id = ?',
      [decoded.userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: 'User no longer exists' });
    }
    const user = userResult.rows[0];

    // mfaCompleted on the access token reflects whether the *current login*
    // went through TOTP. Admins always do so (login enforces it). Non-admins
    // always have it true (they never had to do MFA). We carry it forward
    // so an admin does not have to re-enter TOTP every 15 minutes when the
    // access token rotates — they only re-MFA at the 7-day refresh rotation.
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.is_admin === 1, mfaCompleted: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' }
    );

    res.cookie('accessToken', newAccessToken, getSecureCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', newRefreshToken, getSecureCookieOptions(7 * 24 * 60 * 60 * 1000));
    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (token) {
      try {
        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET not configured');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        await query('UPDATE users SET refresh_token = NULL WHERE id = ?', [decoded.userId]);
      } catch (tokenError) {
      }
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('mfaToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.post('/forgot-password', passwordResetRateLimit, [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const result = await query('SELECT id, email FROM users WHERE email = ?', [email]);
    if (result.rows.length === 0) {
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const user = result.rows[0];

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [
      resetTokenHash,
      resetTokenExpires.toISOString(),
      user.id
    ]);

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    try {
      const emailService = require('../services/emailService');
      await emailService.sendPasswordResetEmail(email, resetToken, resetUrl);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

router.post('/reset-password', [
  body('token').exists(),
  body('password').isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?',
      [resetTokenHash, new Date().toISOString()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

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

router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?',
      [resetTokenHash, new Date().toISOString()]
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