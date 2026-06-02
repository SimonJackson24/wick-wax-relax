const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const router = express.Router();
const amazonService = require('../services/amazon');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

// --------------------------------------------------------------------------
// C-06: All non-webhook routes require an authenticated admin. The webhook
// is called by Amazon SNS, not by a human, so it cannot present a JWT.
// --------------------------------------------------------------------------

// Sync inventory from Amazon
router.post('/sync-inventory', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // In production, get products from database
    const localProducts = [
      { sku: 'SAMPLE-SKU-1', stock_quantity: 100 },
      { sku: 'SAMPLE-SKU-2', stock_quantity: 50 }
    ];

    const inventoryUpdates = await amazonService.syncInventoryLevels(localProducts);

    res.json({
      success: true,
      updates: inventoryUpdates,
      message: `Found ${inventoryUpdates.length} inventory discrepancies`
    });
  } catch (error) {
    console.error('Error syncing Amazon inventory:', error);
    res.status(500).json({
      error: 'Failed to sync Amazon inventory',
      message: error.message
    });
  }
});

// Get Amazon inventory
router.get('/inventory', authenticateToken, requireAdmin, [
  query('skus').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const skus = req.query.skus ? req.query.skus.split(',') : [];
    const inventory = await amazonService.getInventory(skus);

    res.json({
      success: true,
      inventory: inventory
    });
  } catch (error) {
    console.error('Error fetching Amazon inventory:', error);
    res.status(500).json({
      error: 'Failed to fetch Amazon inventory',
      message: error.message
    });
  }
});

// Get Amazon orders
router.get('/orders', authenticateToken, requireAdmin, [
  query('createdAfter').optional().isISO8601(),
  query('statuses').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const createdAfter = req.query.createdAfter;
    const statuses = req.query.statuses ? req.query.statuses.split(',') : [];
    const orders = await amazonService.getOrders(createdAfter, statuses);

    res.json({
      success: true,
      orders: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error fetching Amazon orders:', error);
    res.status(500).json({
      error: 'Failed to fetch Amazon orders',
      message: error.message
    });
  }
});

// Update pricing on Amazon
router.post('/pricing', authenticateToken, requireAdmin, [
  body('skus').isArray(),
  body('prices').isArray(),
  body('skus.*').isString(),
  body('prices.*').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skus, prices } = req.body;

    if (skus.length !== prices.length) {
      return res.status(400).json({
        error: 'SKUs and prices arrays must have the same length'
      });
    }

    const result = await amazonService.updatePricing(skus, prices);

    res.json({
      success: true,
      result: result,
      message: `Updated pricing for ${skus.length} products`
    });
  } catch (error) {
    console.error('Error updating Amazon pricing:', error);
    res.status(500).json({
      error: 'Failed to update Amazon pricing',
      message: error.message
    });
  }
});

// Sync product catalog from Amazon
router.post('/sync-catalog', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const catalog = await amazonService.syncProductCatalog();

    res.json({
      success: true,
      catalog: catalog,
      count: catalog.length,
      message: `Synced ${catalog.length} products from Amazon catalog`
    });
  } catch (error) {
    console.error('Error syncing Amazon catalog:', error);
    res.status(500).json({
      error: 'Failed to sync Amazon catalog',
      message: error.message
    });
  }
});

// Get sales reports
router.get('/reports/sales', authenticateToken, requireAdmin, [
  query('startDate').isISO8601(),
  query('endDate').isISO8601(),
  query('reportType').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, reportType } = req.query;
    const report = await amazonService.getSalesReports(reportType, startDate, endDate);

    res.json({
      success: true,
      report: report,
      message: 'Sales report generated successfully'
    });
  } catch (error) {
    console.error('Error generating Amazon sales report:', error);
    res.status(500).json({
      error: 'Failed to generate Amazon sales report',
      message: error.message
    });
  }
});

