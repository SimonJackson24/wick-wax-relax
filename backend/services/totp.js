const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const { logger } = require('./logger');

/**
 * Admin TOTP two-factor authentication.
 *
 * Threat model: an attacker steals a password (phishing, breach, keylogger).
 * Without 2FA, that password is enough to call /api/admin/* and read every
 * customer's PII or modify every product. With 2FA, the attacker also needs
 * the 6-digit TOTP code which rotates every 30 seconds and is only ever
 * produced on the admin's device.
 *
 * Implementation: RFC 6238 (TOTP) with SHA-1, 6 digits, 30-second period.
 * Authenticator app compatibility tested with:
 *   - Google Authenticator (iOS/Android)
 *   - 1Password
 *   - Authy
 *   - Bitwarden
 *
 * Recovery codes: 10 single-use codes, generated at enrollment. The user is
 * shown them once. Each code is bcrypt-hashed (cost 10) before storage.
 *
 * Constants (RFC 6238 recommendations):
 *   - Period: 30s
 *   - Digits: 6
 *   - Algorithm: SHA-1 (industry standard, supported by every authenticator)
 *   - Window: ±1 step (90s total tolerance for clock drift)
 */
const ISSUER = 'Wick Wax Relax';
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_BYTES = 10; // 20 hex chars

// Configure otplib once. Window of ±1 step = 90s tolerance for clock drift
// between the server and the user's device.
authenticator.options = {
  step: 30,
  window: 1,
  digits: 6,
  algorithm: 'sha1',
};

function buildOtpAuthUrl(email, secret) {
  // otpauth:// scheme is the standard URI encoded into the QR code.
  return authenticator.keyuri(email, ISSUER, secret);
}

async function generateQrDataUrl(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256,
    color: { dark: '#1c1917', light: '#FFFFFF' },
  });
}

function generateSecret() {
  // 20 bytes (160 bits) of entropy, base32-encoded. Matches Google
  // Authenticator's default key length.
  const buf = crypto.randomBytes(20);
  return authenticator.encode(buf);
}

function verifyToken(token, secret) {
  // Strip whitespace (mobile keyboards occasionally insert it). The otplib
  // library expects a 6-digit string.
  const cleaned = String(token || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;
  return authenticator.verify({ token: cleaned, secret });
}

function generateRecoveryCodes() {
  // 10 codes, each a 20-character hex string. The user copies them at
  // enrollment; the server only stores their bcrypt hashes.
  const codes = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i += 1) {
    codes.push(crypto.randomBytes(RECOVERY_CODE_BYTES).toString('hex'));
  }
  return codes;
}

async function hashRecoveryCode(code) {
  return bcrypt.hash(String(code).toLowerCase(), 10);
}

async function consumeRecoveryCode(userId, code) {
  const lowered = String(code || '').toLowerCase().trim();
  if (!/^[0-9a-f]{20}$/.test(lowered)) return false;

  const result = await query(
    'SELECT mfa_recovery_codes_hashed FROM users WHERE id = ?',
    [userId]
  );
  if (result.rows.length === 0) return false;

  const hashed = result.rows[0].mfa_recovery_codes_hashed || [];
  if (!Array.isArray(hashed) || hashed.length === 0) return false;

  for (let i = 0; i < hashed.length; i += 1) {
    // bcrypt.compare is constant-time per code. With at most 10 codes this is
    // fine. If we ever bump the code count, switch to a per-user "is_compromised"
    // flag + alert admin.
    // eslint-disable-next-line no-await-in-loop
    if (await bcrypt.compare(lowered, hashed[i])) {
      const remaining = hashed.filter((_, idx) => idx !== i);
      await query(
        'UPDATE users SET mfa_recovery_codes_hashed = ? WHERE id = ?',
        [JSON.stringify(remaining), userId]
      );
      return true;
    }
  }
  return false;
}

async function persistEnrollment(userId, secret, recoveryCodeHashes) {
  await query(
    `UPDATE users
        SET mfa_secret = ?,
            mfa_enabled = TRUE,
            mfa_recovery_codes_hashed = ?,
            mfa_enrolled_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [secret, JSON.stringify(recoveryCodeHashes), userId]
  );
}

async function disableMfa(userId) {
  await query(
    `UPDATE users
        SET mfa_secret = NULL,
            mfa_enabled = FALSE,
            mfa_recovery_codes_hashed = NULL,
            mfa_enrolled_at = NULL
      WHERE id = ?`,
    [userId]
  );
}

async function getMfaState(userId) {
  const result = await query(
    `SELECT mfa_enabled, mfa_enrolled_at FROM users WHERE id = ?`,
    [userId]
  );
  if (result.rows.length === 0) return null;
  return {
    enabled: !!result.rows[0].mfa_enabled,
    enrolledAt: result.rows[0].mfa_enrolled_at,
  };
}

async function getSecretForUser(userId) {
  const result = await query(
    'SELECT mfa_secret FROM users WHERE id = ?',
    [userId]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].mfa_secret;
}

module.exports = {
  authenticator,
  buildOtpAuthUrl,
  generateQrDataUrl,
  generateSecret,
  verifyToken,
  generateRecoveryCodes,
  hashRecoveryCode,
  consumeRecoveryCode,
  persistEnrollment,
  disableMfa,
  getMfaState,
  getSecretForUser,
  logger,
};
