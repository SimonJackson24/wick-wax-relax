const express = require('express');
const { query, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const analyticsService = require('../services/analyticsService');

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

// ===== PUBLIC ANALYTICS ENDPOINTS =====

// Get real-time analytics (cached for performance)
router.get('/realtime', async (req, res) => {
  try {
    const analytics = await analyticsService.getRealTimeAnalytics();
    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    res.status(500).json({ error: 'Failed to fetch real-time analytics' });
  }
});

// ===== ADMIN ANALYTICS ENDPOINTS =====

// Dashboard overview
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      userAnalytics,
      salesAnalytics,
      productAnalytics,
      realTimeAnalytics
    ] = await Promise.all([
      analyticsService.getUserAnalytics(),
      analyticsService.getSalesAnalytics(),
      analyticsService.getProductAnalytics(),
      analyticsService.getRealTimeAnalytics()
    ]);

    res.json({
      userAnalytics,
      salesAnalytics,
      productAnalytics,
      realTimeAnalytics
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// User analytics
router.get('/users', authenticateToken, requireAdmin, [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dateFrom, dateTo } = req.query;
    const analytics = await analyticsService.getUserAnalytics(dateFrom, dateTo);

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Sales analytics
router.get('/sales', authenticateToken, requireAdmin, [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('groupBy').optional().isIn(['hour', 'day', 'week', 'month'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dateFrom, dateTo, groupBy = 'day' } = req.query;
    const analytics = await analyticsService.getSalesAnalytics(dateFrom, dateTo, groupBy);

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ error: 'Failed to fetch sales analytics' });
  }
});

// Product analytics
router.get('/products', authenticateToken, requireAdmin, [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dateFrom, dateTo } = req.query;
    const analytics = await analyticsService.getProductAnalytics(dateFrom, dateTo);

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

// Inventory analytics
router.get('/inventory', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const analytics = await analyticsService.getInventoryAnalytics();
    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({ error: 'Failed to fetch inventory analytics' });
  }
});

// Customer analytics
router.get('/customers', authenticateToken, requireAdmin, [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dateFrom, dateTo } = req.query;
    const analytics = await analyticsService.getCustomerAnalytics(dateFrom, dateTo);

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
});

// Performance analytics
router.get('/performance', authenticateToken, requireAdmin, [
  query('timeRange').optional().isIn(['1h', '24h', '7d', '30d'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { timeRange = '24h' } = req.query;
    const analytics = await analyticsService.getPerformanceAnalytics(timeRange);

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({ error: 'Failed to fetch performance analytics' });
  }
});

// Custom analytics queries
router.post('/custom', authenticateToken, requireAdmin, [
  query('queryType').isIn(['user_cohort_analysis', 'product_cross_sell', 'geographic_sales', 'seasonal_trends']),
  query('parameters').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { queryType, parameters = {} } = req.body;
    const result = await analyticsService.runCustomQuery(queryType, parameters);

    res.json({ result });
  } catch (error) {
    console.error('Error running custom analytics query:', error);
    res.status(500).json({ error: 'Failed to run custom analytics query' });
  }
});

// Export analytics data
router.get('/export/:dataType', authenticateToken, requireAdmin, [
  query('format').optional().isIn(['json', 'csv']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dataType } = req.params;
    const { format = 'json', dateFrom, dateTo } = req.query;

    const data = await analyticsService.exportAnalyticsData(dataType, format, dateFrom, dateTo);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${dataType}_analytics_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(data);
    } else {
      res.json({ data });
    }
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ error: 'Failed to export analytics data' });
  }
});

// ===== ANALYTICS DASHBOARD WIDGETS =====

// Sales summary widget
router.get('/widgets/sales-summary', authenticateToken, requireAdmin, [
  query('period').optional().isIn(['today', 'yesterday', 'week', 'month'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { period = 'today' } = req.query;

    let dateFrom, dateTo;
    const now = new Date();

    switch (period) {
      case 'today':
        dateFrom = dateTo = now.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        dateFrom = dateTo = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
        break;
      case 'month':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
        break;
    }

    const salesData = await analyticsService.getSalesAnalytics(dateFrom, dateTo, 'day');

    // Calculate summary metrics
    const summary = {
      totalRevenue: salesData.trends.reduce((sum, day) => sum + (day.revenue || 0), 0),
      totalOrders: salesData.trends.reduce((sum, day) => sum + (day.orders_count || 0), 0),
      averageOrderValue: salesData.trends.length > 0
        ? salesData.trends.reduce((sum, day) => sum + (day.avg_order_value || 0), 0) / salesData.trends.length
        : 0,
      uniqueCustomers: salesData.trends.reduce((sum, day) => sum + (day.unique_customers || 0), 0),
      period: period,
      dateRange: { from: dateFrom, to: dateTo }
    };

    res.json({ summary });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ error: 'Failed to fetch sales summary' });
  }
});

