const express = require('express');
const { query } = require('../config/database');
const { body, param, validationResult } = require('express-validator');
const { cacheMiddleware, cacheKeys, invalidateCache } = require('../middleware/cache');

const router = express.Router();

// Get all products with variants
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

    // Get variants for each product
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
        WHERE product_id = ?
      `, [product.id]);

      product.variants = variants.rows;
    }

    res.json(products.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
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
      WHERE id = ?
    `, [id]);

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get variants for the product
    const variants = await query(`
      SELECT
        id,
        sku,
        name,
        price,
        inventory_quantity,
        attributes
      FROM product_variants
      WHERE product_id = ?
    `, [id]);

    const result = { ...product.rows[0], variants: variants.rows };

    res.json(result);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get products by category
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
      WHERE c.slug = ?
      ORDER BY p.created_at DESC
    `, [categorySlug]);

    // Get variants for each product
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
        WHERE product_id = ?
      `, [product.id]);

      product.variants = variants.rows;
    }

    res.json(products.rows);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get all categories
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

module.exports = router;