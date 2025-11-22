const express = require('express');
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const orderService = require('../services/order');

const router = express.Router();

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  // Try header first
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // If no header token, try cookie
  if (!token) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Get tracking information for an order
router.get('/:orderId', authenticateToken, [
  param('orderId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const trackingInfo = await orderService.getTrackingInfo(orderId);

    res.json(trackingInfo);
  } catch (error) {
    console.error('Error fetching tracking info:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tracking information' });
  }
});

// Set tracking number for an order (Admin only)
router.post('/:orderId/tracking', authenticateToken, requireAdmin, [
  param('orderId').isUUID(),
  body('trackingNumber').isString().notEmpty(),
  body('carrier').optional().isIn(['ROYAL_MAIL', 'DHL', 'UPS', 'FEDEX'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const { trackingNumber, carrier = 'ROYAL_MAIL' } = req.body;

    const result = await orderService.setTrackingNumber(orderId, trackingNumber, carrier);

    res.json(result);
  } catch (error) {
    console.error('Error setting tracking number:', error);
    res.status(500).json({ error: error.message || 'Failed to set tracking number' });
  }
});

// Refresh tracking data for an order
router.post('/:orderId/refresh', authenticateToken, [
  param('orderId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const trackingData = await orderService.refreshTrackingData(orderId);

    res.json({
      success: true,
      message: 'Tracking data refreshed successfully',
      trackingData
    });
  } catch (error) {
    console.error('Error refreshing tracking data:', error);
    res.status(500).json({ error: error.message || 'Failed to refresh tracking data' });
  }
});

// Update tracking status (Admin only or webhook)
router.patch('/:orderId/status', authenticateToken, requireAdmin, [
  param('orderId').isUUID(),
  body('status').isIn(['ACCEPTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'RETURNED']),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const { status, reason = '' } = req.body;

    const result = await orderService.updateTrackingStatus(orderId, status, reason);

    res.json(result);
  } catch (error) {
    console.error('Error updating tracking status:', error);
    res.status(500).json({ error: error.message || 'Failed to update tracking status' });
  }
});

// Get tracking history for an order
router.get('/:orderId/history', authenticateToken, [
  param('orderId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;

    // Get tracking history from database
    const { query } = require('../config/database');
    const historyResult = await query(
      `SELECT
        th.status,
        th.status_description,
        th.location,
        th.timestamp,
        th.carrier_data,
        u.first_name,
        u.last_name
       FROM tracking_history th
       LEFT JOIN users u ON th.changed_by = u.id
       WHERE th.order_id = ?
       ORDER BY th.timestamp DESC`,
      [orderId]
    );

    res.json({
      orderId,
      history: historyResult.rows
    });
  } catch (error) {
    console.error('Error fetching tracking history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tracking history' });
  }
});

// Webhook endpoint for Royal Mail tracking updates (no auth required for webhooks)
router.post('/webhook/royal-mail', async (req, res) => {
  try {
    const { trackingNumber, status, location, timestamp, orderId } = req.body;

    // Verify webhook signature if implemented
    // const signature = req.headers['x-royal-mail-signature'];
    // if (!royalMailService.verifyWebhookSignature(signature, req.body)) {
    //   return res.status(401).json({ error: 'Invalid webhook signature' });
    // }

    console.log('Royal Mail webhook received:', { trackingNumber, status, location, timestamp, orderId });

    // Find order by tracking number if orderId not provided
    let targetOrderId = orderId;
    if (!targetOrderId && trackingNumber) {
      const { query } = require('../config/database');
      const orderResult = await query(
        'SELECT id FROM orders WHERE tracking_number = ?',
        [trackingNumber]
      );
      if (orderResult.rows.length > 0) {
        targetOrderId = orderResult.rows[0].id;
      }
    }

    if (targetOrderId) {
      // Update tracking status
      await orderService.updateTrackingStatus(targetOrderId, status, `Webhook update: ${location}`);

      // Log the webhook event
      const { query } = require('../config/database');
      await query(
        `INSERT INTO tracking_history
         (order_id, tracking_number, status, status_description, location, timestamp, carrier_data)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          targetOrderId,
          trackingNumber,
          status,
          `Status update from webhook`,
          location,
          timestamp || new Date().toISOString(),
          JSON.stringify(req.body)
        ]
      );
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing Royal Mail webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

module.exports = router;