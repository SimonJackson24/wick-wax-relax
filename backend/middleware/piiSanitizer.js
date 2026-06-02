/**
 * PII sanitization helpers.
 *
 * Used by the request/error logger to redact emails, phone numbers, long digit
 * sequences (likely card numbers) and JWT-shaped strings before they are
 * written to disk or shipped to Sentry.
 *
 * The intent is best-effort, not a parser. We accept that a sufficiently
 * motivated adversary can craft values that slip through, but the goal is to
 * make accidental PII leakage (the common case) impossible.
 */

const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
// 13–19 digit run with optional spaces/dashes — covers cards, phones, IBANs.
const LONG_DIGITS_RE = /\b(?:\d[ -]?){13,19}\b/g;
const JWT_RE = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const BEARER_RE = /(Bearer\s+)[A-Za-z0-9._\-+/=]{8,}/gi;

const REDACTED = '[REDACTED]';

function redactString(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(JWT_RE, REDACTED)
    .replace(BEARER_RE, '$1[REDACTED]')
    .replace(EMAIL_RE, (m) => {
      // Preserve domain so logs remain useful for debugging.
      const [, domain] = m.split('@');
      return `${REDACTED}@${domain}`;
    })
    .replace(LONG_DIGITS_RE, REDACTED);
}

const PII_KEYS = new Set([
  'password',
  'password_hash',
  'old_password',
  'new_password',
  'current_password',
  'token',
  'access_token',
  'refresh_token',
  'reset_token',
  'authorization',
  'cookie',
  'set-cookie',
  'card_number',
  'cardNumber',
  'cvv',
  'cvc',
  'ssn',
  'pan',
]);

function sanitize(value, depth = 0) {
  if (depth > 8) return '[depth-limit]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map((v) => sanitize(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (PII_KEYS.has(k)) {
        out[k] = REDACTED;
      } else {
        out[k] = sanitize(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

module.exports = { sanitize, redactString, REDACTED };
