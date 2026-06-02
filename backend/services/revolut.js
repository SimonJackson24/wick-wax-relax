const axios = require('axios');
const crypto = require('crypto');
const { query } = require('../config/database');
const { logger } = require('./logger');

/**
 * Revolut payment integration.
 *
 * Webhook signature verification:
 *   Revolut signs the RAW request body bytes (not a re-serialised object) with
 *   a shared HMAC-SHA256 secret. The signature is sent in the
 *   `Revolut-Signature` header in the form `version=1,signature=<hex>`. We
 *   verify the signature on the raw bytes — Express must mount this route
 *   with the `express.raw` body parser so `req.body` is a Buffer.
 *
 * Payment intent handling:
 *   handlePaymentSucceeded verifies the captured amount + currency match the
 *   pending order before flipping order status. Without this check, a spoofed
 *   or misrouted webhook can mark an order paid without the customer actually
 *   being charged.
 *
 * Idempotency:
 *   The /api/webhooks/revolut route is wrapped in the idempotency middleware
 *   which dedupes by event id with a 7-day TTL.
 */

class RevolutService {
  constructor() {
    this.baseUrl = process.env.REVOLUT_API_URL || 'https://api.revolut.com';
    this.apiKey = process.env.REVOLUT_API_KEY;
    this.webhookSecret = process.env.REVOLUT_WEBHOOK_SECRET;
  }

  // Compute the expected signature for a raw body + timestamp.
  generateSignature(rawBodyBuffer, timestamp) {
    if (!this.webhookSecret) throw new Error('REVOLUT_WEBHOOK_SECRET not configured');
    const signedPayload = `${timestamp}.${rawBodyBuffer.toString('utf8')}`;
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(signedPayload)
      .digest('hex');
  }

  // Verify a Revolut webhook signature against the raw request body.
  // `rawBody` must be a Buffer (not a parsed object). `timestamp` is taken
  // from the `Revolut-Signature` header's `timestamp=` component, or the
  // `X-Revolut-Timestamp` header. We accept a 5-minute clock skew window.
  verifyWebhookSignature(signature, rawBody, timestamp) {
    if (!signature || typeof signature !== 'string') return false;
    if (!Buffer.isBuffer(rawBody)) {
      logger.error('Revolut webhook verify: rawBody must be a Buffer');
      return false;
    }
    if (!timestamp || typeof timestamp !== 'string') return false;

    const webhookTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(webhookTime) || Math.abs(currentTime - webhookTime) > 300) {
      logger.error('Revolut webhook verify: timestamp out of window');
      return false;
    }

    let expected;
    try {
      expected = this.generateSignature(rawBody, timestamp);
    } catch (err) {
      logger.error('Revolut webhook verify: cannot compute expected signature', { error: err.message });
      return false;
    }

    let providedBuf;
    try {
      providedBuf = Buffer.from(signature, 'hex');
    } catch {
      return false;
    }
    const expectedBuf = Buffer.from(expected, 'hex');
    if (providedBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(providedBuf, expectedBuf);
  }

  // Parse the `Revolut-Signature` header. Format: `version=1,signature=<hex>`
  // and (optionally) `timestamp=<unix-seconds>`. Older Revolut payloads may
  // concatenate the signature in a different form; we accept both shapes.
  parseSignatureHeader(headerValue) {
    if (!headerValue || typeof headerValue !== 'string') return null;
    const parts = Object.fromEntries(
      headerValue.split(',').map((p) => {
        const idx = p.indexOf('=');
        return idx === -1 ? [p.trim(), ''] : [p.slice(0, idx).trim(), p.slice(idx + 1).trim()];
      })
    );
    if (!parts.signature) return null;
    return {
      signature: parts.signature,
      timestamp: parts.timestamp || null,
      version: parts.version || null,
    };
  }

