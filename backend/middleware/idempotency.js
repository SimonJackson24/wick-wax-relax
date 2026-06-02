/**
 * Idempotency middleware for webhooks and other high-risk POST endpoints.
 *
 * Uses Redis SET NX EX to atomically claim a key tied to a request fingerprint.
 * First writer wins. Subsequent retries with the same key are short-circuited
 * with 200 OK and the cached response (or empty body if no response was stored).
 *
 * Required env: REDIS_URL or REDIS_HOST/PORT.
 * If Redis is unavailable, requests proceed without idempotency (fail-open) but
 * the failure is logged at `error` level so the operator can intervene.
 */

const crypto = require('crypto');
const { getRedis, isReady } = require('../config/redis');
const { logger } = require('../services/logger');

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days — covers all retry windows.

function fingerprint(req) {
  // Prefer provider-supplied event id (Revolut: `event_id`, Stripe: `id`).
  const explicitId =
    req.headers['x-revolut-event-id'] ||
    req.headers['x-event-id'] ||
    req.headers['x-idempotency-key'] ||
    (req.body && (req.body.event_id || req.body.id));
  const payload = explicitId
    ? String(explicitId)
    : JSON.stringify({ url: req.originalUrl, body: req.body });
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

function idempotency({ ttlSeconds = DEFAULT_TTL_SECONDS, scope = 'webhook' } = {}) {
  return async function idempotencyHandler(req, res, next) {
    const redis = getRedis();
    if (!isReady()) {
      logger.error('Idempotency middleware: Redis not ready, allowing request through (fail-open)', { scope, url: req.originalUrl });
      return next();
    }

    const key = `idempotency:${scope}:${fingerprint(req)}`;

    try {
      const claimed = await redis.set(key, 'in-flight', 'EX', ttlSeconds, 'NX');
      if (claimed === 'OK') {
        // First claim — buffer the response so we can replay it.
        const originalJson = res.json.bind(res);
        res.json = (body) => {
          // Best-effort: cache the serialised response for replay.
          redis.set(key, JSON.stringify({ status: res.statusCode, body }), 'EX', ttlSeconds).catch(() => {});
          return originalJson(body);
        };
        return next();
      }

      // Already claimed — return cached response if we have one, else 200.
      const cached = await redis.get(key);
      if (cached && cached !== 'in-flight') {
        const parsed = JSON.parse(cached);
        res.setHeader('X-Idempotent-Replay', 'true');
        return res.status(parsed.status || 200).json(parsed.body);
      }
      // In-flight from a concurrent request — return 409 so caller can retry.
      return res.status(409).json({ error: 'Duplicate request in progress' });
    } catch (err) {
      logger.error('Idempotency check failed', { error: err.message, scope });
      return next();
    }
  };
}

module.exports = { idempotency, fingerprint };
