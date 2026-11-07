const { query, getClient } = require('../config/database');
const seoService = require('./seoService');

// Extract the commerce fields from a product payload into insert/update
// params. Arrays/objects are JSON-encoded; absent scalars become NULL.
function commerceParams(data) {
  return {
    status: data.status || 'DRAFT',
    vat_rate: data.vat_rate !== undefined ? data.vat_rate : 20.0,
    meta_title: data.meta_title || null,
    meta_description: data.meta_description || null,
    weight_grams: data.weight_grams !== undefined && data.weight_grams !== null
      ? parseInt(data.weight_grams, 10)
      : null,
    dimensions_cm: data.dimensions_cm ? JSON.stringify(data.dimensions_cm) : null,
    clp_allergens: JSON.stringify(data.clp_allergens || []),
    clp_hazard_pictograms: JSON.stringify(data.clp_hazard_pictograms || []),
    clp_signal_word: data.clp_signal_word || null,
    clp_hazard_statements: JSON.stringify(data.clp_hazard_statements || []),
    clp_precautionary_statements: JSON.stringify(data.clp_precautionary_statements || []),
    ufi_code: data.ufi_code || null,
    clp_responsible_name: data.clp_responsible_name || null,
  };
}

class ProductService {
  // Get all products with variants and categories
  async getAllProducts(options = {}) {
    const { page = 1, limit = 20, search = '', category = '', status = '' } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += ' AND (p.name ILIKE ? OR p.description ILIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      whereClause += ' AND pc.category_id = ?';
      params.push(category);
    }

