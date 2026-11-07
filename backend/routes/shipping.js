const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const shippingService = require('../services/shipping');
const { authenticateToken, requireAdminMfa } = require('../middleware/auth');

const router = express.Router();

// Public: the shipping options a shopper can choose at checkout.
// GET /api/shipping/rates?zone=UK
router.get('/rates', [
  query('zone').optional().isIn(['UK', 'EU', 'WORLDWIDE'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const zone = req.query.zone || 'UK';
    const rates = await shippingService.listRates(zone);
    res.json({ zone, rates });
  } catch (error) {
    console.error('Error listing shipping rates:', error);
    res.status(500).json({ error: 'Failed to list shipping rates' });
  }
});

// Public: delivery estimate for a basket (weight + value), used at
// checkout and for the PDP's delivery promise.
router.get('/estimate', [
  query('weightGrams').optional().isInt({ min: 0 }),
  query('subtotal').optional().isFloat({ min: 0 }),
  query('country').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const zone = shippingService.zoneForCountry(req.query.country || 'GB');
    const estimate = await shippingService.estimateDelivery({
      zone,
      weightGrams: req.query.weightGrams != null ? parseInt(req.query.weightGrams, 10) : null,
      subtotal: req.query.subtotal != null ? parseFloat(req.query.subtotal) : 0,
    });
    res.json({ zone, estimate });
  } catch (error) {
    console.error('Error estimating delivery:', error);
    res.status(500).json({ error: 'Failed to estimate delivery' });
  }
});

// ===== ADMIN: manage rates =====

// List every rate (all zones, including inactive ones).
router.get('/admin/rates', authenticateToken, requireAdminMfa, async (req, res) => {
  try {
    const result = await dbQuery(
      `SELECT id, zone, method_code, name, description, price,
              min_weight_grams, max_weight_grams, free_over_amount,
              estimated_days_min, estimated_days_max, is_active, sort_order,
              created_at, updated_at
         FROM shipping_rates
        ORDER BY zone, sort_order, price ASC`
    );
    res.json({ rates: result.rows });
  } catch (error) {
    console.error('Error listing all shipping rates:', error);
    res.status(500).json({ error: 'Failed to list shipping rates' });
  }
});

// Create a rate.
router.post('/admin/rates', authenticateToken, requireAdminMfa, [
  body('zone').isIn(['UK', 'EU', 'WORLDWIDE']),
  body('method_code').trim().isLength({ min: 1, max: 50 }),
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 255 }),
  body('price').isFloat({ min: 0 }),
  body('min_weight_grams').optional({ nullable: true }).isInt({ min: 0 }),
  body('max_weight_grams').optional({ nullable: true }).isInt({ min: 0 }),
  body('free_over_amount').optional({ nullable: true }).isFloat({ min: 0 }),
  body('estimated_days_min').optional({ nullable: true }).isInt({ min: 0 }),
  body('estimated_days_max').optional({ nullable: true }).isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
  body('sort_order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const b = req.body;
    const result = await dbQuery(
      `INSERT INTO shipping_rates
         (zone, method_code, name, description, price, min_weight_grams,
          max_weight_grams, free_over_amount, estimated_days_min,
          estimated_days_max, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        b.zone, b.method_code, b.name, b.description || null, parseFloat(b.price),
        b.min_weight_grams ?? null, b.max_weight_grams ?? null,
        b.free_over_amount ?? null, b.estimated_days_min ?? null,
        b.estimated_days_max ?? null,
        b.is_active === undefined ? true : b.is_active, b.sort_order ?? 0,
      ]
    );
    res.status(201).json({ rate: result.rows[0] });
  } catch (error) {
    console.error('Error creating shipping rate:', error);
    res.status(500).json({ error: 'Failed to create shipping rate' });
  }
});

// Update a rate.
router.put('/admin/rates/:id', authenticateToken, requireAdminMfa, [
  param('id').isUUID(),
  body('zone').optional().isIn(['UK', 'EU', 'WORLDWIDE']),
  body('method_code').optional().trim().isLength({ min: 1, max: 50 }),
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 255 }),
  body('price').optional().isFloat({ min: 0 }),
  body('min_weight_grams').optional({ nullable: true }).isInt({ min: 0 }),
  body('max_weight_grams').optional({ nullable: true }).isInt({ min: 0 }),
  body('free_over_amount').optional({ nullable: true }).isFloat({ min: 0 }),
  body('estimated_days_min').optional({ nullable: true }).isInt({ min: 0 }),
  body('estimated_days_max').optional({ nullable: true }).isInt({ min: 0 }),
  body('is_active').optional().isBoolean(),
  body('sort_order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const fields = [
      'zone', 'method_code', 'name', 'description', 'price',
      'min_weight_grams', 'max_weight_grams', 'free_over_amount',
      'estimated_days_min', 'estimated_days_max', 'is_active', 'sort_order',
    ];
    const updates = fields.filter((f) => req.body[f] !== undefined);
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = updates.map((f) => `${f} = ?`).join(', ');
    const values = updates.map((f) => req.body[f]);
    values.push(req.params.id);

    const result = await dbQuery(
      `UPDATE shipping_rates SET ${setClause}, updated_at = NOW() WHERE id = ? RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipping rate not found' });
    }
    res.json({ rate: result.rows[0] });
  } catch (error) {
    console.error('Error updating shipping rate:', error);
    res.status(500).json({ error: 'Failed to update shipping rate' });
  }
});

// Delete a rate.
router.delete('/admin/rates/:id', authenticateToken, requireAdminMfa, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const result = await dbQuery(
      'DELETE FROM shipping_rates WHERE id = ? RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipping rate not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting shipping rate:', error);
    res.status(500).json({ error: 'Failed to delete shipping rate' });
  }
});

module.exports = router;
