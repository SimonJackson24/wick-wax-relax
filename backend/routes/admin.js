const express = require('express');
const jwt = require('jsonwebtoken');
const orderService = require('../services/order');
const inventoryService = require('../services/inventory');
const productService = require('../services/product');
const { query } = require('../config/database');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

// Middleware to authenticate JWT token from cookies
function authenticateToken(req, res, next) {
  console.log('Incoming cookies:', req.cookies);
  const token = req.cookies.accessToken;
  console.log('Access token present:', !!token);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production', (err, user) => {
    if (err) {
      console.log('Token verification error:', err);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('Token verification successful, user:', user);
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

// Get dashboard overview
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get order statistics
    const orderStats = await orderService.getOrderStats();

    // Get low stock alerts
    const lowStockAlerts = await inventoryService.getLowStockAlerts(5);

    // Get recent orders
    const recentOrders = await orderService.getOrders({}, 1, 10);

    // Get inventory summary
    const inventorySummary = await query(`
      SELECT
        COUNT(*) as total_variants,
        SUM(inventory_quantity) as total_stock,
        AVG(inventory_quantity) as avg_stock_per_variant
      FROM product_variants
    `);

    res.json({
      orderStats,
      lowStockAlerts: lowStockAlerts.slice(0, 5), // Top 5 alerts
      recentOrders: recentOrders.orders,
      inventorySummary: inventorySummary.rows[0] || {
        total_variants: 0,
        total_stock: 0,
        avg_stock_per_variant: 0
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get sales analytics
router.get('/analytics/sales', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    const salesData = await query(`
      SELECT
        DATE(order_date) as date,
        COUNT(*) as orders_count,
        SUM(total) as revenue,
        AVG(total) as avg_order_value
      FROM orders
      WHERE order_date >= datetime('now', '-${days} days')
        AND status NOT IN ('CANCELLED')
      GROUP BY DATE(order_date)
      ORDER BY date DESC
    `);

    res.json(salesData.rows);
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ error: 'Failed to fetch sales analytics' });
  }
});

// Get product performance
router.get('/analytics/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit);

    const productPerformance = await query(`
      SELECT
        p.name as product_name,
        pv.name as variant_name,
        pv.sku,
        COUNT(oi.id) as units_sold,
        SUM(oi.total_price) as revenue,
        AVG(oi.unit_price) as avg_price
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN order_items oi ON pv.id = oi.variant_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status NOT IN ('CANCELLED')
      GROUP BY p.id, p.name, pv.id, pv.name, pv.sku
      ORDER BY revenue DESC
      LIMIT ?
    `, [limitNum]);

    res.json(productPerformance.rows);
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

// Get customer analytics
router.get('/analytics/customers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const customerData = await query(`
      SELECT
        COUNT(DISTINCT u.id) as total_customers,
        COUNT(DISTINCT CASE WHEN u.created_at >= datetime('now', '-30 days') THEN u.id END) as new_customers_30d,
        AVG(customer_orders.total_spent) as avg_customer_value,
        COUNT(DISTINCT CASE WHEN customer_orders.order_count >= 2 THEN u.id END) as repeat_customers
      FROM users u
      LEFT JOIN (
        SELECT
          'user' as user_id, -- Placeholder since we don't have user-order relationship yet
          COUNT(*) as order_count,
          SUM(total) as total_spent
        FROM orders
        WHERE status NOT IN ('CANCELLED')
        GROUP BY 'user' -- This is a placeholder
      ) customer_orders ON true
    `);

    res.json(customerData.rows[0] || {
      total_customers: 0,
      new_customers_30d: 0,
      avg_customer_value: 0,
      repeat_customers: 0
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
});

// Get all users (Admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT
        id,
        email,
        first_name || ' ' || last_name as name,
        is_admin,
        created_at,
        last_login,
        (
          SELECT COUNT(*) FROM orders WHERE user_id = users.id
        ) as order_count,
        (
          SELECT SUM(total) FROM orders WHERE user_id = users.id AND status NOT IN ('CANCELLED')
        ) as total_spent
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const totalResult = await query('SELECT COUNT(*) as total FROM users');
    const total = parseInt(totalResult.rows[0].total);

    res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details (Admin only)
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await query(`
      SELECT
        id,
        email,
        first_name || ' ' || last_name as name,
        is_admin,
        created_at,
        last_login
      FROM users
      WHERE id = ?
    `, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ordersResult = await query(`
      SELECT
        id,
        total,
        status,
        order_date,
        shipping_address
      FROM orders
      WHERE user_id = ?
      ORDER BY order_date DESC
      LIMIT 10
    `, [id]);

    res.json({
      user: userResult.rows[0],
      recentOrders: ordersResult.rows
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user (Admin only)
router.patch('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isAdmin } = req.body;

    const result = await query(`
      UPDATE users
      SET first_name = ?, last_name = ?, is_admin = ?, updated_at = datetime('now')
      WHERE id = ?
      RETURNING id, email, first_name, last_name, is_admin, updated_at
    `, [name.split(' ')[0], name.split(' ')[1] || '', isAdmin, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Export data
router.get('/export/:type', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;

    let data;
    let filename;

    switch (type) {
      case 'orders':
        const orders = await orderService.getOrders({}, 1, 1000);
        data = orders.orders;
        filename = 'orders_export';
        break;

      case 'inventory':
        data = await inventoryService.getInventoryLevels();
        filename = 'inventory_export';
        break;

      case 'products':
        data = await query(`
          SELECT
            p.*,
            GROUP_CONCAT(pv.id || ',' || pv.name || ',' || pv.sku) as variants
          FROM products p
          LEFT JOIN product_variants pv ON p.id = pv.product_id
          GROUP BY p.id
        `);
        data = data.rows;
        filename = 'products_export';
        break;

      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (format === 'csv') {
      // Simple CSV conversion (in production, use a proper CSV library)
      const csvData = data.map(row => JSON.stringify(row)).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(data);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// ===== PRODUCT MANAGEMENT ROUTES =====

// Get all products with pagination and filtering
router.get('/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category = '' } = req.query;

    const result = await productService.getAllProducts({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      category
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/products/:id', authenticateToken, requireAdmin, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const product = await productService.getProductById(id);
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    if (error.message === 'Product not found') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/products', authenticateToken, requireAdmin, [
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('scent_profile').isObject(),
  body('base_price').isFloat({ min: 0 }),
  body('categories').optional().isArray(),
  body('variants').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/products/:id', authenticateToken, requireAdmin, [
  param('id').isUUID(),
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('scent_profile').isObject(),
  body('base_price').isFloat({ min: 0 }),
  body('categories').optional().isArray(),
  body('variants').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:id', authenticateToken, requireAdmin, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    await productService.deleteProduct(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Bulk operations on products
router.post('/products/bulk', authenticateToken, requireAdmin, [
  body('operations').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { operations } = req.body;
    const results = await productService.bulkUpdateProducts(operations);
    res.json({ results });
  } catch (error) {
    console.error('Error performing bulk operations:', error);
    res.status(500).json({ error: 'Failed to perform bulk operations' });
  }
});

// ===== CATEGORY MANAGEMENT ROUTES =====

// Get all categories
router.get('/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const categories = await productService.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/categories', authenticateToken, requireAdmin, [
  body('name').trim().isLength({ min: 1, max: 50 }),
  body('slug').trim().isLength({ min: 1, max: 50 }),
  body('description').optional().trim(),
  body('parent_id').optional().isUUID(),
  body('display_order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await productService.createCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/categories/:id', authenticateToken, requireAdmin, [
  param('id').isUUID(),
  body('name').trim().isLength({ min: 1, max: 50 }),
  body('slug').trim().isLength({ min: 1, max: 50 }),
  body('description').optional().trim(),
  body('parent_id').optional().isUUID(),
  body('display_order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const category = await productService.updateCategory(id, req.body);
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.message === 'Category not found') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/categories/:id', authenticateToken, requireAdmin, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    await productService.deleteCategory(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;