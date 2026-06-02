/**
 * Double-submit-cookie CSRF protection.
 *
 * On safe (non-mutating) requests, if the requester is authenticated, issue a
 * CSRF token cookie that JS can read and echo in `X-CSRF-Token` for subsequent
 * mutating requests.
 *
 * On mutating requests (POST/PUT/PATCH/DELETE), require:
 *   1. A present `csrfToken` cookie (httpOnly:false so JS can read it).
 *   2. A matching `X-CSRF-Token` request header.
 *   3. Constant-time comparison.
 *
 * Why double-submit and not synchronizer tokens stored server-side: the auth
 * session is itself an httpOnly cookie, so we have no server-readable state
 * between login and CSRF check. The double-submit pattern keeps everything in
 * the browser and removes the need for a session store just for CSRF.
 *
 * Safe methods, webhooks, and the /api/auth/login + /register + /refresh
 * bootstrap endpoints are exempt — login flows need to set the cookie before
 * the client can echo it.
 */

const crypto = require('crypto');
const { logger } = require('../services/logger');

const CSRF_COOKIE = 'csrfToken';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT_PATHS = [
  // Bootstrap auth: before the user has a CSRF cookie we cannot enforce
  // the double-submit check without a chicken-and-egg failure.
  /^\/api\/auth\/(login|register|refresh|forgot-password|reset-password)/,
  // MFA challenge: same reasoning — the user is mid-bootstrap, no CSRF
  // cookie exists yet. The mfaToken itself is the proof of possession.
  /^\/api\/auth\/mfa\/(enroll-start|enroll-verify|verify)/,
  /^\/api\/webhooks\//,        // Webhooks sign themselves.
  /^\/api\/debug\//,            // Debug endpoints are gated by NODE_ENV elsewhere.
];

function timingSafeEqual(a, b) {
  const A = Buffer.from(a || '', 'utf8');
  const B = Buffer.from(b || '', 'utf8');
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

function ensureCsrfCookie(req, res) {
  if (!req.cookies || !req.cookies[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString('base64url');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,             // Must be readable by client JS.
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24h — re-issued on each safe request.
    });
    req.cookies[CSRF_COOKIE] = token;
  }
}

function csrfProtection(req, res, next) {
  // Issue token cookie on safe requests for any path under /api.
  if (SAFE_METHODS.has(req.method) && req.path.startsWith('/api/')) {
    ensureCsrfCookie(req, res);
    return next();
  }

  // Mutating requests: enforce.
  if (EXEMPT_PATHS.some((re) => re.test(req.path))) {
    return next();
  }

  const cookieToken = req.cookies && req.cookies[CSRF_COOKIE];
  const headerToken = req.get('X-CSRF-Token');

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }
  if (!timingSafeEqual(cookieToken, headerToken)) {
    logger.warn('CSRF token mismatch', { ip: req.ip, path: req.path });
    return res.status(403).json({ error: 'CSRF token invalid' });
  }
  return next();
}

module.exports = { csrfProtection, CSRF_COOKIE };
