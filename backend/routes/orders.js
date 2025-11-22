const express = require('express');
const { query } = require('../config/database');
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const orderService = require('../services/order');
const revolutService = require('../services/revolut');

const router = express.Router();

// Middleware to authenticate JWT token (supports both header and cookie)
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

// Create new order
router.post('/', authenticateToken, [
  body('items').isArray({ min: 1 }),
  body('items.*.variantId').isUUID(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('shippingAddress').isObject(),
  body('paymentMethod').isIn(['APPLE_PAY', 'GOOGLE_PAY', 'KLARNA', 'CLEARPAY'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, shippingAddress, paymentMethod } = req.body;
    const userId = req.user.userId;

    const result = await orderService.createOrder(
      { items, shippingAddress, paymentMethod },
      userId
    );

    res.status(201).json(result);

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    const result = await orderService.getOrders(
      { status },
      page,
      limit
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by ID
router.get('/:id', authenticateToken, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const order = await orderService.getOrderDetails(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (Admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, [
  param('id').isUUID(),
  body('status').isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, reason } = req.body;
    const changedBy = req.user.userId;

    const result = await orderService.updateOrderStatus(id, status, changedBy, reason);

    res.json(result);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: error.message || 'Failed to update order status' });
  }
});

// Confirm payment
router.post('/:id/confirm-payment', authenticateToken, [
  param('id').isUUID(),
  body('paymentIntentId').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { paymentIntentId } = req.body;

    // Confirm payment with Revolut
    const paymentResult = await revolutService.confirmPayment(paymentIntentId, null);

    // Update payment status
    await query(
      'UPDATE payments SET status = ? WHERE order_id = ? AND revolut_payment_id = ?',
      [paymentResult.status, id, paymentIntentId]
    );

    // Update order status if payment succeeded
    if (paymentResult.status === 'succeeded') {
      await orderService.updateOrderStatus(id, 'PROCESSING', null, 'Payment confirmed');
    }

    res.json({ status: paymentResult.status });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm payment' });
  }
});

// Get order statistics (Admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const stats = await orderService.getOrderStats(dateFrom, dateTo);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

// Set tracking number for an order (Admin only)
router.post('/:id/tracking', authenticateToken, requireAdmin, [
  param('id').isUUID(),
  body('trackingNumber').isString().isLength({ min: 1 }),
  body('carrier').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { trackingNumber, carrier = 'ROYAL_MAIL' } = req.body;

    const result = await orderService.setTrackingNumber(id, trackingNumber, carrier);

    res.json({
      success: true,
      message: `Tracking number ${trackingNumber} set for order ${id}`,
      result
    });
  } catch (error) {
    console.error('Error setting tracking number:', error);
    res.status(500).json({ error: error.message || 'Failed to set tracking number' });
  }
});

// Get tracking information for an order
router.get('/:id/tracking', authenticateToken, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const trackingInfo = await orderService.getTrackingInfo(id);

    res.json(trackingInfo);
  } catch (error) {
    console.error('Error getting tracking info:', error);
    res.status(500).json({ error: error.message || 'Failed to get tracking information' });
  }
});

// Refresh tracking data for an order
router.post('/:id/tracking/refresh', authenticateToken, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const trackingData = await orderService.refreshTrackingData(id);

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

// Bulk update order status (Admin only)
router.post('/bulk/status', authenticateToken, requireAdmin, [
  body('orderIds').isArray(),
  body('status').isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderIds, status, reason } = req.body;
    const changedBy = req.user.userId;

    const results = [];
    for (const orderId of orderIds) {
      try {
        const result = await orderService.updateOrderStatus(orderId, status, changedBy, reason);
        results.push({ orderId, success: true, result });
      } catch (error) {
        results.push({ orderId, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Updated ${successCount} orders successfully, ${failureCount} failed`,
      results
    });
  } catch (error) {
    console.error('Error in bulk status update:', error);
    res.status(500).json({ error: error.message || 'Failed to update order statuses' });
  }
});

// Get order analytics (Admin only)
router.get('/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    // Get comprehensive analytics
    const analytics = await orderService.getOrderAnalytics(days);

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({ error: 'Failed to fetch order analytics' });
  }
});

// Send order notification (Admin only)
router.post('/:id/notify', authenticateToken, requireAdmin, [
  param('id').isUUID(),
  body('type').isIn(['status_update', 'shipping_update', 'delay_notification']),
  body('message').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { type, message } = req.body;

    const result = await orderService.sendOrderNotification(id, type, message);

    res.json({
      success: true,
      message: 'Order notification sent successfully',
      result
    });
  } catch (error) {
    console.error('Error sending order notification:', error);
    res.status(500).json({ error: error.message || 'Failed to send order notification' });
  }
});

// Get orders by status for dashboard (Admin only)
router.get('/admin/dashboard/:status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 10 } = req.query;

    const result = await orderService.getOrdersByStatus(status, parseInt(limit));

    res.json(result);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ error: 'Failed to fetch orders by status' });
  }
});

module.exports = router;
module.exports = router;