const express = require('express');
const router = express.Router();
const syncService = require('../services/syncService');
const { body, validationResult, query } = require('express-validator');

// JWT authentication middleware
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

// Sync inventory across all channels
router.post('/inventory', authenticateToken, requireAdmin, [
  body('autoSync').optional().isBoolean(),
  body('channels').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { autoSync = false, channels = ['AMAZON', 'ETSY'] } = req.body;

    const results = await syncService.syncInventory({
      autoSync,
      channels
    });

    res.json({
      success: true,
      results,
      message: `Inventory sync completed. Found ${results.discrepancies.length} discrepancies.`
    });

  } catch (error) {
    console.error('Inventory sync failed:', error);
    res.status(500).json({
      error: 'Inventory sync failed',
      message: error.message
    });
  }
});

// Sync orders from external channels
router.post('/orders', authenticateToken, requireAdmin, [
  body('channels').optional().isArray(),
  body('since').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { channels = ['AMAZON', 'ETSY'], since } = req.body;

    const results = await syncService.syncOrders({
      channels,
      since
    });

    res.json({
      success: true,
      results,
      message: `Order sync completed. Synced ${results.synced} orders.`
    });

  } catch (error) {
    console.error('Order sync failed:', error);
    res.status(500).json({
      error: 'Order sync failed',
      message: error.message
    });
  }
});

// Sync specific product across channels
router.post('/product/:variantId', authenticateToken, requireAdmin, [
  body('channels').isArray(),
  body('targetQuantity').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { variantId } = req.params;
    const { channels, targetQuantity } = req.body;

    // Get product details
    const productResult = await require('../config/database').query(`
      SELECT p.name, pv.sku, pv.inventory_quantity
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      WHERE pv.id = ?
    `, [variantId]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product variant not found' });
    }

    const product = productResult.rows[0];
    const results = [];

    // Sync to each specified channel
    for (const channelName of channels) {
      try {
        const service = syncService.channels[channelName];
        if (!service) {
          results.push({
            channel: channelName,
            success: false,
            error: 'Channel service not available'
          });
          continue;
        }

        const quantity = targetQuantity !== undefined ? targetQuantity : product.inventory_quantity;

        await syncService.syncProductQuantity(channelName, service, {
          variant_id: variantId,
          sku: product.sku,
          name: product.name,
          inventory_quantity: product.inventory_quantity,
          channelPricing: {
            [channelName]: product.price // Would need to get actual channel pricing
          }
        }, quantity);

        results.push({
          channel: channelName,
          success: true,
          quantity
        });

      } catch (error) {
        console.error(`Error syncing ${channelName}:`, error);
        results.push({
          channel: channelName,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      product: {
        id: variantId,
        name: product.name,
        sku: product.sku
      },
      results,
      message: `Product sync completed for ${channels.length} channels`
    });

  } catch (error) {
    console.error('Product sync failed:', error);
    res.status(500).json({
      error: 'Product sync failed',
      message: error.message
    });
  }
});

// Get sync status
router.get('/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const status = syncService.getSyncStatus();

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({
      error: 'Failed to get sync status',
      message: error.message
    });
  }
});

// Get sync history
router.get('/history', authenticateToken, requireAdmin, [
  query('limit').optional().isInt({ min: 1, max: 100 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const limit = parseInt(req.query.limit) || 10;
    const history = syncService.getSyncHistory(limit);

    res.json({
      success: true,
      history,
      count: history.length
    });

  } catch (error) {
    console.error('Error getting sync history:', error);
    res.status(500).json({
      error: 'Failed to get sync history',
      message: error.message
    });
  }
});

// Get inventory discrepancies
router.get('/discrepancies', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const products = await syncService.getProductsForSync();
    const discrepancies = [];

    for (const product of products) {
      const localQuantity = product.inventory_quantity;

      // Check each channel
      for (const [channelName, inventory] of Object.entries(product.channelInventory)) {
        if (inventory.quantity !== localQuantity) {
          discrepancies.push({
            sku: product.sku,
            productName: product.name,
            channel: channelName,
            localQuantity,
            channelQuantity: inventory.quantity,
            lastSynced: inventory.lastSynced
          });
        }
      }
    }

    res.json({
      success: true,
      discrepancies,
      count: discrepancies.length
    });

  } catch (error) {
    console.error('Error getting discrepancies:', error);
    res.status(500).json({
      error: 'Failed to get discrepancies',
      message: error.message
    });
  }
});

// Schedule automatic sync
router.post('/schedule', authenticateToken, requireAdmin, [
  body('intervalMinutes').isInt({ min: 5, max: 1440 }), // 5 minutes to 24 hours
  body('autoSync').optional().isBoolean()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { intervalMinutes, autoSync = true } = req.body;

    syncService.scheduleAutoSync(intervalMinutes);

    res.json({
      success: true,
      message: `Auto-sync scheduled every ${intervalMinutes} minutes`,
      autoSync
    });

  } catch (error) {
    console.error('Error scheduling auto-sync:', error);
    res.status(500).json({
      error: 'Failed to schedule auto-sync',
      message: error.message
    });
  }
});

// Stop automatic sync
router.post('/schedule/stop', authenticateToken, requireAdmin, (req, res) => {
  try {
    syncService.stopAutoSync();

    res.json({
      success: true,
      message: 'Auto-sync stopped'
    });

  } catch (error) {
    console.error('Error stopping auto-sync:', error);
    res.status(500).json({
      error: 'Failed to stop auto-sync',
      message: error.message
    });
  }
});

// Get channel health status
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const health = {
      AMAZON: { status: 'unknown', message: 'Not tested' },
      ETSY: { status: 'unknown', message: 'Not tested' },
      PWA: { status: 'healthy', message: 'Local system' }
    };

    // Test Amazon connection
    try {
      await syncService.channels.AMAZON.getInventory([]);
      health.AMAZON = { status: 'healthy', message: 'Connected' };
    } catch (error) {
      health.AMAZON = { status: 'unhealthy', message: error.message };
    }

    // Test Etsy connection
    try {
      await syncService.channels.ETSY.getShopStats();
      health.ETSY = { status: 'healthy', message: 'Connected' };
    } catch (error) {
      health.ETSY = { status: 'unhealthy', message: error.message };
    }

    const overallHealth = Object.values(health).every(h => h.status === 'healthy')
      ? 'healthy'
      : 'degraded';

    res.json({
      success: true,
      overallHealth,
      channels: health
    });

  } catch (error) {
    console.error('Error checking channel health:', error);
    res.status(500).json({
      error: 'Failed to check channel health',
      message: error.message
    });
  }
});

module.exports = router;