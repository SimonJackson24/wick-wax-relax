const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { accessLogger } = require('../services/auditService');
const { logger } = require('../services/logger');

/**
 * Shared authentication and authorisation middleware.
 *
 * This module is the single source of truth for "is this request authenticated
 * / is this user an admin". Several route files previously inlined copies of
 * these helpers (orders.js, upload.js, etc.) which meant the admin check was
 * slightly different in each one. Centralising here means one place to fix
 * the JWT verification, the env-var fail-closed check, and the admin logging.
 *
 * SECURITY: the admin check is performed on the JWT for latency reasons, but
 * because we keep the access token TTL to 15 minutes, a demoted admin loses
 * privileges within 15 minutes. For sensitive operations the route should
 * call `requireAdminFresh` instead, which re-reads the user record.
 */

function authenticateToken(req, res, next) {
  // Header takes precedence (mobile/CLI clients), then httpOnly cookie.
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    token = req.cookies && req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!process.env.JWT_SECRET) {
    logger.error('SECURITY ERROR: JWT_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    if (req.user) {
      accessLogger.logUnauthorizedAccess(
        req.user.userId,
        req.user.email,
        req.ip,
        req.originalUrl,
        'admin_required'
      );
    }
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * requireAdminMfa — requires the JWT to have both `isAdmin: true` and
 * `mfaCompleted: true`. This is the gate for any privileged route. The
 * login flow is the only place that issues an access token, and admin
 * accounts always go through TOTP verification first; therefore any
 * access token reaching requireAdminMfa with mfaCompleted=false is a
 * bug or an attack.
 */
function requireAdminMfa(req, res, next) {
  if (!req.user || !req.user.isAdmin || !req.user.mfaCompleted) {
    if (req.user) {
      accessLogger.logUnauthorizedAccess(
        req.user.userId,
        req.user.email,
        req.ip,
        req.originalUrl,
        req.user && req.user.isAdmin ? 'mfa_required' : 'admin_required'
      );
    }
    return res.status(403).json({
      error: 'Admin MFA session required',
      requiresMfa: true,
    });
  }
  next();
}

/**
 * requireAdminFresh — like requireAdmin, but re-reads the user record from
 * the database on every request. Use this for destructive operations or
 * anywhere a stale JWT could grant access the user no longer has.
 */
async function requireAdminFresh(req, res, next) {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const result = await query(
      'SELECT is_admin FROM users WHERE id = ? LIMIT 1',
      [req.user.userId]
    );
    if (result.rows.length === 0 || result.rows[0].is_admin !== 1) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user.isAdmin = true;
    next();
  } catch (err) {
    logger.error('requireAdminFresh DB check failed', { error: err.message });
    res.status(500).json({ error: 'Authorization check failed' });
  }
}

module.exports = { authenticateToken, requireAdmin, requireAdminMfa, requireAdminFresh };