    const productsQuery = `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.scent_profile,
        p.base_price,
        p.status,
        p.vat_rate,
        p.meta_title,
        p.meta_description,
        p.weight_grams,
        p.dimensions_cm,
        p.clp_allergens,
        p.clp_hazard_pictograms,
        p.clp_signal_word,
        p.clp_hazard_statements,
        p.clp_precautionary_statements,
        p.ufi_code,
        p.clp_responsible_name,
        p.created_at,
        string_agg(DISTINCT c.name, ',') as categories
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const products = await query(productsQuery, params);

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
        ORDER BY created_at
      `, [product.id]);

      product.variants = variants.rows;
      product.categories = product.categories ? product.categories.split(',') : [];
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      ${whereClause.replace('GROUP BY p.id', '')}
    `;

    const totalResult = await query(countQuery, params.slice(0, -2)); // Remove limit and offset
    const total = parseInt(totalResult.rows[0].total);

    return {
      products: products.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get single product with full details
  async getProductById(id) {
    const product = await query(`
      SELECT
        id,
        name,
        slug,
        description,
        scent_profile,
        base_price,
        created_at,
        updated_at
      FROM products
      WHERE id = ?
    `, [id]);

    if (product.rows.length === 0) {
      throw new Error('Product not found');
    }

    const result = product.rows[0];

    // Get variants
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
      ORDER BY created_at
    `, [id]);

    // Get categories
    const categories = await query(`
      SELECT
        c.id,
        c.name,
        c.slug
      FROM categories c
      JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ?
    `, [id]);

    result.variants = variants.rows;
    result.categories = categories.rows;

    return result;
  }

  // Generate a unique, SEO-friendly slug. Suffixes -2, -3, ... on collision.
  // `excludeId` lets updateProduct reuse its own slug without a false clash.
  async uniqueSlug(client, source, excludeId = null) {
    const base = seoService.generateSlug(source || '') || 'product';
    let suffix = 1;
    let slug = base;
    for (;;) {
      const existing = excludeId
        ? await client.query('SELECT id FROM products WHERE slug = ? AND id <> ?', [slug, excludeId])
        : await client.query('SELECT id FROM products WHERE slug = ?', [slug]);
      if (existing.rows.length === 0) return slug;
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
  }

  // Create new product
  async createProduct(productData) {
    const { name, description, scent_profile, base_price, categories = [], variants = [] } = productData;

    // BEGIN/COMMIT through the shared pool can land on different
    // connections, leaving statements outside the transaction. Pin one
    // client for the whole unit of work (same pattern as
    // scripts/seed-demo-products.js).
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const slug = await this.uniqueSlug(client, productData.slug || name);

      // Insert product
      const productResult = await client.query(`
        INSERT INTO products (name, slug, description, scent_profile, base_price)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
      `, [name, slug, description, JSON.stringify(scent_profile), base_price]);

      const productId = productResult.rows[0].id;

      // Insert categories
      if (categories.length > 0) {
        for (const categoryId of categories) {
          await client.query(`
            INSERT INTO product_categories (product_id, category_id)
            VALUES (?, ?)
          `, [productId, categoryId]);
        }
      }

      // Insert variants
      if (variants.length > 0) {
        for (const variant of variants) {
          await client.query(`
            INSERT INTO product_variants (product_id, sku, name, price, inventory_quantity, attributes)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            productId,
            variant.sku,
            variant.name,
            variant.price,
            variant.inventory_quantity || 0,
            JSON.stringify(variant.attributes || {})
          ]);
        }
      }

      await client.query('COMMIT');

      return await this.getProductById(productId);
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* transaction already aborted */ }
      throw error;
    } finally {
      client.release();
    }
  }

  // Update product
  async updateProduct(id, productData) {
    const { name, description, scent_profile, base_price, categories = [], variants = [] } = productData;

    // One client for the whole transaction (see createProduct).
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const current = await client.query('SELECT name, slug FROM products WHERE id = ?', [id]);
      if (current.rows.length === 0) {
        throw new Error('Product not found');
      }

      // Explicit slug wins; otherwise regenerate when the name changes.
      const newSlug = productData.slug
        ? await this.uniqueSlug(client, productData.slug, id)
        : name !== current.rows[0].name
          ? await this.uniqueSlug(client, name, id)
          : current.rows[0].slug;

      // Update product
      await client.query(`
        UPDATE products
        SET name = ?, slug = ?, description = ?, scent_profile = ?, base_price = ?, updated_at = NOW()
        WHERE id = ?
      `, [name, newSlug, description, JSON.stringify(scent_profile), base_price, id]);

      // Update categories
      await client.query('DELETE FROM product_categories WHERE product_id = ?', [id]);
      if (categories.length > 0) {
        for (const categoryId of categories) {
          await client.query(`
            INSERT INTO product_categories (product_id, category_id)
            VALUES (?, ?)
          `, [id, categoryId]);
        }
      }

      // Update variants (delete existing and insert new)
      await client.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
      if (variants.length > 0) {
        for (const variant of variants) {
          await client.query(`
            INSERT INTO product_variants (product_id, sku, name, price, inventory_quantity, attributes)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            id,
            variant.sku,
            variant.name,
            variant.price,
            variant.inventory_quantity || 0,
            JSON.stringify(variant.attributes || {})
          ]);
        }
      }

      await client.query('COMMIT');

      return await this.getProductById(id);
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* transaction already aborted */ }
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete product
  async deleteProduct(id) {
    await query('DELETE FROM products WHERE id = ?', [id]);
    return { success: true };
  }

  // Get all categories
  async getAllCategories() {
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

    return result.rows;
  }

  // Create category
  async createCategory(categoryData) {
    const { name, slug, description, parent_id, display_order } = categoryData;

    const result = await query(`
      INSERT INTO categories (name, slug, description, parent_id, display_order)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id, name, slug, description, parent_id, display_order
    `, [name, slug, description, parent_id, display_order || 0]);

    return result.rows[0];
  }

  // Update category
  async updateCategory(id, categoryData) {
    const { name, slug, description, parent_id, display_order } = categoryData;

    const result = await query(`
      UPDATE categories
      SET name = ?, slug = ?, description = ?, parent_id = ?, display_order = ?, updated_at = NOW()
      WHERE id = ?
      RETURNING id, name, slug, description, parent_id, display_order
    `, [name, slug, description, parent_id, display_order, id]);

    if (result.rows.length === 0) {
      throw new Error('Category not found');
    }

    return result.rows[0];
  }

  // Delete category
  async deleteCategory(id) {
    await query('DELETE FROM categories WHERE id = ?', [id]);
    return { success: true };
  }

  // Bulk update products
  async bulkUpdateProducts(updates) {
    const results = [];

    for (const update of updates) {
      try {
        if (update.action === 'delete') {
          await this.deleteProduct(update.id);
          results.push({ id: update.id, success: true, action: 'delete' });
        } else if (update.action === 'update') {
          const product = await this.updateProduct(update.id, update.data);
          results.push({ id: update.id, success: true, action: 'update', product });
        }
      } catch (error) {
        results.push({ id: update.id, success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = new ProductService();