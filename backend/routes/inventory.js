const express = require('express');
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const inventoryService = require('../services/inventory');

const router = express.Router();

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
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

// Get inventory levels
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const variantId = req.query.variantId;
    const inventory = await inventoryService.getInventoryLevels(variantId);
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get low stock alerts
router.get('/alerts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const alerts = await inventoryService.getLowStockAlerts(threshold);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    res.status(500).json({ error: 'Failed to fetch inventory alerts' });
  }
});

// Send low stock alerts via email
router.post('/alerts/send', authenticateToken, requireAdmin, [
  body('email').isEmail(),
  body('threshold').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, threshold = 10 } = req.body;

    // Get low stock items
    const lowStockItems = await inventoryService.getLowStockAlerts(threshold);

    if (lowStockItems.length === 0) {
      return res.json({ message: 'No low stock items found', sent: false });
    }

    // Send email alert
    const emailService = require('../services/emailService');
    await emailService.sendLowStockAlertEmail(email, lowStockItems);

    res.json({
      message: `Low stock alert sent to ${email}`,
      sent: true,
      itemsCount: lowStockItems.length
    });
  } catch (error) {
    console.error('Error sending low stock alert:', error);
    res.status(500).json({ error: 'Failed to send low stock alert' });
  }
});

// Sync inventory from external channel
router.post('/sync/:channel', authenticateToken, requireAdmin, [
  param('channel').isIn(['AMAZON', 'ETSY']),
  body('products').isArray(),
  body('products.*.sku').isString(),
  body('products.*.quantity').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { channel } = req.params;
    const { products } = req.body;

    await inventoryService.syncChannelInventory(channel, products);

    res.json({ message: `Inventory synced for ${channel}` });
  } catch (error) {
    console.error('Inventory sync error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync inventory' });
  }
});

// Bulk update inventory
router.patch('/bulk', authenticateToken, requireAdmin, [
  body('updates').isArray(),
  body('updates.*.variantId').isUUID(),
  body('updates.*.newQuantity').isInt({ min: 0 }),
  body('updates.*.reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { updates } = req.body;
    const result = await inventoryService.bulkUpdateInventory(updates);

    res.json(result);
  } catch (error) {
    console.error('Bulk inventory update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update inventory' });
  }
});

// Get inventory audit trail
router.get('/audit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const variantId = req.query.variantId;
    const limit = parseInt(req.query.limit) || 100;
    const auditTrail = await inventoryService.getInventoryAuditTrail(variantId, limit);
    res.json(auditTrail);
  } catch (error) {
    console.error('Error fetching inventory audit trail:', error);
    res.status(500).json({ error: 'Failed to fetch inventory audit trail' });
  }
});

// Get inventory reports and analytics
router.get('/reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { dateFrom, dateTo, type } = req.query;

    let reports = {};

    // Stock levels report
    const stockLevels = await inventoryService.getInventoryLevels();
    reports.stockLevels = stockLevels;

    // Low stock alerts
    const lowStock = await inventoryService.getLowStockAlerts(5);
    reports.lowStock = lowStock;

    // Inventory audit trail summary
    const auditTrail = await inventoryService.getInventoryAuditTrail(null, 100);
    reports.auditTrail = auditTrail;

    // Stock movement summary
    const stockMovements = await inventoryService.getStockMovementSummary(dateFrom, dateTo);
    reports.stockMovements = stockMovements;

    // Inventory value calculation
    const inventoryValue = await inventoryService.getInventoryValue();
    reports.inventoryValue = inventoryValue;

    res.json(reports);
  } catch (error) {
    console.error('Error generating inventory reports:', error);
    res.status(500).json({ error: 'Failed to generate inventory reports' });
  }
});

// Get stock movement summary
router.get('/reports/movements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const movements = await inventoryService.getStockMovementSummary(dateFrom, dateTo);
    res.json(movements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
});

// Get inventory value
router.get('/reports/value', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const value = await inventoryService.getInventoryValue();
    res.json(value);
  } catch (error) {
    console.error('Error calculating inventory value:', error);
    res.status(500).json({ error: 'Failed to calculate inventory value' });
  }
});

module.exports = router;