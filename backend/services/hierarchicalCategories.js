const { query } = require('../config/database');

class HierarchicalCategoriesService {
  async getAllHierarchicalCategories() {
    const result = await query('SELECT * FROM get_hierarchical_categories()');
    return result.rows;
  }

  async getCategoriesByLevel(level) {
    const result = await query(`
      SELECT * FROM category_hierarchy 
      WHERE level = $1 AND is_active = TRUE 
      ORDER BY display_order, name
    `, [level]);
    return result.rows;
  }

  async getParentCategoriesWithChildren() {
    const result = await query(`
      SELECT * FROM hierarchical_categories 
      WHERE parent_level = 1
      ORDER BY parent_display_order, child_display_order
    `);
    const categories = {};
    result.rows.forEach(row => {
      if (!categories[row.parent_id]) {
        categories[row.parent_id] = {
          id: row.parent_id,
          name: row.parent_name,
          slug: row.parent_slug,
          description: row.parent_description,
          image_url: row.parent_image_url,
          level: row.parent_level,
          display_order: row.parent_display_order,
          meta_title: row.parent_meta_title,
          meta_description: row.parent_meta_description,
          product_count: row.parent_product_count,
          children: []
        };
      }
      if (row.child_id) {
        categories[row.parent_id].children.push({
          id: row.child_id,
          name: row.child_name,
          slug: row.child_slug,
          description: row.child_description,
          image_url: row.child_image_url,
          level: row.child_level,
          display_order: row.child_display_order,
          meta_title: row.child_meta_title,
          meta_description: row.child_meta_description,
          product_count: row.child_product_count
        });
      }
    });
    return Object.values(categories);
  }

  async getCategoryBySlug(slug) {
    const result = await query(`
      SELECT * FROM category_hierarchy 
      WHERE slug = $1 AND is_active = TRUE
    `, [slug]);
    if (result.rows.length === 0) {
      return null;
    }
    const category = result.rows[0];
    const pathResult = await query('SELECT * FROM get_category_path($1)', [category.id]);
    category.path = pathResult.rows;
    const childrenResult = await query(`
      SELECT * FROM category_hierarchy 
      WHERE parent_id = $1 AND is_active = TRUE 
      ORDER BY display_order, name
    `, [category.id]);
    category.children = childrenResult.rows;
    return category;
  }