// Top products widget
router.get('/widgets/top-products', authenticateToken, requireAdmin, [
  query('limit').optional().isInt({ min: 1, max: 20 }),
  query('period').optional().isIn(['week', 'month', 'quarter'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { limit = 10, period = 'month' } = req.query;

    let dateFrom;
    const now = new Date();

    switch (period) {
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'month':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'quarter':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
    }

    const productData = await analyticsService.getProductAnalytics(dateFrom);

    res.json({
      topProducts: productData.productPerformance.slice(0, limit),
      period: period
    });
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
});

// User growth widget
router.get('/widgets/user-growth', authenticateToken, requireAdmin, [
  query('period').optional().isIn(['week', 'month', 'quarter'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { period = 'month' } = req.query;

    let dateFrom;
    const now = new Date();

    switch (period) {
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'month':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'quarter':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
    }

    const userData = await analyticsService.getUserAnalytics(dateFrom);

    res.json({
      userGrowth: {
        newUsers: userData.overview.new_users_30d || 0,
        activeUsers: userData.overview.active_users_30d || 0,
        totalUsers: userData.overview.total_users || 0,
        registrationTrend: userData.registrationTrends || []
      },
      period: period
    });
  } catch (error) {
    console.error('Error fetching user growth:', error);
    res.status(500).json({ error: 'Failed to fetch user growth' });
  }
});

// Inventory alerts widget
router.get('/widgets/inventory-alerts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const inventoryData = await analyticsService.getInventoryAnalytics();

    const alerts = {
      lowStock: inventoryData.turnover.filter(item => item.stock_status === 'Critical' || item.stock_status === 'Low'),
      outOfStock: inventoryData.turnover.filter(item => item.stock_status === 'Out of Stock'),
      totalAlerts: 0
    };

    alerts.totalAlerts = alerts.lowStock.length + alerts.outOfStock.length;

    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    res.status(500).json({ error: 'Failed to fetch inventory alerts' });
  }
});

// ===== ANALYTICS REPORTS =====

// Generate comprehensive business report
router.get('/reports/business-overview', authenticateToken, requireAdmin, [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dateFrom, dateTo } = req.query;

    const [
      userAnalytics,
      salesAnalytics,
      productAnalytics,
      inventoryAnalytics,
      customerAnalytics
    ] = await Promise.all([
      analyticsService.getUserAnalytics(dateFrom, dateTo),
      analyticsService.getSalesAnalytics(dateFrom, dateTo),
      analyticsService.getProductAnalytics(dateFrom, dateTo),
      analyticsService.getInventoryAnalytics(),
      analyticsService.getCustomerAnalytics(dateFrom, dateTo)
    ]);

    const report = {
      generatedAt: new Date().toISOString(),
      dateRange: { from: dateFrom, to: dateTo },
      summary: {
        totalUsers: userAnalytics.overview.total_users,
        totalRevenue: salesAnalytics.trends.reduce((sum, day) => sum + (day.revenue || 0), 0),
        totalOrders: salesAnalytics.trends.reduce((sum, day) => sum + (day.orders_count || 0), 0),
        averageOrderValue: salesAnalytics.trends.length > 0
          ? salesAnalytics.trends.reduce((sum, day) => sum + (day.avg_order_value || 0), 0) / salesAnalytics.trends.length
          : 0,
        inventoryValue: inventoryAnalytics.overview.total_inventory_value
      },
      sections: {
        users: userAnalytics,
        sales: salesAnalytics,
        products: productAnalytics,
        inventory: inventoryAnalytics,
        customers: customerAnalytics
      }
    };

    res.json({ report });
  } catch (error) {
    console.error('Error generating business report:', error);
    res.status(500).json({ error: 'Failed to generate business report' });
  }
});

// Health check for analytics service
router.get('/health', (req, res) => {
  res.json({
    status: 'Analytics service healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;