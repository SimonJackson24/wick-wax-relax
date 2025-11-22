const express = require('express');
const router = express.Router();
const pushService = require('../services/pushService');
const { body, validationResult } = require('express-validator');

// Subscribe to push notifications
router.post('/subscribe', [
  body('endpoint').isURL(),
  body('keys').exists(),
  body('keys.auth').isString(),
  body('keys.p256dh').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { endpoint, keys } = req.body;
    const subscription = { endpoint, keys };

    // In production, get user ID from authentication
    const userId = req.user?.id || 'anonymous';

    await pushService.storeSubscription(userId, subscription);

    res.json({ success: true, message: 'Subscription stored successfully' });
  } catch (error) {
    console.error('Error storing subscription:', error);
    res.status(500).json({ error: 'Failed to store subscription' });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';

    // In production, remove from database
    console.log('Unsubscribed user:', userId);

    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Send test notification (admin only)
router.post('/test', [
  body('userId').optional().isString(),
  body('title').isString(),
  body('body').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, title, body } = req.body;

    if (userId) {
      await pushService.sendNotificationToUser(userId, { title, body });
    } else {
      await pushService.sendNotificationToAll({ title, body });
    }

    res.json({ success: true, message: 'Test notification sent' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Send order status update notification
router.post('/order-status', [
  body('userId').isString(),
  body('orderId').isString(),
  body('status').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, orderId, status } = req.body;

    await pushService.sendOrderStatusUpdate(userId, orderId, status);

    res.json({ success: true, message: 'Order status notification sent' });
  } catch (error) {
    console.error('Error sending order status notification:', error);
    res.status(500).json({ error: 'Failed to send order status notification' });
  }
});

// Send product availability notification
router.post('/product-available', [
  body('userId').isString(),
  body('productName').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, productName } = req.body;

    await pushService.sendProductAvailableNotification(userId, productName);

    res.json({ success: true, message: 'Product availability notification sent' });
  } catch (error) {
    console.error('Error sending product availability notification:', error);
    res.status(500).json({ error: 'Failed to send product availability notification' });
  }
});

// Send promotional notification to all users
router.post('/promotion', [
  body('title').isString(),
  body('body').isString(),
  body('url').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, body, url } = req.body;

    await pushService.sendPromotionalNotification(title, body, url);

    res.json({ success: true, message: 'Promotional notification sent to all users' });
  } catch (error) {
    console.error('Error sending promotional notification:', error);
    res.status(500).json({ error: 'Failed to send promotional notification' });
  }
});

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  try {
    const publicKey = pushService.getVapidPublicKey();
    res.json({ publicKey });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({ error: 'Failed to get VAPID public key' });
  }
});

module.exports = router;