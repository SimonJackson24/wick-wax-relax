const express = require('express');
const { query } = require('../config/database');
const { param, validationResult } = require('express-validator');

const router = express.Router();

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