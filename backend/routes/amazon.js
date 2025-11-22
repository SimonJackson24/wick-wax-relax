const express = require('express');
const router = express.Router();
const amazonService = require('../services/amazon');
const { body, validationResult, query } = require('express-validator');

// Sync inventory from Amazon
router.post('/sync-inventory', async (req, res) => {
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
router.get('/inventory', [
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
router.get('/orders', [
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
router.post('/pricing', [
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
router.post('/sync-catalog', async (req, res) => {
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
router.get('/reports/sales', [
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

// Webhook endpoint for Amazon notifications
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const signature = req.headers['x-amz-sns-message-type'];

    // Verify webhook signature (in production, implement proper verification)
    if (signature !== 'Notification') {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(req.body);

    console.log('Amazon webhook received:', payload);

    // Process different notification types
    switch (payload.notificationType) {
      case 'ORDER_CHANGE':
        // Handle order changes
        console.log('Order change notification:', payload.orderId);
        break;
      case 'INVENTORY_CHANGE':
        // Handle inventory changes
        console.log('Inventory change notification:', payload.sku);
        break;
      default:
        console.log('Unknown notification type:', payload.notificationType);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Error processing Amazon webhook:', error);
    res.status(500).json({
      error: 'Failed to process Amazon webhook',
      message: error.message
    });
  }
});

// Health check for Amazon integration
router.get('/health', async (req, res) => {
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