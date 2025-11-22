const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

const router = express.Router();

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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

// ===== CUSTOMER EMAIL ROUTES =====

// Send welcome email to new customer
router.post('/welcome', authenticateToken, requireAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('customerName').trim().isLength({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, customerName } = req.body;

    await emailService.sendWelcomeEmail(email, customerName);

    res.json({
      success: true,
      message: 'Welcome email sent successfully'
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

// ===== MARKETING EMAIL ROUTES =====

// Send promotional email
router.post('/promotional', authenticateToken, requireAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('subject').trim().isLength({ min: 1, max: 200 }),
  body('content').trim().isLength({ min: 1 }),
  body('unsubscribeUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, subject, content, unsubscribeUrl } = req.body;

    await emailService.sendPromotionalEmail(email, subject, content, unsubscribeUrl);

    res.json({
      success: true,
      message: 'Promotional email sent successfully'
    });
  } catch (error) {
    console.error('Error sending promotional email:', error);
    res.status(500).json({ error: 'Failed to send promotional email' });
  }
});

// Send newsletter
router.post('/newsletter', authenticateToken, requireAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('subject').trim().isLength({ min: 1, max: 200 }),
  body('content').trim().isLength({ min: 1 }),
  body('unsubscribeUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, subject, content, unsubscribeUrl } = req.body;

    await emailService.sendNewsletterEmail(email, subject, content, unsubscribeUrl);

    res.json({
      success: true,
      message: 'Newsletter sent successfully'
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({ error: 'Failed to send newsletter' });
  }
});

// ===== ORDER EMAIL ROUTES =====

// Send order notification
router.post('/order-notification', authenticateToken, requireAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('subject').trim().isLength({ min: 1, max: 200 }),
  body('message').trim().isLength({ min: 1 }),
  body('orderId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, subject, message, orderId } = req.body;

    let orderDetails = null;
    if (orderId) {
      // Get order details from database if orderId provided
      const { query } = require('../config/database');
      const result = await query(
        'SELECT external_id, order_date, total FROM orders WHERE id = ?',
        [orderId]
      );
      if (result.rows.length > 0) {
        orderDetails = result.rows[0];
      }
    }

    await emailService.sendOrderNotificationEmail(email, subject, message, orderDetails);

    res.json({
      success: true,
      message: 'Order notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending order notification:', error);
    res.status(500).json({ error: 'Failed to send order notification' });
  }
});

// Send shipping notification
router.post('/shipping-notification', authenticateToken, requireAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('orderId').isUUID(),
  body('trackingNumber').optional().trim(),
  body('carrier').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, orderId, trackingNumber, carrier } = req.body;

    // Get order details
    const { query } = require('../config/database');
    const result = await query(
      'SELECT external_id, order_date, total FROM orders WHERE id = ?',
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderDetails = result.rows[0];
    const trackingInfo = {
      trackingNumber: trackingNumber || null,
      carrier: carrier || 'Royal Mail'
    };

    await emailService.sendShippingNotificationEmail(email, orderDetails, trackingInfo);

    res.json({
      success: true,
      message: 'Shipping notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending shipping notification:', error);
    res.status(500).json({ error: 'Failed to send shipping notification' });
  }
});

// ===== ADMIN EMAIL ROUTES =====

// Send low stock alert
router.post('/low-stock-alert', authenticateToken, requireAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('lowStockItems').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, lowStockItems } = req.body;

    await emailService.sendLowStockAlertEmail(email, lowStockItems);

    res.json({
      success: true,
      message: 'Low stock alert sent successfully'
    });
  } catch (error) {
    console.error('Error sending low stock alert:', error);
    res.status(500).json({ error: 'Failed to send low stock alert' });
  }
});

// Send admin alert
router.post('/admin-alert', authenticateToken, requireAdmin, [
  body('adminEmail').isEmail().normalizeEmail(),
  body('alertType').trim().isLength({ min: 1, max: 100 }),
  body('alertData').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { adminEmail, alertType, alertData } = req.body;

    await emailService.sendAdminAlertEmail(adminEmail, alertType, alertData);

    res.json({
      success: true,
      message: 'Admin alert sent successfully'
    });
  } catch (error) {
    console.error('Error sending admin alert:', error);
    res.status(500).json({ error: 'Failed to send admin alert' });
  }
});

// ===== BULK EMAIL ROUTES =====

// Send bulk promotional emails
router.post('/bulk/promotional', authenticateToken, requireAdmin, [
  body('emails').isArray({ min: 1 }),
  body('subject').trim().isLength({ min: 1, max: 200 }),
  body('content').trim().isLength({ min: 1 }),
  body('unsubscribeUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { emails, subject, content, unsubscribeUrl } = req.body;

    const results = [];
    for (const email of emails) {
      try {
        await emailService.sendPromotionalEmail(email, subject, content, unsubscribeUrl);
        results.push({ email, success: true });
      } catch (error) {
        console.error(`Failed to send promotional email to ${email}:`, error);
        results.push({ email, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Bulk promotional emails sent: ${successCount} successful, ${failureCount} failed`,
      results
    });
  } catch (error) {
    console.error('Error sending bulk promotional emails:', error);
    res.status(500).json({ error: 'Failed to send bulk promotional emails' });
  }
});

// Send bulk newsletter
router.post('/bulk/newsletter', authenticateToken, requireAdmin, [
  body('emails').isArray({ min: 1 }),
  body('subject').trim().isLength({ min: 1, max: 200 }),
  body('content').trim().isLength({ min: 1 }),
  body('unsubscribeUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { emails, subject, content, unsubscribeUrl } = req.body;

    const results = [];
    for (const email of emails) {
      try {
        await emailService.sendNewsletterEmail(email, subject, content, unsubscribeUrl);
        results.push({ email, success: true });
      } catch (error) {
        console.error(`Failed to send newsletter to ${email}:`, error);
        results.push({ email, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Bulk newsletter sent: ${successCount} successful, ${failureCount} failed`,
      results
    });
  } catch (error) {
    console.error('Error sending bulk newsletter:', error);
    res.status(500).json({ error: 'Failed to send bulk newsletter' });
  }
});

// ===== EMAIL TESTING ROUTES =====

// Test email configuration
router.post('/test', authenticateToken, requireAdmin, [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Send a test email
    const testSubject = 'Email Service Test - Wick Wax & Relax';
    const testContent = `
      <h2>Email Service Test</h2>
      <p>This is a test email to verify that the email service is working correctly.</p>
      <p>If you received this email, the email service is properly configured.</p>
      <p>Test sent at: ${new Date().toISOString()}</p>
    `;

    await emailService.sendOrderNotificationEmail(email, testSubject, testContent);

    res.json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Get email service status
router.get('/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const status = {
      configured: emailService.isConfigured,
      environment: process.env.NODE_ENV,
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
      fromEmail: process.env.FROM_EMAIL || 'noreply@wickwaxrelax.com'
    };

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting email service status:', error);
    res.status(500).json({ error: 'Failed to get email service status' });
  }
});

module.exports = router;