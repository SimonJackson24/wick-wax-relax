const express = require('express');
const { query } = require('../config/database');
const { param, body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/:id/reviews', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const statsResult = await query(`
      SELECT
        COALESCE(AVG(r.rating), 0)::float AS average_rating,
        COUNT(r.id)::int AS review_count
      FROM reviews r
      WHERE r.product_id = $1
    `, [id]);

    const { average_rating: averageRating, review_count: reviewCount } = statsResult.rows[0];

    const reviewsResult = await query(`
      SELECT
        r.id,
        r.rating,
        r.title,
        r.review_text,
        r.verified_purchase,
        r.helpful_count,
        r.created_at,
        COALESCE(u.first_name || ' ' || u.last_name, 'Verified Customer') AS reviewer_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    const totalPages = Math.ceil(reviewCount / limit);

    res.json({
      reviews: reviewsResult.rows,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/:id/reviews', [
  param('id').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').optional().isString().isLength({ max: 200 }),
  body('comment').optional().isString().isLength({ max: 2000 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: productId } = req.params;
    const { rating, title, comment } = req.body;

    const productCheck = await query('SELECT id FROM products WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let verifiedPurchase = false;
    if (req.user && req.user.id) {
      const orderCheck = await query(`
        SELECT 1 FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN product_variants pv ON oi.variant_id = pv.id
        WHERE o.user_id = $1 AND pv.product_id = $2
        LIMIT 1
      `, [req.user.id, productId]);
      verifiedPurchase = orderCheck.rows.length > 0;
    }

    const upsertResult = await query(`
      INSERT INTO reviews (product_id, user_id, rating, title, review_text, verified_purchase)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (product_id, user_id) DO UPDATE SET
        rating = EXCLUDED.rating,
        title = EXCLUDED.title,
        review_text = EXCLUDED.review_text,
        verified_purchase = GREATEST(reviews.verified_purchase, EXCLUDED.verified_purchase),
        updated_at = NOW()
      RETURNING id, rating, title, review_text, verified_purchase, helpful_count, created_at, updated_at
    `, [productId, req.user?.id || null, rating, title || null, comment || null, verifiedPurchase]);

    res.status(201).json(upsertResult.rows[0]);
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

router.get('/', async (req, res) => {
  try {
    const products = await query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.scent_profile,
        p.base_price,
        p.created_at
      FROM products p
      ORDER BY p.created_at DESC
    `);

    for (let product of products.rows) {
      const variants = await query(`
        SELECT
          id,
          sku,
          name,
          price,
          inventory_quantity,
          attributes
        FROM product_variants
        WHERE product_id = $1
      `, [product.id]);

      product.variants = variants.rows;
    }

    res.json(products.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const products = await query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.scent_profile,
        p.base_price,
        p.created_at,
        p.is_featured
      FROM products p
      WHERE p.is_featured = true
      ORDER BY p.created_at DESC
      LIMIT 8
    `);

    for (let product of products.rows) {
      const variants = await query(`
        SELECT id, sku, name, price, inventory_quantity, attributes
        FROM product_variants
        WHERE product_id = $1
        ORDER BY price ASC
        LIMIT 1
      `, [product.id]);
      product.variants = variants.rows;
    }

    res.json({ products: products.rows });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

router.get('/new', async (req, res) => {
  try {
    const products = await query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.scent_profile,
        p.base_price,
        p.created_at
      FROM products p
      ORDER BY p.created_at DESC
      LIMIT 8
    `);

    for (let product of products.rows) {
      const variants = await query(`
        SELECT id, sku, name, price, inventory_quantity, attributes
        FROM product_variants
        WHERE product_id = $1
        ORDER BY price ASC
        LIMIT 1
      `, [product.id]);
      product.variants = variants.rows;
    }

    res.json(products.rows);
  } catch (error) {
    console.error('Error fetching new products:', error);
    res.status(500).json({ error: 'Failed to fetch new products' });
  }
});

router.get('/related/:id', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const categories = await query(`
      SELECT c.id FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = $1
    `, [id]);

    if (categories.rows.length === 0) {
      return res.json([]);
    }

    const categoryIds = categories.rows.map(r => r.id);

    const relatedProducts = await query(`
      SELECT DISTINCT
        p.id,
        p.name,
        p.description,
        p.scent_profile,
        p.base_price,
        p.created_at
      FROM products p
      INNER JOIN product_categories pc ON p.id = pc.product_id
      WHERE pc.category_id = ANY($1)
        AND p.id != $2
      ORDER BY p.created_at DESC
      LIMIT 8
    `, [categoryIds, id]);

    for (let product of relatedProducts.rows) {
      const variants = await query(`
        SELECT id, sku, name, price, inventory_quantity, attributes
        FROM product_variants
        WHERE product_id = $1
        ORDER BY price ASC
        LIMIT 1
      `, [product.id]);
      product.variants = variants.rows;
    }

    res.json(relatedProducts.rows);
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ error: 'Failed to fetch related products' });
  }
});

router.get('/category/:categorySlug', async (req, res) => {
  try {
    const { categorySlug } = req.params;

    const products = await query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.scent_profile,
        p.base_price,
        p.created_at
      FROM products p
      INNER JOIN product_categories pc ON p.id = pc.product_id
      INNER JOIN categories c ON pc.category_id = c.id
      WHERE c.slug = $1
      ORDER BY p.created_at DESC
    `, [categorySlug]);

    for (let product of products.rows) {
      const variants = await query(`
        SELECT
          id,
          sku,
          name,
          price,
          inventory_quantity,
          attributes
        FROM product_variants
        WHERE product_id = $1
      `, [product.id]);
      product.variants = variants.rows;
    }

    res.json(products.rows);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/categories/all', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        id,
        name,
        slug,
        description,
        parent_id,
        display_order
      FROM categories
      ORDER BY display_order, name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Frequently Bought Together
router.get('/:id/fbt', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Get the product's category
    const categories = await query(`
      SELECT c.id FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ?
    `, [id]);

    let fbtProducts = [];

    if (categories.rows.length > 0) {
      const categoryIds = categories.rows.map(r => r.id);

      // Get up to 4 products from same category, excluding current
      const sameCategory = await query(`
        SELECT DISTINCT
          p.id,
          p.name,
          p.description,
          p.base_price,
          p.images
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE pc.category_id = ANY(?)
          AND p.id != ?
        ORDER BY p.created_at DESC
        LIMIT 4
      `, [categoryIds, id]);

      fbtProducts = sameCategory.rows;
    }

    // If fewer than 4, fill with random products from other categories
    if (fbtProducts.length < 4) {
      const existingIds = [id, ...fbtProducts.map(p => p.id)];
      const remaining = await query(`
        SELECT id, name, description, base_price, images
        FROM products
        WHERE id != ALL(?)
        ORDER BY RANDOM()
        LIMIT ?
      `, [existingIds, 4 - fbtProducts.length]);

      fbtProducts = [...fbtProducts, ...remaining.rows];
    }

    // Attach first variant to each product
    for (let product of fbtProducts) {
      const variants = await query(`
        SELECT id, name, price, inventory_quantity
        FROM product_variants
        WHERE product_id = ?
        ORDER BY price ASC
        LIMIT 1
      `, [product.id]);
      product.variants = variants.rows;
    }

    res.json(fbtProducts);
  } catch (error) {
    console.error('Error fetching FBT products:', error);
    res.status(500).json({ error: 'Failed to fetch frequently bought together products' });
  }
});

// MUST be last (catch-all for UUIDs)
router.get('/:id', [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const product = await query(`
      SELECT
        id,
        name,
        description,
        scent_profile,
        base_price,
        created_at
      FROM products
      WHERE id = $1
    `, [id]);

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const variants = await query(`
      SELECT
        id,
        sku,
        name,
        price,
        inventory_quantity,
        attributes
      FROM product_variants
      WHERE product_id = $1
    `, [id]);

    const result = { ...product.rows[0], variants: variants.rows };

    res.json(result);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;