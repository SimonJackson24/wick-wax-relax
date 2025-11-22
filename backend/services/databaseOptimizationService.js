const { query, run, get } = require('../config/database');
const cacheService = require('./cacheService');

class DatabaseOptimizationService {
  constructor() {
    this.queryStats = {
      totalQueries: 0,
      cachedQueries: 0,
      slowQueries: 0,
      failedQueries: 0
    };
  }

  // Optimized query execution with caching
  async executeQuery(sql, params = [], options = {}) {
    const {
      cache = true,
      cacheTTL = 300, // 5 minutes default
      useCacheKey = null
    } = options;

    this.queryStats.totalQueries++;

    // Generate cache key
    const cacheKey = useCacheKey || this.generateCacheKey(sql, params);

    // Try cache first if enabled
    if (cache) {
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult) {
        this.queryStats.cachedQueries++;
        return cachedResult;
      }
    }

    try {
      const startTime = Date.now();
      const result = await query(sql, params);
      const executionTime = Date.now() - startTime;

      // Log slow queries
      if (executionTime > 1000) { // More than 1 second
        this.queryStats.slowQueries++;
        console.warn(`Slow query detected: ${executionTime}ms`, {
          sql: sql.substring(0, 100) + '...',
          params
        });
      }

      // Cache result if enabled
      if (cache && result.rows) {
        await cacheService.set(cacheKey, result, cacheTTL);
      }

      return result;
    } catch (error) {
      this.queryStats.failedQueries++;
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Batch query execution
  async executeBatch(queries) {
    const results = [];
    const startTime = Date.now();

    try {
      for (const { sql, params, options = {} } of queries) {
        const result = await this.executeQuery(sql, params, options);
        results.push(result);
      }

      const totalTime = Date.now() - startTime;
      console.log(`Batch query completed in ${totalTime}ms for ${queries.length} queries`);

      return results;
    } catch (error) {
      console.error('Batch query error:', error);
      throw error;
    }
  }

  // Optimized product queries
  async getProductsWithVariants(options = {}) {
    const {
      categoryId,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      includeInactive = false
    } = options;

    const cacheKey = `products:list:${categoryId || 'all'}:${limit}:${offset}:${sortBy}:${sortOrder}:${includeInactive}`;

    const sql = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.scent_profile,
        p.base_price,
        p.created_at,
        p.image_url,
        p.thumbnail_url
      FROM products p
      ${categoryId ? 'INNER JOIN product_categories pc ON p.id = pc.product_id WHERE pc.category_id = ?' : ''}
      ${!includeInactive ? 'AND p.is_active = 1' : ''}
      ORDER BY p.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const params = categoryId ? [categoryId, limit, offset] : [limit, offset];

    const result = await this.executeQuery(sql, params, { cacheKey });
    return result.rows;
  }

  // Optimized inventory queries
  async getInventoryStatus(productIds = []) {
    if (productIds.length === 0) return [];

    const placeholders = productIds.map(() => '?').join(',');
    const sql = `
      SELECT
        i.product_id,
        i.variant_id,
        i.quantity,
        i.last_synced,
        pv.name as variant_name,
        pv.sku
      FROM inventory i
      INNER JOIN product_variants pv ON i.variant_id = pv.id
      WHERE i.product_id IN (${placeholders})
      ORDER BY i.product_id, pv.name
    `;

    const cacheKey = `inventory:status:${productIds.sort().join(',')}`;
    const result = await this.executeQuery(sql, productIds, { cacheKey });

    return result.rows;
  }

  // Optimized order queries
  async getOrdersWithItems(userId, options = {}) {
    const {
      status,
      limit = 10,
      offset = 0,
      includeItems = true
    } = options;

    const cacheKey = `orders:user:${userId}:${status || 'all'}:${limit}:${offset}:${includeItems}`;

    let sql = `
      SELECT
        o.id,
        o.external_id,
        o.status,
        o.order_date,
        o.total,
        o.tracking_number,
        o.carrier,
        o.shipping_date,
        o.estimated_delivery_date
      FROM orders o
      WHERE o.user_id = ?
      ${status ? 'AND o.status = ?' : ''}
      ORDER BY o.order_date DESC
      LIMIT ? OFFSET ?
    `;

    const params = status ? [userId, status, limit, offset] : [userId, limit, offset];

    const result = await this.executeQuery(sql, params, { cacheKey });

    if (includeItems && result.rows.length > 0) {
      // Batch fetch order items
      const orderIds = result.rows.map(order => order.id);
      const itemsResult = await this.getOrderItemsBatch(orderIds);

      // Group items by order
      const itemsByOrder = {};
      itemsResult.forEach(item => {
        if (!itemsByOrder[item.order_id]) {
          itemsByOrder[item.order_id] = [];
        }
        itemsByOrder[item.order_id].push(item);
      });

      // Attach items to orders
      result.rows.forEach(order => {
        order.items = itemsByOrder[order.id] || [];
      });
    }

    return result.rows;
  }

  // Batch order items query
  async getOrderItemsBatch(orderIds) {
    if (orderIds.length === 0) return [];

    const placeholders = orderIds.map(() => '?').join(',');
    const sql = `
      SELECT
        oi.order_id,
        oi.variant_id,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        pv.name as product_name,
        pv.sku
      FROM order_items oi
      INNER JOIN product_variants pv ON oi.variant_id = pv.id
      WHERE oi.order_id IN (${placeholders})
      ORDER BY oi.order_id
    `;

    const cacheKey = `order_items:batch:${orderIds.sort().join(',')}`;
    const result = await this.executeQuery(sql, orderIds, { cacheKey });

    return result.rows;
  }

  // Generate cache key from SQL and params
  generateCacheKey(sql, params = []) {
    const sqlHash = require('crypto').createHash('md5').update(sql).digest('hex');
    const paramsHash = require('crypto').createHash('md5').update(JSON.stringify(params)).digest('hex');
    return `db:query:${sqlHash}:${paramsHash}`;
  }

  // Clear query cache patterns
  async clearQueryCache(patterns = []) {
    const defaultPatterns = [
      'db:query:*',
      'products:*',
      'inventory:*',
      'orders:*'
    ];

    const patternsToClear = patterns.length > 0 ? patterns : defaultPatterns;

    for (const pattern of patternsToClear) {
      await cacheService.clearPattern(pattern);
    }
  }

  // Get query statistics
  getQueryStats() {
    return {
      ...this.queryStats,
      cacheHitRate: this.queryStats.totalQueries > 0
        ? (this.queryStats.cachedQueries / this.queryStats.totalQueries * 100).toFixed(2)
        : 0
    };
  }

  // Health check for database connections
  async healthCheck() {
    try {
      const startTime = Date.now();
      await query('SELECT 1 as health_check');
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new DatabaseOptimizationService();