  // Create a payment intent. Amount is in major units (e.g. £12.34); we convert
  // to minor units (pence) before sending.
  async createPaymentIntent(amount, currency = 'GBP', description = '') {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/1.0/payment-intents`,
        {
          amount: Math.round(amount * 100),
          currency,
          description,
          capture_mode: 'automatic'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000,
        }
      );

      return {
        paymentIntentId: response.data.id,
        clientSecret: response.data.client_secret,
        status: response.data.status
      };
    } catch (error) {
      logger.error('Revolut payment intent creation failed:', error.response?.data || error.message);
      throw new Error('Failed to create payment intent');
    }
  }

  async confirmPayment(paymentIntentId, paymentMethodId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/1.0/payment-intents/${paymentIntentId}/confirm`,
        { payment_method: paymentMethodId },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000,
        }
      );
      return { status: response.data.status, paymentId: response.data.id };
    } catch (error) {
      logger.error('Revolut payment confirmation failed:', error.response?.data || error.message);
      throw new Error('Failed to confirm payment');
    }
  }

  async getPaymentStatus(paymentIntentId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/1.0/payment-intents/${paymentIntentId}`,
        {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
          timeout: 10000,
        }
      );
      return {
        status: response.data.status,
        amount: response.data.amount / 100,
        currency: response.data.currency,
        paymentId: response.data.id,
        amountMinor: response.data.amount,
      };
    } catch (error) {
      logger.error('Revolut payment status check failed:', error.response?.data || error.message);
      throw new Error('Failed to get payment status');
    }
  }

  async processRefund(paymentId, amount, reason = 'requested_by_customer') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/1.0/refunds`,
        { payment: paymentId, amount: Math.round(amount * 100), reason },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000,
        }
      );
      return {
        refundId: response.data.id,
        status: response.data.status,
        amount: response.data.amount / 100
      };
    } catch (error) {
      logger.error('Revolut refund failed:', error.response?.data || error.message);
      throw new Error('Failed to process refund');
    }
  }

  // Webhook dispatcher. Routes by event type to the appropriate handler.
  // The route must pass the verified raw body and the parsed event object.
  async handleWebhookEvent(eventType, eventData) {
    const eventHandlers = {
      'payment_intent.succeeded': (d) => this.handlePaymentSucceeded(d),
      'payment_intent.payment_failed': (d) => this.handlePaymentFailed(d),
      'payment_intent.canceled': (d) => this.handlePaymentCanceled(d),
      'charge.dispute.created': (d) => this.handleDisputeCreated(d),
    };
    const handler = eventHandlers[eventType];
    if (!handler) {
      logger.info(`Unhandled Revolut webhook event: ${eventType}`);
      return;
    }
    await handler(eventData);
  }

  /**
   * Verify that a payment-succeeded event is genuine AND matches the order.
   * Returns { ok: true, orderId } on success, { ok: false, reason } on rejection.
   */
  async verifyAndResolveOrder(paymentIntentId, reportedAmountMinor, reportedCurrency) {
    // 1. Find the payment record + the order it is attached to.
    const paymentResult = await query(
      `SELECT p.id AS payment_id, p.order_id, p.amount, p.currency, p.status,
              o.status AS order_status, o.total
         FROM payments p
         JOIN orders o ON o.id = p.order_id
        WHERE p.revolut_payment_id = ?
        LIMIT 1`,
      [paymentIntentId]
    );
    if (paymentResult.rows.length === 0) {
      return { ok: false, reason: 'unknown_payment_intent' };
    }
    const row = paymentResult.rows[0];

    // 2. Amount/currency must match. Use the database's view of the order, not
    //    anything the webhook payload claims, as the source of truth.
    const expectedMinor = Math.round(parseFloat(row.amount) * 100);
    if (expectedMinor !== reportedAmountMinor) {
      logger.error('Revolut webhook amount mismatch', {
        paymentIntentId,
        expectedMinor,
        reportedMinor: reportedAmountMinor,
      });
      return { ok: false, reason: 'amount_mismatch' };
    }
    if (reportedCurrency && row.currency && reportedCurrency !== row.currency) {
      return { ok: false, reason: 'currency_mismatch' };
    }

    // 3. Refuse to advance a payment that is already in a terminal state.
    if (['SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED'].includes(row.status)) {
      return { ok: false, reason: `payment_already_${row.status.toLowerCase()}` };
    }

    return { ok: true, orderId: row.order_id, paymentId: row.payment_id };
  }

  async handlePaymentSucceeded(data) {
    const paymentIntentId = data.id;
    const amountMinor = data.amount;
    const currency = data.currency;

    if (!paymentIntentId) {
      logger.error('Revolut payment_intent.succeeded missing id');
      return;
    }

    const check = await this.verifyAndResolveOrder(paymentIntentId, amountMinor, currency);
    if (!check.ok) {
      logger.error('Revolut webhook rejected', { paymentIntentId, reason: check.reason });
      return;
    }

    try {
      await query('UPDATE payments SET status = ? WHERE id = ?', ['SUCCEEDED', check.paymentId]);
      await query('UPDATE orders SET status = ? WHERE id = ?', ['PROCESSING', check.orderId]);
      await query(
        `INSERT INTO order_status_history (id, order_id, old_status, new_status, changed_by, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [require('crypto').randomUUID(), check.orderId, 'PENDING', 'PROCESSING', null, 'Revolut webhook: payment succeeded']
      );
      logger.info(`Revolut payment ${paymentIntentId} → order ${check.orderId} PROCESSING`);
    } catch (error) {
      logger.error('Failed to mark Revolut payment succeeded', { error: error.message });
      throw error;
    }
  }

  async handlePaymentFailed(data) {
    const paymentIntentId = data.id;
    if (!paymentIntentId) return;

    const paymentResult = await query(
      'SELECT id, order_id FROM payments WHERE revolut_payment_id = ?',
      [paymentIntentId]
    );
    if (paymentResult.rows.length === 0) return;

    const { id: paymentId, order_id: orderId } = paymentResult.rows[0];
    await query('UPDATE payments SET status = ? WHERE id = ?', ['FAILED', paymentId]);
    await query('UPDATE orders SET status = ? WHERE id = ?', ['CANCELLED', orderId]);
  }

  async handlePaymentCanceled(data) {
    const paymentIntentId = data.id;
    if (!paymentIntentId) return;

    const paymentResult = await query(
      'SELECT id, order_id FROM payments WHERE revolut_payment_id = ?',
      [paymentIntentId]
    );
    if (paymentResult.rows.length === 0) return;

    const { id: paymentId, order_id: orderId } = paymentResult.rows[0];
    await query('UPDATE payments SET status = ? WHERE id = ?', ['CANCELED', paymentId]);
    await query('UPDATE orders SET status = ? WHERE id = ?', ['CANCELLED', orderId]);
  }

  async handleDisputeCreated(data) {
    logger.warn('Revolut dispute created', { disputeId: data.id, reason: data.reason });
    // Persist dispute record so admin can review and respond.
    try {
      await query(
        `INSERT INTO disputes (id, revolut_dispute_id, payment_id, reason, status, raw_payload, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT (revolut_dispute_id) DO NOTHING`,
        [
          require('crypto').randomUUID(),
          data.id,
          data.payment || null,
          data.reason || null,
          data.status || 'OPEN',
          JSON.stringify(data),
        ]
      );
    } catch (err) {
      logger.error('Failed to persist dispute', { error: err.message });
    }
  }
}

module.exports = new RevolutService();
