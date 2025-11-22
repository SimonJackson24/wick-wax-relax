const { query } = require('../config/database');

class SearchService {
  // Main product search with advanced filtering
  async searchProducts(searchParams = {}) {
    const {
      query: searchQuery = '',
      category = '',
      minPrice = null,
      maxPrice = null,
      scentProfile = [],
      inStock = null,
      sortBy = 'relevance',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
      includeVariants = true
    } = searchParams;

    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';

    // Text search across product name, description, and variant names
    if (searchQuery) {
      whereClause += ` AND (
        LOWER(p.name) LIKE LOWER(?) OR
        LOWER(p.description) LIKE LOWER(?) OR
        LOWER(pv.name) LIKE LOWER(?) OR
        LOWER(pv.sku) LIKE LOWER(?)
      )`;
      const searchPattern = `%${searchQuery}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      paramIndex += 4;
    }

    // Category filter
    if (category) {
      whereClause += ` AND pc.category_id = ?`;
      params.push(category);
      paramIndex++;
    }

    // Price range filter
    if (minPrice !== null) {
      whereClause += ` AND pv.price >= ?`;
      params.push(minPrice);
      paramIndex++;
    }
    if (maxPrice !== null) {
      whereClause += ` AND pv.price <= ?`;
      params.push(maxPrice);
      paramIndex++;
    }

    // Scent profile filter
    if (scentProfile && scentProfile.length > 0) {
      const scentConditions = scentProfile.map(() => `p.scent_profile::text LIKE ?`).join(' OR ');
      whereClause += ` AND (${scentConditions})`;
      scentProfile.forEach(scent => {
        params.push(`%${scent}%`);
        paramIndex++;
      });
    }

    // Stock filter
    if (inStock !== null) {
      if (inStock) {
        whereClause += ` AND pv.inventory_quantity > 0`;
      } else {
        whereClause += ` AND pv.inventory_quantity = 0`;
      }
    }

    // Build ORDER BY clause
    let orderByClause = '';
    switch (sortBy) {
      case 'price':
        orderByClause = `ORDER BY pv.price ${sortOrder}`;
        break;
      case 'name':
        orderByClause = `ORDER BY p.name ${sortOrder}`;
        break;
      case 'newest':
        orderByClause = `ORDER BY p.created_at DESC`;
        break;
      case 'popularity':
        orderByClause = `ORDER BY COALESCE(product_sales.total_sold, 0) DESC`;
        break;
      case 'relevance':
      default:
        if (searchQuery) {
          // For relevance, prioritize exact matches and then partial matches
          orderByClause = `ORDER BY
            CASE
              WHEN LOWER(p.name) = LOWER('${searchQuery}') THEN 1
              WHEN LOWER(p.name) LIKE LOWER('${searchQuery}%') THEN 2
              WHEN LOWER(p.name) LIKE LOWER('%${searchQuery}%') THEN 3
              ELSE 4
            END,
            p.created_at DESC`;
        } else {
          orderByClause = `ORDER BY p.created_at DESC`;
        }
        break;
    }

    // Main search query
    const searchQuerySQL = `
      SELECT DISTINCT
        p.id,
        p.name,
        p.description,
        p.scent_profile,
        p.base_price,
        p.created_at,
        pv.id as variant_id,
        pv.name as variant_name,
        pv.sku,
        pv.price as variant_price,
        pv.inventory_quantity,
        pv.attributes,
        GROUP_CONCAT(DISTINCT c.name) as categories,
        COALESCE(product_sales.total_sold, 0) as total_sold,
        COALESCE(product_sales.total_revenue, 0) as total_revenue
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN (
        SELECT
          pv_inner.product_id,
          SUM(oi.quantity) as total_sold,
          SUM(oi.total_price) as total_revenue
        FROM product_variants pv_inner
        JOIN order_items oi ON pv_inner.id = oi.variant_id
        JOIN orders o ON oi.order_id = o.id AND o.status NOT IN ('CANCELLED')
        GROUP BY pv_inner.product_id
      ) product_sales ON p.id = product_sales.product_id
      ${whereClause}
      GROUP BY p.id, pv.id, product_sales.total_sold, product_sales.total_revenue
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const results = await query(searchQuerySQL, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      ${whereClause.replace(/GROUP BY.*$/, '')}
    `;

    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Group results by product
    const productsMap = new Map();

    results.rows.forEach(row => {
      if (!productsMap.has(row.id)) {
        productsMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          scent_profile: row.scent_profile,
          base_price: row.base_price,
          created_at: row.created_at,
          categories: row.categories ? row.categories.split(',') : [],
          total_sold: row.total_sold,
          total_revenue: row.total_revenue,
          variants: []
        });
      }

      if (row.variant_id) {
        productsMap.get(row.id).variants.push({
          id: row.variant_id,
          name: row.variant_name,
          sku: row.sku,
          price: row.variant_price,
          inventory_quantity: row.inventory_quantity,
          attributes: row.attributes
        });
      }
    });

    const products = Array.from(productsMap.values());

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      searchParams: {
        query: searchQuery,
        category,
        minPrice,
        maxPrice,
        scentProfile,
        inStock,
        sortBy,
        sortOrder
      }
    };
  }

  // Get search suggestions/autocomplete
  async getSearchSuggestions(query, limit = 10) {
    if (!query || query.length < 2) {
      return { suggestions: [], categories: [], products: [] };
    }

    const searchPattern = `${query}%`;

    // Get product name suggestions
    const productSuggestions = await query(`
      SELECT DISTINCT name as suggestion, 'product' as type, COUNT(*) as relevance
      FROM products
      WHERE LOWER(name) LIKE LOWER(?)
      GROUP BY name
      ORDER BY relevance DESC, name
      LIMIT ?
    `, [searchPattern, limit]);

    // Get category suggestions
    const categorySuggestions = await query(`
      SELECT DISTINCT name as suggestion, 'category' as type, COUNT(pc.product_id) as relevance
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      WHERE LOWER(c.name) LIKE LOWER(?)
      GROUP BY c.id, c.name
      ORDER BY relevance DESC, name
      LIMIT ?
    `, [searchPattern, limit]);

    // Get SKU suggestions
    const skuSuggestions = await query(`
      SELECT DISTINCT sku as suggestion, 'sku' as type, pv.name as product_name
      FROM product_variants pv
      WHERE LOWER(sku) LIKE LOWER(?)
      ORDER BY sku
      LIMIT ?
    `, [searchPattern, limit]);

    return {
      suggestions: [
        ...productSuggestions.rows,
        ...categorySuggestions.rows,
        ...skuSuggestions.rows
      ].slice(0, limit),
      categories: categorySuggestions.rows,
      products: productSuggestions.rows,
      skus: skuSuggestions.rows
    };
  }

  // Get popular search terms
  async getPopularSearches(limit = 20) {
    // This would typically come from a search analytics table
    // For now, return popular products as search suggestions
    const popularProducts = await query(`
      SELECT
        p.name as term,
        COUNT(oi.id) as search_count,
        MAX(o.order_date) as last_searched
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN order_items oi ON pv.id = oi.variant_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status NOT IN ('CANCELLED')
      GROUP BY p.id, p.name
      ORDER BY search_count DESC, last_searched DESC
      LIMIT ?
    `, [limit]);

    return popularProducts.rows;
  }

  // Get advanced filters data
  async getSearchFilters() {
    const filters = {};

    // Price ranges
    const priceRanges = await query(`
      SELECT
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price
      FROM product_variants
      WHERE inventory_quantity > 0
    `);
    filters.priceRange = priceRanges.rows[0];

    // Categories with product counts
    const categories = await query(`
      SELECT
        c.id,
        c.name,
        c.slug,
        COUNT(pc.product_id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      GROUP BY c.id, c.name, c.slug
      ORDER BY product_count DESC, c.name
    `);
    filters.categories = categories.rows;

    // Scent profiles (extract from JSON)
    const scentProfiles = await query(`
      SELECT DISTINCT
        jsonb_object_keys(scent_profile) as scent_type,
        scent_profile->jsonb_object_keys(scent_profile) as scent_value
      FROM products
      WHERE scent_profile IS NOT NULL
      ORDER BY scent_type, scent_value
    `);

    // Group scent profiles
    const scents = {};
    scentProfiles.rows.forEach(row => {
      if (!scents[row.scent_type]) {
        scents[row.scent_type] = [];
      }
      if (!scents[row.scent_type].includes(row.scent_value)) {
        scents[row.scent_type].push(row.scent_value);
      }
    });
    filters.scentProfiles = scents;

    // Available attributes from variants
    const attributes = await query(`
      SELECT DISTINCT
        jsonb_object_keys(attributes) as attribute_type,
        attributes->jsonb_object_keys(attributes) as attribute_value
      FROM product_variants
      WHERE attributes IS NOT NULL
      ORDER BY attribute_type, attribute_value
    `);

    const variantAttributes = {};
    attributes.rows.forEach(row => {
      if (!variantAttributes[row.attribute_type]) {
        variantAttributes[row.attribute_type] = [];
      }
      if (!variantAttributes[row.attribute_type].includes(row.attribute_value)) {
        variantAttributes[row.attribute_type].push(row.attribute_value);
      }
    });
    filters.attributes = variantAttributes;

    return filters;
  }

  // Log search analytics (for future use)
  async logSearch(query, resultsCount, filters = {}, userId = null, sessionId = null) {
    // This would typically insert into a search_analytics table
    console.log('Search logged:', {
      query,
      resultsCount,
      filters,
      userId,
      sessionId,
      timestamp: new Date()
    });

    // In a real implementation, you'd store this in the database
    // await query('INSERT INTO search_analytics ...', [...]);
  }

  // Get related products based on search
  async getRelatedProducts(productId, limit = 6) {
    // Get product's categories and scent profile
    const productInfo = await query(`
      SELECT
        p.scent_profile,
        GROUP_CONCAT(pc.category_id) as category_ids
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      WHERE p.id = ?
      GROUP BY p.id, p.scent_profile
    `, [productId]);

    if (productInfo.rows.length === 0) {
      return [];
    }

    const product = productInfo.rows[0];
    const categoryIds = product.category_ids ? product.category_ids.split(',') : [];

    // Find related products
    let relatedQuery = `
      SELECT DISTINCT
        p.id,
        p.name,
        p.description,
        p.scent_profile,
        p.base_price,
        MIN(pv.price) as min_price,
        AVG(pv.inventory_quantity) as avg_stock,
        COUNT(DISTINCT pv.id) as variant_count
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      WHERE p.id != ?
    `;

    const params = [productId];

    // Related by categories
    if (categoryIds.length > 0) {
      const categoryPlaceholders = categoryIds.map(() => '?').join(',');
      relatedQuery += ` AND pc.category_id IN (${categoryPlaceholders})`;
      params.push(...categoryIds);
    }

    relatedQuery += `
      GROUP BY p.id, p.name, p.description, p.scent_profile, p.base_price
      ORDER BY
        CASE WHEN pc.category_id IN (${categoryIds.map(() => '?').join(',')}) THEN 1 ELSE 2 END,
        AVG(pv.inventory_quantity) DESC,
        p.created_at DESC
      LIMIT ?
    `;

    params.push(...categoryIds, limit);

    const relatedProducts = await query(relatedQuery, params);
    return relatedProducts.rows;
  }

  // Advanced search with faceted navigation
  async advancedSearch(searchParams = {}) {
    const baseResults = await this.searchProducts(searchParams);
    const filters = await this.getSearchFilters();

    // Add facet counts based on current search
    const facets = await this.getFacetCounts(searchParams);

    return {
      ...baseResults,
      filters,
      facets
    };
  }

  // Get facet counts for current search
  async getFacetCounts(searchParams = {}) {
    const {
      query: searchQuery = '',
      category = '',
      minPrice = null,
      maxPrice = null,
      scentProfile = [],
      inStock = null
    } = searchParams;

    const params = [];
    let paramIndex = 1;
    let whereClause = 'WHERE 1=1';

    // Apply same filters as main search
    if (searchQuery) {
      whereClause += ` AND (
        LOWER(p.name) LIKE LOWER(?) OR
        LOWER(p.description) LIKE LOWER(?) OR
        LOWER(pv.name) LIKE LOWER(?) OR
        LOWER(pv.sku) LIKE LOWER(?)
      )`;
      const searchPattern = `%${searchQuery}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (category) {
      whereClause += ` AND pc.category_id = ?`;
      params.push(category);
    }

    if (minPrice !== null) {
      whereClause += ` AND pv.price >= ?`;
      params.push(minPrice);
    }
    if (maxPrice !== null) {
      whereClause += ` AND pv.price <= ?`;
      params.push(maxPrice);
    }

    if (scentProfile && scentProfile.length > 0) {
      const scentConditions = scentProfile.map(() => `p.scent_profile::text LIKE ?`).join(' OR ');
      whereClause += ` AND (${scentConditions})`;
      scentProfile.forEach(scent => {
        params.push(`%${scent}%`);
      });
    }

    if (inStock !== null) {
      if (inStock) {
        whereClause += ` AND pv.inventory_quantity > 0`;
      } else {
        whereClause += ` AND pv.inventory_quantity = 0`;
      }
    }

    // Get category facets
    const categoryFacets = await query(`
      SELECT
        c.name,
        c.id,
        COUNT(DISTINCT p.id) as count
      FROM categories c
      JOIN product_categories pc ON c.id = pc.category_id
      JOIN products p ON pc.product_id = p.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      ${whereClause.replace('WHERE 1=1', 'WHERE c.id NOT IN (SELECT category_id FROM product_categories WHERE product_id = p.id) OR 1=1')}
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `, params);

    // Get price range facets
    const priceFacets = await query(`
      SELECT
        CASE
          WHEN pv.price < 10 THEN 'Under £10'
          WHEN pv.price BETWEEN 10 AND 25 THEN '£10 - £25'
          WHEN pv.price BETWEEN 25 AND 50 THEN '£25 - £50'
          WHEN pv.price BETWEEN 50 AND 100 THEN '£50 - £100'
          ELSE 'Over £100'
        END as range,
        COUNT(*) as count
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      ${whereClause}
      GROUP BY
        CASE
          WHEN pv.price < 10 THEN 'Under £10'
          WHEN pv.price BETWEEN 10 AND 25 THEN '£10 - £25'
          WHEN pv.price BETWEEN 25 AND 50 THEN '£25 - £50'
          WHEN pv.price BETWEEN 50 AND 100 THEN '£50 - £100'
          ELSE 'Over £100'
        END
      ORDER BY min(
        CASE
          WHEN pv.price < 10 THEN 1
          WHEN pv.price BETWEEN 10 AND 25 THEN 2
          WHEN pv.price BETWEEN 25 AND 50 THEN 3
          WHEN pv.price BETWEEN 50 AND 100 THEN 4
          ELSE 5
        END
      )
    `, params);

    return {
      categories: categoryFacets.rows,
      priceRanges: priceFacets.rows,
      totalProducts: await this.getTotalProductCount(searchParams)
    };
  }

  // Get total product count for current search
  async getTotalProductCount(searchParams = {}) {
    const {
      query: searchQuery = '',
      category = '',
      minPrice = null,
      maxPrice = null,
      scentProfile = [],
      inStock = null
    } = searchParams;

    const params = [];
    let whereClause = 'WHERE 1=1';

    if (searchQuery) {
      whereClause += ` AND (
        LOWER(p.name) LIKE LOWER(?) OR
        LOWER(p.description) LIKE LOWER(?) OR
        LOWER(pv.name) LIKE LOWER(?) OR
        LOWER(pv.sku) LIKE LOWER(?)
      )`;
      const searchPattern = `%${searchQuery}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (category) {
      whereClause += ` AND pc.category_id = ?`;
      params.push(category);
    }

    if (minPrice !== null) {
      whereClause += ` AND pv.price >= ?`;
      params.push(minPrice);
    }
    if (maxPrice !== null) {
      whereClause += ` AND pv.price <= ?`;
      params.push(maxPrice);
    }

    if (scentProfile && scentProfile.length > 0) {
      const scentConditions = scentProfile.map(() => `p.scent_profile::text LIKE ?`).join(' OR ');
      whereClause += ` AND (${scentConditions})`;
      scentProfile.forEach(scent => {
        params.push(`%${scent}%`);
      });
    }

    if (inStock !== null) {
      if (inStock) {
        whereClause += ` AND pv.inventory_quantity > 0`;
      } else {
        whereClause += ` AND pv.inventory_quantity = 0`;
      }
    }

    const countResult = await query(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      ${whereClause}
    `, params);

    return parseInt(countResult.rows[0].total);
  }
}

module.exports = new SearchService();