  async getProductsByCategory(categoryId, options = {}) {
    const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'ASC' } = options;
    const offset = (page - 1) * limit;
    const subcategoriesResult = await query(`
      WITH RECURSIVE subcategories AS (
        SELECT id FROM category_hierarchy WHERE id = $1
        UNION
        SELECT ch.id FROM category_hierarchy ch
        JOIN subcategories sc ON ch.parent_id = sc.id
      )
      SELECT id FROM subcategories
    `, [categoryId]);
    const categoryIds = subcategoriesResult.rows.map(row => row.id);
    if (categoryIds.length === 0) {
      return {
        products: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      };
    }
    const placeholders = categoryIds.map((_, index) => `$${index + 2}`).join(', ');
    const productsQuery = `
      SELECT DISTINCT
        p.id,
        p.name,
        p.description,
        p.scent_profile,
        p.base_price,
        p.created_at,
        p.updated_at
      FROM products p
      JOIN product_category_hierarchy pch ON p.id = pch.product_id
      WHERE pch.category_id IN (${placeholders})
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $1 OFFSET $${categoryIds.length + 2}
    `;
    const products = await query(productsQuery, [limit, ...categoryIds, offset]);
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      JOIN product_category_hierarchy pch ON p.id = pch.product_id
      WHERE pch.category_id IN (${placeholders})
    `;
    const countResult = await query(countQuery, categoryIds);
    const total = parseInt(countResult.rows[0].total);
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
        ORDER BY created_at
      `, [product.id]);
      product.variants = variants.rows;
    }
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

  async createCategory(categoryData) {
    const { 
      name, 
      slug, 
      description, 
      image_url, 
      parent_id, 
      level, 
      display_order, 
      meta_title, 
      meta_description 
    } = categoryData;
    let calculatedLevel = level;
    if (calculatedLevel === undefined && parent_id) {
      const parentResult = await query('SELECT level FROM category_hierarchy WHERE id = $1', [parent_id]);
      if (parentResult.rows.length > 0) {
        calculatedLevel = parentResult.rows[0].level + 1;
      }
    }
    const result = await query(`
      INSERT INTO category_hierarchy (
        name, slug, description, image_url, parent_id, level, 
        display_order, meta_title, meta_description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      name, slug, description, image_url, parent_id, calculatedLevel, 
      display_order || 0, meta_title, meta_description
    ]);
    return result.rows[0];
  }

  async updateCategory(id, categoryData) {
    const { 
      name, 
      slug, 
      description, 
      image_url, 
      parent_id, 
      level, 
      display_order, 
      is_active, 
      meta_title, 
      meta_description 
    } = categoryData;
    const result = await query(`
      UPDATE category_hierarchy 
      SET 
        name = $1,
        slug = $2,
        description = $3,
        image_url = $4,
        parent_id = $5,
        level = $6,
        display_order = $7,
        is_active = $8,
        meta_title = $9,
        meta_description = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
      name, slug, description, image_url, parent_id, level, 
      display_order, is_active, meta_title, meta_description, id
    ]);
    if (result.rows.length === 0) {
      throw new Error('Category not found');
    }
    return result.rows[0];
  }

  async deleteCategory(id) {
    const childrenResult = await query('SELECT COUNT(*) as count FROM category_hierarchy WHERE parent_id = $1', [id]);
    if (parseInt(childrenResult.rows[0].count) > 0) {
      throw new Error('Cannot delete category with subcategories. Delete subcategories first.');
    }
    await query('DELETE FROM category_hierarchy WHERE id = $1', [id]);
    return { success: true };
  }

  async addProductToCategory(productId, categoryId) {
    await query(`
      INSERT INTO product_category_hierarchy (product_id, category_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [productId, categoryId]);
    return { success: true };
  }

  async removeProductFromCategory(productId, categoryId) {
    await query(`
      DELETE FROM product_category_hierarchy 
      WHERE product_id = $1 AND category_id = $2
    `, [productId, categoryId]);
    return { success: true };
  }

  async getProductCategories(productId) {
    const result = await query(`
      SELECT 
        ch.id,
        ch.name,
        ch.slug,
        ch.description,
        ch.level,
        ch.parent_id,
        parent_ch.name as parent_name,
        parent_ch.slug as parent_slug,
        grandparent_ch.name as grandparent_name,
        grandparent_ch.slug as grandparent_slug
      FROM category_hierarchy ch
      JOIN product_category_hierarchy pch ON ch.id = pch.category_id
      LEFT JOIN category_hierarchy parent_ch ON ch.parent_id = parent_ch.id
      LEFT JOIN category_hierarchy grandparent_ch ON parent_ch.parent_id = grandparent_ch.id
      WHERE pch.product_id = $1 AND ch.is_active = TRUE
      ORDER BY ch.level, ch.display_order
    `, [productId]);
    return result.rows;
  }

  async updateProductCategories(productId, categoryIds) {
    await query('BEGIN');
    try {
      await query('DELETE FROM product_category_hierarchy WHERE product_id = $1', [productId]);
      for (const categoryId of categoryIds) {
        await query(`
          INSERT INTO product_category_hierarchy (product_id, category_id)
          VALUES ($1, $2)
        `, [productId, categoryId]);
      }
      await query('COMMIT');
      return { success: true };
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  async getCategoryFilters() {
    const result = await query(`
      SELECT 
        ch.id,
        ch.name,
        ch.slug,
        ch.level,
        ch.parent_id,
        parent_ch.name as parent_name,
        COUNT(DISTINCT p.id) as product_count
      FROM category_hierarchy ch
      LEFT JOIN category_hierarchy parent_ch ON ch.parent_id = parent_ch.id
      LEFT JOIN product_category_hierarchy pch ON ch.id = pch.category_id
      LEFT JOIN products p ON pch.product_id = p.id
      WHERE ch.is_active = TRUE
      GROUP BY ch.id, ch.name, ch.slug, ch.level, ch.parent_id, parent_ch.name
      ORDER BY ch.level, ch.display_order, ch.name
    `);
    const filters = {
      level1: [],
      level2: []
    };
    result.rows.forEach(row => {
      if (row.level === 1) {
        filters.level1.push({
          id: row.id,
          name: row.name,
          slug: row.slug,
          product_count: parseInt(row.product_count)
        });
      } else if (row.level === 2) {
        filters.level2.push({
          id: row.id,
          name: row.name,
          slug: row.slug,
          parent_id: row.parent_id,
          parent_name: row.parent_name,
          product_count: parseInt(row.product_count)
        });
      }
    });
    return filters;
  }

  async migrateExistingCategories() {
    await query('SELECT migrate_product_categories()');
    return { success: true };
  }
}

module.exports = new HierarchicalCategoriesService();