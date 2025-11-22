const { query } = require('../config/database');

class ProductService {
  // Get all products with variants and categories
  async getAllProducts(options = {}) {
    const { page = 1, limit = 20, search = '', category = '' } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

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
        p.description,
        p.scent_profile,
        p.base_price,
        p.created_at,
        GROUP_CONCAT(DISTINCT c.name) as categories
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
        description,
        scent_profile,
        base_price,
        created_at
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

  // Create new product
  async createProduct(productData) {
    const { name, description, scent_profile, base_price, categories = [], variants = [] } = productData;

    // Start transaction
    const client = await query('BEGIN');

    try {
      // Insert product
      const productResult = await query(`
        INSERT INTO products (name, description, scent_profile, base_price)
        VALUES (?, ?, ?, ?)
        RETURNING id
      `, [name, description, JSON.stringify(scent_profile), base_price]);

      const productId = productResult.rows[0].id;

      // Insert categories
      if (categories.length > 0) {
        for (const categoryId of categories) {
          await query(`
            INSERT INTO product_categories (product_id, category_id)
            VALUES (?, ?)
          `, [productId, categoryId]);
        }
      }

      // Insert variants
      if (variants.length > 0) {
        for (const variant of variants) {
          await query(`
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

      await query('COMMIT');

      return await this.getProductById(productId);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  // Update product
  async updateProduct(id, productData) {
    const { name, description, scent_profile, base_price, categories = [], variants = [] } = productData;

    // Start transaction
    await query('BEGIN');

    try {
      // Update product
      await query(`
        UPDATE products
        SET name = ?, description = ?, scent_profile = ?, base_price = ?, updated_at = NOW()
        WHERE id = ?
      `, [name, description, JSON.stringify(scent_profile), base_price, id]);

      // Update categories
      await query('DELETE FROM product_categories WHERE product_id = ?', [id]);
      if (categories.length > 0) {
        for (const categoryId of categories) {
          await query(`
            INSERT INTO product_categories (product_id, category_id)
            VALUES (?, ?)
          `, [id, categoryId]);
        }
      }

      // Update variants (delete existing and insert new)
      await query('DELETE FROM product_variants WHERE product_id = ?', [id]);
      if (variants.length > 0) {
        for (const variant of variants) {
          await query(`
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

      await query('COMMIT');

      return await this.getProductById(id);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
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