// --------------------------------------------------------------------------
// C-07: Webhook endpoint for Amazon SNS notifications.
//
// SNS sends two relevant message types to a freshly-subscribed HTTP(S)
// endpoint: a SubscriptionConfirmation (which we must GET the SubscribeURL
// of to confirm the subscription) and a Notification (which carries the
// actual business event). Both must be cryptographically verified against
// the X.509 certificate that SNS publishes, fetched from the SigningCertURL
// in the message itself.
//
// SECURITY: This endpoint is unauthenticated by design — it is called by
// AWS, not by a user. We MUST verify the SNS signature on every request or
// an attacker can forge arbitrary messages (order changes, inventory
// changes, etc.). The previous implementation only checked that the
// x-amz-sns-message-type header equalled 'Notification', which is just the
// message-type field, not a signature.
// --------------------------------------------------------------------------

// Cache the X.509 signing certificates for one hour to avoid re-fetching on
// every webhook delivery. Keyed by SigningCertURL. Caching is best-effort:
// a fetch failure is never fatal to the cache — we just re-try next time.
const SIGNING_CERT_CACHE = new Map(); // url -> { cert, fetchedAt }
const SIGNING_CERT_TTL_MS = 60 * 60 * 1000;

// Hostname whitelist for SigningCertURL and SubscribeURL. AWS publishes
// signing certs only from sns.<region>.amazonaws.com. Anything else is a
// phishing attempt (or worse, an attempt to make us fetch an attacker-
// controlled cert so we sign-check garbage).
function isAwsSnsHostname(hostname) {
  // Strict regex per AWS docs: sns.<region>.amazonaws.com (optional trailing dot).
  return /^sns\.[a-z0-9-]+\.amazonaws\.com\.?$/i.test(hostname);
}

async function getSigningCert(signingCertUrl) {
  const parsed = new URL(signingCertUrl);
  if (parsed.protocol !== 'https:') {
    throw new Error('SigningCertURL must use https');
  }
  if (!isAwsSnsHostname(parsed.hostname)) {
    throw new Error(`SigningCertURL hostname not allowed: ${parsed.hostname}`);
  }

  const cached = SIGNING_CERT_CACHE.get(signingCertUrl);
  const now = Date.now();
  if (cached && (now - cached.fetchedAt) < SIGNING_CERT_TTL_MS) {
    return cached.cert;
  }

  const response = await axios.get(signingCertUrl, {
    responseType: 'text',
    transformResponse: (x) => x, // don't let axios try to JSON.parse the PEM
    timeout: 5000,
    maxRedirects: 0,
  });
  const cert = response.data;
  if (typeof cert !== 'string' || !cert.includes('BEGIN CERTIFICATE')) {
    throw new Error('SigningCertURL did not return a PEM certificate');
  }
  SIGNING_CERT_CACHE.set(signingCertUrl, { cert, fetchedAt: now });
  return cert;
}

// Build the canonical string SNS expects to be signed, per the spec at
// https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
//  - Notification: fixed field order — Message, MessageId, Subject (if
//    present), Timestamp, TopicArn, Type — each followed by a newline.
//  - SubscriptionConfirmation / UnsubscribeConfirmation: every field
//    sorted alphabetically by name, EXCEPT for Signature, SignatureVersion,
//    SigningCertURL, and UnsubscribeURL. Each included field contributes
//    'name\nvalue\n' to the string.
function buildStringToSign(message) {
  if (!message || typeof message !== 'object') {
    throw new Error('SNS message is not an object');
  }
  const type = message.Type;
  if (type === 'Notification') {
    const parts = [
      message.Message,
      message.MessageId,
    ];
    if (Object.prototype.hasOwnProperty.call(message, 'Subject')) {
      parts.push(message.Subject);
    }
    parts.push(message.Timestamp);
    parts.push(message.TopicArn);
    parts.push(message.Type);
    return parts.join('\n') + '\n';
  }
  if (type === 'SubscriptionConfirmation' || type === 'UnsubscribeConfirmation') {
    const excluded = new Set(['Signature', 'SignatureVersion', 'SigningCertURL', 'UnsubscribeURL']);
    const fieldNames = Object.keys(message)
      .filter((k) => !excluded.has(k))
      .sort();
    return fieldNames.map((k) => `${k}\n${message[k]}\n`).join('');
  }
  throw new Error(`Unsupported SNS message Type: ${type}`);
}

