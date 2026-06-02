const express = require('express');
const revolutService = require('../services/revolut');
const { idempotency } = require('../middleware/idempotency');
const { logger } = require('../services/logger');

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

      // Verify the HMAC over the raw bytes.
      if (!revolutService.verifyWebhookSignature(signature, rawBody, timestamp)) {
        logger.error('Revolut webhook: invalid signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Only after the signature has been verified do we trust the body
      // enough to parse it.
      const payload = JSON.parse(rawBody.toString('utf8'));
      const { type, data } = payload;

      if (!type || typeof type !== 'string') {
        return res.status(400).json({ error: 'Missing event type' });
      }

      await revolutService.handleWebhookEvent(type, data);

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Revolut webhook processing error', { error: error.message });
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

router.get('/health', (req, res) => {
  res.json({ status: 'Webhook endpoint healthy' });
});

module.exports = router;
