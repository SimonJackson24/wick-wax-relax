const express = require('express');
const { query } = require('../config/database');
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to authenticate JWT token from cookies
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // If no header token, try cookie
  if (!token) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // SECURITY: Fail if JWT_SECRET not configured
  if (!process.env.JWT_SECRET) {
    console.error('SECURITY ERROR: JWT_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // SECURITY: Explicit algorithm specification
  jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Get user's wishlist with product details
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Get wishlist items with product details
    const result = await query(`
      SELECT
        w.id as wishlist_id,
        w.created_at as added_at,
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.description as product_description,
        p.base_price,
        p.sale_price,
        p.images as product_images,
        pv.id as variant_id,
        pv.name as variant_name,
        pv.sku as variant_sku,
        pv.price as variant_price,
        pv.inventory_quantity,
        c.name as category_name,
        c.slug as category_slug
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN product_variants pv ON w.variant_id = pv.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.userId, limit, offset]);

    // Get total count for pagination
    const countResult = await query(
      'SELECT COUNT(*) as total FROM wishlists WHERE user_id = ?',
      [req.user.userId]
    );

    res.json({
      items: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Add item to wishlist
router.post('/', authenticateToken, [
  body('productId').isUUID(),
  body('variantId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, variantId } = req.body;

    // Verify product exists
    const productResult = await query(
      'SELECT id, name FROM products WHERE id = ?',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // If variant provided, verify it belongs to the product
    if (variantId) {
      const variantResult = await query(
        'SELECT id FROM product_variants WHERE id = ? AND product_id = ?',
        [variantId, productId]
      );

      if (variantResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid variant for this product' });
      }
    }

    // Add to wishlist (uses ON CONFLICT to handle duplicates gracefully)
    const result = await query(`
      INSERT INTO wishlists (user_id, product_id, variant_id)
      VALUES (?, ?, ?)
      ON CONFLICT (user_id, product_id) DO UPDATE SET
        variant_id = EXCLUDED.variant_id,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, created_at
    `, [req.user.userId, productId, variantId || null]);

    res.status(201).json({
      message: 'Item added to wishlist',
      wishlistId: result.rows[0].id,
      addedAt: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Failed to add item to wishlist' });
  }
});

// Remove item from wishlist
router.delete('/:productId', authenticateToken, [
  param('productId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId } = req.params;

    const result = await query(
      'DELETE FROM wishlists WHERE user_id = ? AND product_id = ? RETURNING id',
      [req.user.userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in wishlist' });
    }

    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
});

// Check if product is in user's wishlist
router.get('/check/:productId', authenticateToken, [
  param('productId').isUUID()
], async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await query(
      'SELECT id, variant_id, created_at FROM wishlists WHERE user_id = ? AND product_id = ?',
      [req.user.userId, productId]
    );

    if (result.rows.length === 0) {
      return res.json({ inWishlist: false });
    }

    res.json({
      inWishlist: true,
      wishlistId: result.rows[0].id,
      variantId: result.rows[0].variant_id,
      addedAt: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ error: 'Failed to check wishlist status' });
  }
});

// Get wishlist count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM wishlists WHERE user_id = ?',
      [req.user.userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    res.status(500).json({ error: 'Failed to get wishlist count' });
  }
});

// Clear entire wishlist
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await query(
      'DELETE FROM wishlists WHERE user_id = ?',
      [req.user.userId]
    );

    res.json({ message: 'Wishlist cleared' });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({ error: 'Failed to clear wishlist' });
  }
});

module.exports = router;
