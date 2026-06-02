const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

const router = express.Router();

// Rate limit on /validate to prevent brute-force / enumeration of valid
// promo codes. Tracks by IP; the endpoint is unauthenticated (works for
// guests too) so userId is not available. 10 attempts / 15min / IP is
// generous for legitimate checkout flows and tight enough to make code
// guessing impractical.
const promoValidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { valid: false, message: 'Too many attempts, please try again later' }
});

// POST /api/promo/validate — no auth required (works for guests too)
router.post('/validate', promoValidateLimiter, [
  body('code').trim().notEmpty().isString().isLength({ max: 50 }),
  body('subtotal').optional().isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ valid: false, message: 'Invalid request', errors: errors.array() });
    }

    const { code, subtotal = 0 } = req.body;

    const result = await query(
      `SELECT discount_type, discount_value, min_order_amount, max_uses, used_count, expiry_date, active
       FROM promo_codes
       WHERE UPPER(code) = UPPER($1)`,
      [code]
    );

    // SECURITY: Collapse every not-usable branch into the same generic
    // message so an attacker cannot tell from the response whether a code
    // does not exist, is inactive, has expired, or has been used up. The
    // only specific detail we still expose is the min_order_amount for the
    // code the user actually submitted (user-facing UX, only revealed when
    // the code itself is otherwise valid, so it does not help enumeration).
    if (result.rows.length === 0) {
      return res.json({ valid: false, message: 'This promo code is not valid' });
    }

    const promo = result.rows[0];

    if (!promo.active) {
      return res.json({ valid: false, message: 'This promo code is not valid' });
    }

    if (promo.expiry_date && new Date(promo.expiry_date) < new Date()) {
      return res.json({ valid: false, message: 'This promo code is not valid' });
    }

    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return res.json({ valid: false, message: 'This promo code is not valid' });
    }

    if (promo.min_order_amount > subtotal) {
      return res.json({
        valid: false,
        message: `Minimum order amount is £${parseFloat(promo.min_order_amount).toFixed(2)}`,
      });
    }

    return res.json({
      valid: true,
      code: code.toUpperCase(),
      discount_type: promo.discount_type,
      discount_value: parseFloat(promo.discount_value),
      message: promo.discount_type === 'percentage'
        ? `${promo.discount_value}% off applied`
        : `£${parseFloat(promo.discount_value).toFixed(2)} off applied`,
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ valid: false, message: 'Failed to validate promo code' });
  }
});

// GET /api/promo/codes — returns active promo codes (public info only)
router.get('/codes', async (req, res) => {
  try {
    const result = await query(
      `SELECT code, discount_type, discount_value, min_order_amount, expiry_date
       FROM promo_codes
       WHERE active = true
         AND (expiry_date IS NULL OR expiry_date > NOW())
         AND (max_uses IS NULL OR used_count < max_uses)
       ORDER BY created_at DESC`
    );

    res.json({ codes: result.rows });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
});

module.exports = router;