function verifySnsSignature(message) {
  if (!message.Signature || !message.SignatureVersion || !message.SigningCertURL) {
    throw new Error('Message missing signature fields');
  }
  if (message.SignatureVersion !== '1') {
    throw new Error(`Unsupported SignatureVersion: ${message.SignatureVersion}`);
  }
  return getSigningCert(message.SigningCertURL).then((cert) => {
    const verifier = crypto.createVerify('RSA-SHA1');
    verifier.update(buildStringToSign(message));
    verifier.end();
    const ok = verifier.verify(cert, message.Signature, 'base64');
    if (!ok) throw new Error('SNS signature verification failed');
    return true;
  });
}

// CRITICAL: this route uses express.raw() so the request body is the
// unparsed JSON bytes. After the global body-parser fix in C-04, the rest
// of the API uses express.json(), which is mounted AFTER /api/amazon in
// server.js — but we still install express.raw() locally on the webhook to
// be defensive (e.g. in case the mount order is ever changed).
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'Empty or non-buffer body' });
    }

    let message;
    try {
      message = JSON.parse(req.body.toString('utf8'));
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    // Verify the SNS signature BEFORE we trust anything in the body.
    try {
      await verifySnsSignature(message);
    } catch (verifyErr) {
      console.error('Amazon SNS signature verification failed:', verifyErr.message);
      return res.status(403).json({ error: 'Invalid SNS signature' });
    }

    const type = message.Type;

    if (type === 'SubscriptionConfirmation') {
      // Auto-confirm: GET the SubscribeURL. Validate the URL hostname first
      // to make sure it actually points at AWS before we hit it.
      const subUrl = message.SubscribeURL;
      if (typeof subUrl !== 'string') {
        return res.status(400).json({ error: 'SubscribeURL missing' });
      }
      let parsed;
      try {
        parsed = new URL(subUrl);
      } catch (e) {
        return res.status(400).json({ error: 'Malformed SubscribeURL' });
      }
      if (parsed.protocol !== 'https:' || !isAwsSnsHostname(parsed.hostname)) {
        return res.status(400).json({ error: 'SubscribeURL hostname not allowed' });
      }
      try {
        await axios.get(subUrl, { timeout: 5000, maxRedirects: 0 });
        console.log('Amazon SNS SubscriptionConfirmation processed for', message.TopicArn);
      } catch (e) {
        console.error('Failed to confirm Amazon SNS subscription:', e.message);
        return res.status(502).json({ error: 'Subscription confirmation failed' });
      }
      return res.json({ success: true, message: 'Subscription confirmed' });
    }

    if (type === 'Notification') {
      // SECURITY: Log only the notification type, not the full payload, to
      // avoid dumping sensitive data into logs.
      console.log('Amazon SNS notification received, type:', message.notificationType || 'unknown');

      // Dispatch on the inner payload's notificationType, not on the SNS
      // envelope Type (which is always 'Notification' here).
      const inner = typeof message.Message === 'string' ? safeParseInner(message.Message) : null;
      switch (inner && inner.notificationType) {
        case 'ORDER_CHANGE':
          console.log('Amazon order change notification received');
          break;
        case 'INVENTORY_CHANGE':
          console.log('Amazon inventory change notification received');
          break;
        default:
          console.log('Unknown Amazon notification payload type:', (inner && inner.notificationType) || 'none');
      }
      return res.json({ success: true, message: 'Notification processed' });
    }

    if (type === 'UnsubscribeConfirmation') {
      console.log('Amazon SNS UnsubscribeConfirmation received for', message.TopicArn);
      return res.json({ success: true, message: 'Unsubscribe acknowledged' });
    }

    return res.status(400).json({ error: 'Unsupported message Type' });
  } catch (error) {
    console.error('Error processing Amazon webhook:', error);
    res.status(500).json({
      error: 'Failed to process Amazon webhook',
      message: error.message,
    });
  }
});

function safeParseInner(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

// Health check for Amazon integration (admin only — reveals the SP-API
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Test connection by getting a small amount of inventory
    await amazonService.getInventory([]);

    res.json({
      success: true,
      status: 'healthy',
      message: 'Amazon SP-API connection is working'
    });
  } catch (error) {
    console.error('Amazon health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Amazon SP-API connection failed',
      message: error.message
    });
  }
});

module.exports = router;