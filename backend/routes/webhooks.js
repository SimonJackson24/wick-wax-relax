const express = require('express');
const revolutService = require('../services/revolut');

const router = express.Router();

// Revolut webhook endpoint
router.post('/revolut', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['revolut-signature'];
    const timestamp = req.headers['revolut-request-timestamp'];
    const payload = JSON.parse(req.body);

    // Verify webhook signature
    if (!revolutService.verifyWebhookSignature(signature, payload, timestamp)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { type, data } = payload;

    // Handle the webhook event
    await revolutService.handleWebhookEvent(type, data);

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Health check for webhooks
router.get('/health', (req, res) => {
  res.json({ status: 'Webhook endpoint healthy' });
});

module.exports = router;