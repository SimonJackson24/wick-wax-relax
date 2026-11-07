const express = require('express');
const revolutService = require('../services/revolut');
const { idempotency } = require('../middleware/idempotency');
const { logger } = require('../services/logger');
const { query } = require('../config/database');

// Delivery audit log (migration 027): every inbound webhook is recorded
// BEFORE verification — rejected and failed deliveries are exactly what
// the admin console needs to see.
async function recordDelivery(source, eventType, rawBody) {
  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    payload = { _raw: rawBody.toString('utf8').slice(0, 2000) };
  }
  const result = await query(
    'INSERT INTO webhook_deliveries (source, event_type, payload, status) VALUES ($1, $2, $3::jsonb, $4) RETURNING id',
    [source, eventType || null, JSON.stringify(payload), 'RECEIVED']
  );
  return result.rows[0].id;
}

async function finishDelivery(deliveryId, status, error, signatureValid) {
  await query(
    'UPDATE webhook_deliveries SET status = $1, error = $2, signature_valid = $3, processed_at = NOW() WHERE id = $4',
    [status, error || null, signatureValid, deliveryId]
  ).catch(() => { /* logging must never break the webhook path */ });
}

const router = express.Router();

/**
 * Revolut webhook endpoint.
 *
 * CRITICAL: this route uses express.raw() so we have the unparsed bytes
 * for HMAC verification. The body parser that mounts /api/webhooks in
 * server.js is registered BEFORE the global JSON parser precisely so the
 * raw bytes survive.
 *
 * Idempotency: revolut may retry on 5xx, so we dedupe by event id with a
 * 7-day TTL. A duplicate event returns 200 with the cached response (or
 * 409 if the original is still in-flight).
 */
router.post(
  '/revolut',
  idempotency({ scope: 'revolut' }),
  express.raw({ type: '*/*', limit: '100kb' }),
  async (req, res) => {
    let deliveryId = null;
    try {
      const signatureHeader = req.headers['revolut-signature'];
      const timestampHeader = req.headers['revolut-request-timestamp'];

      // Parse the structured signature header (version=1,signature=<hex>,timestamp=<unix>).
      const parsedHeader = revolutService.parseSignatureHeader(signatureHeader);
      const signature = parsedHeader?.signature || signatureHeader;
      const timestamp = parsedHeader?.timestamp || timestampHeader;

      const rawBody = req.body;
      if (!Buffer.isBuffer(rawBody)) {
        logger.error('Revolut webhook: req.body is not a Buffer — global JSON parser likely consumed the stream before this router');
        return res.status(500).json({ error: 'Webhook misconfigured' });
      }

      deliveryId = await recordDelivery('revolut', null, rawBody);

      // Verify the HMAC over the raw bytes.
      if (!revolutService.verifyWebhookSignature(signature, rawBody, timestamp)) {
        logger.error('Revolut webhook: invalid signature');
        await finishDelivery(deliveryId, 'REJECTED', 'Invalid signature', false);
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Only after the signature has been verified do we trust the body
      // enough to parse it.
      const payload = JSON.parse(rawBody.toString('utf8'));
      const { type, data } = payload;

      if (!type || typeof type !== 'string') {
        await finishDelivery(deliveryId, 'REJECTED', 'Missing event type', true);
        return res.status(400).json({ error: 'Missing event type' });
      }

      await query('UPDATE webhook_deliveries SET event_type = $1 WHERE id = $2', [type, deliveryId]).catch(() => {});
      await revolutService.handleWebhookEvent(type, data);
      await finishDelivery(deliveryId, 'PROCESSED', null, true);

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Revolut webhook processing error', { error: error.message });
      if (deliveryId) await finishDelivery(deliveryId, 'FAILED', error.message, null);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

router.get('/health', (req, res) => {
  res.json({ status: 'Webhook endpoint healthy' });
});

module.exports = router;
