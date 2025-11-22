const express = require('express');
const router = express.Router();
const etsyService = require('../services/etsy');
const { body, validationResult, query } = require('express-validator');

// Sync inventory from Etsy
router.post('/sync-inventory', async (req, res) => {
  try {
    // In production, get products from database
    const localProducts = [
      { sku: 'SAMPLE-SKU-1', stock_quantity: 100 },
      { sku: 'SAMPLE-SKU-2', stock_quantity: 50 }
    ];

    const inventoryUpdates = await etsyService.syncInventoryLevels(localProducts);

    res.json({
      success: true,
      updates: inventoryUpdates,
      message: `Found ${inventoryUpdates.length} inventory discrepancies`
    });
  } catch (error) {
    console.error('Error syncing Etsy inventory:', error);
    res.status(500).json({
      error: 'Failed to sync Etsy inventory',
      message: error.message
    });
  }
});

// Get Etsy listings
router.get('/listings', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const listings = await etsyService.getListings(limit, offset);

    res.json({
      success: true,
      listings: listings,
      count: listings.length
    });
  } catch (error) {
    console.error('Error fetching Etsy listings:', error);
    res.status(500).json({
      error: 'Failed to fetch Etsy listings',
      message: error.message
    });
  }
});

// Get specific listing
router.get('/listings/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const listing = await etsyService.getListing(listingId);

    res.json({
      success: true,
      listing: listing
    });
  } catch (error) {
    console.error('Error fetching Etsy listing:', error);
    res.status(500).json({
      error: 'Failed to fetch Etsy listing',
      message: error.message
    });
  }
});

// Update listing inventory
router.put('/listings/:listingId/inventory', [
  body('products').isArray(),
  body('products.*.sku').isString(),
  body('products.*.price').isNumeric(),
  body('products.*.quantity').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { listingId } = req.params;
    const { products } = req.body;

    const result = await etsyService.updateInventory(listingId, products);

    res.json({
      success: true,
      result: result,
      message: `Updated inventory for listing ${listingId}`
    });
  } catch (error) {
    console.error('Error updating Etsy inventory:', error);
    res.status(500).json({
      error: 'Failed to update Etsy inventory',
      message: error.message
    });
  }
});

// Create new listing
router.post('/listings', [
  body('title').isString().isLength({ min: 1, max: 140 }),
  body('description').isString(),
  body('price').isNumeric(),
  body('quantity').isInt({ min: 0 }),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const listingData = req.body;
    const result = await etsyService.createListing(listingData);

    res.json({
      success: true,
      listing: result,
      message: 'Listing created successfully'
    });
  } catch (error) {
    console.error('Error creating Etsy listing:', error);
    res.status(500).json({
      error: 'Failed to create Etsy listing',
      message: error.message
    });
  }
});

// Update listing
router.patch('/listings/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const updateData = req.body;

    const result = await etsyService.updateListing(listingId, updateData);

    res.json({
      success: true,
      listing: result,
      message: `Listing ${listingId} updated successfully`
    });
  } catch (error) {
    console.error('Error updating Etsy listing:', error);
    res.status(500).json({
      error: 'Failed to update Etsy listing',
      message: error.message
    });
  }
});

// Get Etsy orders
router.get('/orders', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const orders = await etsyService.getOrders(limit, offset);

    res.json({
      success: true,
      orders: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error fetching Etsy orders:', error);
    res.status(500).json({
      error: 'Failed to fetch Etsy orders',
      message: error.message
    });
  }
});

// Get specific order
router.get('/orders/:receiptId', async (req, res) => {
  try {
    const { receiptId } = req.params;
    const order = await etsyService.getOrder(receiptId);

    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Error fetching Etsy order:', error);
    res.status(500).json({
      error: 'Failed to fetch Etsy order',
      message: error.message
    });
  }
});

// Update order status
router.put('/orders/:receiptId/status', [
  body('status').isIn(['paid', 'shipped', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiptId } = req.params;
    const { status } = req.body;

    const result = await etsyService.updateOrderStatus(receiptId, status);

    res.json({
      success: true,
      result: result,
      message: `Order ${receiptId} status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating Etsy order status:', error);
    res.status(500).json({
      error: 'Failed to update Etsy order status',
      message: error.message
    });
  }
});

// Get shop reviews
router.get('/reviews', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const reviews = await etsyService.getReviews(limit, offset);

    res.json({
      success: true,
      reviews: reviews,
      count: reviews.length
    });
  } catch (error) {
    console.error('Error fetching Etsy reviews:', error);
    res.status(500).json({
      error: 'Failed to fetch Etsy reviews',
      message: error.message
    });
  }
});

// Get shop statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await etsyService.getShopStats();

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching Etsy shop stats:', error);
    res.status(500).json({
      error: 'Failed to fetch Etsy shop stats',
      message: error.message
    });
  }
});

// Webhook endpoint for Etsy notifications
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const payload = JSON.parse(req.body);
    const signature = req.headers['x-etsy-signature'];

    // Verify webhook signature
    if (!etsyService.verifyWebhookSignature(payload, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    console.log('Etsy webhook received:', payload);

    // Process different notification types
    switch (payload.type) {
      case 'order':
        // Handle order notifications
        console.log('Order notification:', payload.data.receipt_id);
        break;
      case 'listing':
        // Handle listing notifications
        console.log('Listing notification:', payload.data.listing_id);
        break;
      case 'review':
        // Handle review notifications
        console.log('Review notification:', payload.data.review_id);
        break;
      default:
        console.log('Unknown notification type:', payload.type);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Error processing Etsy webhook:', error);
    res.status(500).json({
      error: 'Failed to process Etsy webhook',
      message: error.message
    });
  }
});

// Health check for Etsy integration
router.get('/health', async (req, res) => {
  try {
    // Test connection by getting shop stats
    await etsyService.getShopStats();

    res.json({
      success: true,
      status: 'healthy',
      message: 'Etsy API connection is working'
    });
  } catch (error) {
    console.error('Etsy health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Etsy API connection failed',
      message: error.message
    });
  }
});

module.exports = router;