const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const subscriptionService = require('../services/subscriptionService');
const {
  validateSubscriptionData,
  calculateSubscriptionSavings,
  formatSubscriptionInterval,
  getSubscriptionStatusColor,
  isSubscriptionDue,
  validateShippingAddress
} = require('../utils/subscriptionUtils');

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

// ===== PUBLIC SUBSCRIPTION ENDPOINTS =====

// Get all available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await subscriptionService.getSubscriptionPlans();
    res.json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Get subscription plan by ID
router.get('/plans/:planId', [
  param('planId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId } = req.params;
    const plan = await subscriptionService.getSubscriptionPlanById(planId);

    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    res.json({ plan });
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plan' });
  }
});

// Calculate subscription savings
router.post('/calculate-savings', [
  body('price').isFloat({ min: 0 }),
  body('discountPercentage').isFloat({ min: 0, max: 100 }),
  body('interval').isIn(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  body('months').optional().isInt({ min: 1, max: 24 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { price, discountPercentage, interval, months = 12 } = req.body;
    const savings = calculateSubscriptionSavings(price, discountPercentage, interval, months);

    res.json({ savings });
  } catch (error) {
    console.error('Error calculating subscription savings:', error);
    res.status(500).json({ error: 'Failed to calculate subscription savings' });
  }
});

// ===== USER SUBSCRIPTION ENDPOINTS =====

// Get user's subscriptions
router.get('/', authenticateToken, [
  query('includeInactive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { includeInactive = false } = req.query;
    const subscriptions = await subscriptionService.getUserSubscriptions(req.user.userId, includeInactive);

    res.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get subscription by ID
router.get('/:subscriptionId', authenticateToken, [
  param('subscriptionId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subscriptionId } = req.params;
    const subscription = await subscriptionService.getSubscriptionById(subscriptionId, req.user.userId);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create new subscription
router.post('/', authenticateToken, [
  body('planId').isUUID(),
  body('productId').isUUID(),
  body('variantId').isUUID(),
  body('shippingAddress').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const subscriptionData = req.body;

    // Validate subscription data
    const validation = validateSubscriptionData(subscriptionData);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Validate shipping address if provided
    if (subscriptionData.shippingAddress) {
      const addressValidation = validateShippingAddress(subscriptionData.shippingAddress);
      if (!addressValidation.isValid) {
        return res.status(400).json({ errors: addressValidation.errors });
      }
    }

    const subscription = await subscriptionService.createUserSubscription(subscriptionData, req.user.userId);

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    console.error('Error creating subscription:', error);

    if (error.message.includes('not found') || error.message.includes('insufficient')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Update subscription
router.patch('/:subscriptionId', authenticateToken, [
  param('subscriptionId').isUUID(),
  body('planId').optional().isUUID(),
  body('productId').optional().isUUID(),
  body('variantId').optional().isUUID(),
  body('shippingAddress').optional().isObject(),
  body('status').optional().isIn(['ACTIVE', 'PAUSED'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subscriptionId } = req.params;
    const updateData = req.body;

    // Validate shipping address if provided
    if (updateData.shippingAddress) {
      const addressValidation = validateShippingAddress(updateData.shippingAddress);
      if (!addressValidation.isValid) {
        return res.status(400).json({ errors: addressValidation.errors });
      }
    }

    const result = await subscriptionService.updateSubscription(subscriptionId, updateData, req.user.userId);

    res.json({
      message: 'Subscription updated successfully',
      subscription: result
    });
  } catch (error) {
    console.error('Error updating subscription:', error);

    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Pause subscription
router.post('/:subscriptionId/pause', authenticateToken, [
  param('subscriptionId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subscriptionId } = req.params;
    const result = await subscriptionService.pauseSubscription(subscriptionId, req.user.userId);

    res.json({
      message: 'Subscription paused successfully',
      subscription: result
    });
  } catch (error) {
    console.error('Error pausing subscription:', error);

    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to pause subscription' });
  }
});

// Resume subscription
router.post('/:subscriptionId/resume', authenticateToken, [
  param('subscriptionId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subscriptionId } = req.params;
    const result = await subscriptionService.resumeSubscription(subscriptionId, req.user.userId);

    res.json({
      message: 'Subscription resumed successfully',
      subscription: result
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);

    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

// Cancel subscription
router.post('/:subscriptionId/cancel', authenticateToken, [
  param('subscriptionId').isUUID(),
  body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subscriptionId } = req.params;
    const { reason = '' } = req.body;

    const result = await subscriptionService.cancelSubscription(subscriptionId, reason, req.user.userId);

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: result
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);

    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get subscription summary for user
router.get('/user/summary', authenticateToken, async (req, res) => {
  try {
    const subscriptions = await subscriptionService.getUserSubscriptions(req.user.userId, true);
    const { generateSubscriptionSummary } = require('../utils/subscriptionUtils');
    const summary = generateSubscriptionSummary(subscriptions);

    res.json({ summary });
  } catch (error) {
    console.error('Error fetching subscription summary:', error);
    res.status(500).json({ error: 'Failed to fetch subscription summary' });
  }
});

// ===== ADMIN SUBSCRIPTION ENDPOINTS =====

// Get all subscriptions (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED']),
  query('userId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, status, userId } = req.query;

    // This would require a more complex query to get all subscriptions with pagination
    // For now, return a basic response
    res.json({
      message: 'Admin subscription listing - to be implemented',
      pagination: { page, limit, total: 0, pages: 0 },
      subscriptions: []
    });
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Create subscription plan (Admin only)
router.post('/admin/plans', authenticateToken, requireAdmin, [
  body('name').trim().isLength({ min: 1, max: 50 }),
  body('description').optional().trim(),
  body('interval').isIn(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  body('discount_percentage').isFloat({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const plan = await subscriptionService.createSubscriptionPlan(req.body);

    res.status(201).json({
      message: 'Subscription plan created successfully',
      plan
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({ error: 'Failed to create subscription plan' });
  }
});

// Update subscription plan (Admin only)
router.patch('/admin/plans/:planId', authenticateToken, requireAdmin, [
  param('planId').isUUID(),
  body('name').optional().trim().isLength({ min: 1, max: 50 }),
  body('description').optional().trim(),
  body('interval').optional().isIn(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  body('discount_percentage').optional().isFloat({ min: 0, max: 100 }),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId } = req.params;
    const plan = await subscriptionService.updateSubscriptionPlan(planId, req.body);

    res.json({
      message: 'Subscription plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update subscription plan' });
  }
});

// Delete subscription plan (Admin only)
router.delete('/admin/plans/:planId', authenticateToken, requireAdmin, [
  param('planId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId } = req.params;
    await subscriptionService.deleteSubscriptionPlan(planId);

    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);

    if (error.message.includes('in use')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to delete subscription plan' });
  }
});

// Process subscription orders (Admin only - for cron job)
router.post('/admin/process-orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await subscriptionService.processSubscriptionOrders();

    res.json({
      message: `Processed ${result.processed} subscription orders`,
      result
    });
  } catch (error) {
    console.error('Error processing subscription orders:', error);
    res.status(500).json({ error: 'Failed to process subscription orders' });
  }
});

// Get subscription analytics (Admin only)
router.get('/admin/analytics', authenticateToken, requireAdmin, [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dateFrom, dateTo } = req.query;
    const analytics = await subscriptionService.getSubscriptionAnalytics(dateFrom, dateTo);

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({ error: 'Failed to fetch subscription analytics' });
  }
});

// Get subscriptions requiring attention (Admin only)
router.get('/admin/attention-required', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const subscriptions = await subscriptionService.getSubscriptionsRequiringAttention();

    res.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions requiring attention:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions requiring attention' });
  }
});

// ===== UTILITY ENDPOINTS =====

// Validate shipping address
router.post('/validate-address', [
  body('address').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { address } = req.body;
    const validation = validateShippingAddress(address);

    res.json({ validation });
  } catch (error) {
    console.error('Error validating address:', error);
    res.status(500).json({ error: 'Failed to validate address' });
  }
});

// Get subscription status colors (for UI)
router.get('/status-colors', (req, res) => {
  res.json({
    colors: {
      ACTIVE: getSubscriptionStatusColor('ACTIVE'),
      PAUSED: getSubscriptionStatusColor('PAUSED'),
      CANCELLED: getSubscriptionStatusColor('CANCELLED'),
      EXPIRED: getSubscriptionStatusColor('EXPIRED')
    }
  });
});

// Health check for subscription service
router.get('/health', (req, res) => {
  res.json({
    status: 'Subscription service healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;