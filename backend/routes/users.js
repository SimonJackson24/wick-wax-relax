const express = require('express');
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

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

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user addresses
router.get('/addresses', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Add new address
router.post('/addresses', authenticateToken, [
  body('addressType').isIn(['SHIPPING', 'BILLING']),
  body('fullName').trim().isLength({ min: 1 }),
  body('addressLine1').trim().isLength({ min: 1 }),
  body('city').trim().isLength({ min: 1 }),
  body('postalCode').trim().isLength({ min: 1 }),
  body('country').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      addressType,
      fullName,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault = false
    } = req.body;

    // If setting as default, unset other defaults for this type
    if (isDefault) {
      await query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = ? AND address_type = ?',
        [req.user.userId, addressType]
      );
    }

    const result = await query(
      `INSERT INTO user_addresses
       (user_id, address_type, full_name, address_line1, address_line2, city, state, postal_code, country, phone, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [req.user.userId, addressType, fullName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

// Update address
router.put('/addresses/:id', authenticateToken, [
  body('addressType').optional().isIn(['SHIPPING', 'BILLING']),
  body('fullName').optional().trim().isLength({ min: 1 }),
  body('addressLine1').optional().trim().isLength({ min: 1 }),
  body('city').optional().trim().isLength({ min: 1 }),
  body('postalCode').optional().trim().isLength({ min: 1 }),
  body('country').optional().trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if address belongs to user
    const addressCheck = await query(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (addressCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // If setting as default, unset other defaults for this type
    if (updates.isDefault) {
      await query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = ? AND address_type = ?',
        [req.user.userId, updates.addressType || addressCheck.rows[0].address_type]
      );
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const updateQuery = `UPDATE user_addresses SET ${fields.join(', ')} WHERE id = ? RETURNING *`;

    const result = await query(updateQuery, values);
    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// Delete address
router.delete('/addresses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM user_addresses WHERE id = ? AND user_id = ? RETURNING id',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

module.exports = router;