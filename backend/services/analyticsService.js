const { query, getClient } = require('../config/database');

class AnalyticsService {
  // User Analytics

  async getUserAnalytics(dateFrom = null, dateTo = null) {
    let dateFilter = '';
    const params = [];

    if (dateFrom && dateTo) {
      dateFilter = 'WHERE u.created_at BETWEEN ? AND ?';
      params.push(dateFrom, dateTo);
    }

    const userStats = await query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN u.created_at >= date('now', '-30 days') THEN 1 END) as new_users_30d,
        COUNT(CASE WHEN u.created_at >= date('now', '-7 days') THEN 1 END) as new_users_7d,
        COUNT(CASE WHEN u.last_login >= date('now', '-30 days') THEN 1 END) as active_users_30d,
        COUNT(CASE WHEN u.last_login >= date('now', '-7 days') THEN 1 END) as active_users_7d,
        AVG(julianday('now') - julianday(u.last_login)) as avg_days_since_login,
        COUNT(CASE WHEN u.email_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN u.is_active = true THEN 1 END) as active_accounts
      FROM users u ${dateFilter}
    `, params);

    // User registration trends
    const registrationTrends = await query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as registrations
      FROM users
      WHERE created_at >= date('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // User engagement metrics
    const engagementMetrics = await query(`
      SELECT
        COUNT(DISTINCT o.user_id) as users_with_orders,
        COUNT(o.id) as total_orders,
        AVG(o.total) as avg_order_value,
        SUM(o.total) as total_revenue,
        COUNT(DISTINCT CASE WHEN o.order_date >= date('now', '-30 days') THEN o.user_id END) as active_buyers_30d
      FROM orders o
      WHERE o.status NOT IN ('CANCELLED')
    `);

    return {
      overview: userStats.rows[0],
      registrationTrends: registrationTrends.rows,
      engagement: engagementMetrics.rows[0]
    };
  }

  // Sales Analytics

  async getSalesAnalytics(dateFrom = null, dateTo = null, groupBy = 'day') {
    let dateFilter = '';
    const params = [];

    if (dateFrom && dateTo) {
      dateFilter = 'AND o.order_date BETWEEN ? AND ?';
      params.push(dateFrom, dateTo);
    }

    let groupByClause;
    switch (groupBy) {
      case 'hour':
        groupByClause = "strftime('%Y-%m-%d %H:00:00', o.order_date)";
        break;
      case 'day':
        groupByClause = "DATE(o.order_date)";
        break;
      case 'week':
        groupByClause = "strftime('%Y-%W', o.order_date)";
        break;
      case 'month':
        groupByClause = "strftime('%Y-%m', o.order_date)";
        break;
      default:
        groupByClause = "DATE(o.order_date)";
    }

    const salesTrends = await query(`
      SELECT
        ${groupByClause} as period,
        COUNT(o.id) as orders_count,
        SUM(o.total) as revenue,
        AVG(o.total) as avg_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers,
        SUM(oi.quantity) as items_sold
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status NOT IN ('CANCELLED') ${dateFilter}
      GROUP BY ${groupByClause}
      ORDER BY period DESC
      LIMIT 100
    `, params);

    // Sales by channel
    const salesByChannel = await query(`
      SELECT
        c.name as channel,
        COUNT(o.id) as orders_count,
        SUM(o.total) as revenue,
        AVG(o.total) as avg_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers
      FROM orders o
      JOIN channels c ON o.channel_id = c.id
      WHERE o.status NOT IN ('CANCELLED') ${dateFilter.replace('AND', 'AND o.')}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `, params);

    // Top products
    const topProducts = await query(`
      SELECT
        p.name as product_name,
        pv.name as variant_name,
        pv.sku,
        SUM(oi.quantity) as units_sold,
        SUM(oi.total_price) as revenue,
        COUNT(DISTINCT o.id) as orders_count,
        AVG(oi.unit_price) as avg_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE o.status NOT IN ('CANCELLED') ${dateFilter.replace('AND', 'AND o.')}
      GROUP BY pv.id, p.name, pv.name, pv.sku
      ORDER BY revenue DESC
      LIMIT 20
    `, params);

    return {
      trends: salesTrends.rows,
      byChannel: salesByChannel.rows,
      topProducts: topProducts.rows
    };
  }

  // Product Analytics

  async getProductAnalytics(dateFrom = null, dateTo = null) {
    let dateFilter = '';
    const params = [];

    if (dateFrom && dateTo) {
      dateFilter = 'AND o.order_date BETWEEN ? AND ?';
      params.push(dateFrom, dateTo);
    }

    // Product performance
    const productPerformance = await query(`
      SELECT
        p.id,
        p.name,
        p.scent_profile,
        COUNT(DISTINCT o.id) as orders_count,
        SUM(oi.quantity) as units_sold,
        SUM(oi.total_price) as revenue,
        AVG(oi.unit_price) as avg_selling_price,
        pv.price as base_price,
        pv.inventory_quantity as current_stock,
        COUNT(DISTINCT o.user_id) as unique_customers
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN order_items oi ON pv.id = oi.variant_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status NOT IN ('CANCELLED')
      GROUP BY p.id, p.name, p.scent_profile, pv.price, pv.inventory_quantity
      ORDER BY revenue DESC NULLS LAST
    `);

    // Category performance
    const categoryPerformance = await query(`
      SELECT
        c.name as category_name,
        COUNT(DISTINCT p.id) as products_count,
        COUNT(DISTINCT o.id) as orders_count,
        SUM(oi.total_price) as revenue,
        SUM(oi.quantity) as units_sold,
        AVG(oi.unit_price) as avg_price
      FROM categories c
      JOIN product_categories pc ON c.id = pc.category_id
      JOIN products p ON pc.product_id = p.id
      JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN order_items oi ON pv.id = oi.variant_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status NOT IN ('CANCELLED')
      GROUP BY c.id, c.name
      ORDER BY revenue DESC NULLS LAST
    `);

    // Low stock alerts
    const lowStockProducts = await query(`
      SELECT
        p.name as product_name,
        pv.name as variant_name,
        pv.sku,
        pv.inventory_quantity,
        pv.price,
        c.name as category_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE pv.inventory_quantity <= 10
      ORDER BY pv.inventory_quantity ASC
      LIMIT 20
    `);

    return {
      productPerformance: productPerformance.rows,
      categoryPerformance: categoryPerformance.rows,
      lowStockProducts: lowStockProducts.rows
    };
  }

  // Inventory Analytics

  async getInventoryAnalytics() {
    // Inventory value and turnover
    const inventoryValue = await query(`
      SELECT
        SUM(pv.inventory_quantity * pv.price) as total_inventory_value,
        COUNT(pv.id) as total_variants,
        SUM(pv.inventory_quantity) as total_units,
        AVG(pv.inventory_quantity) as avg_stock_per_variant,
        MIN(pv.inventory_quantity) as min_stock,
        MAX(pv.inventory_quantity) as max_stock
      FROM product_variants pv
      WHERE pv.inventory_quantity > 0
    `);

    // Inventory turnover (sales velocity)
    const inventoryTurnover = await query(`
      SELECT
        pv.id,
        p.name as product_name,
        pv.name as variant_name,
        pv.inventory_quantity as current_stock,
        pv.price,
        COALESCE(SUM(oi.quantity), 0) as sold_last_30d,
        COALESCE(SUM(oi.quantity), 0) / NULLIF(pv.inventory_quantity, 0) as turnover_ratio,
        CASE
          WHEN pv.inventory_quantity = 0 THEN 'Out of Stock'
          WHEN pv.inventory_quantity <= 5 THEN 'Critical'
          WHEN pv.inventory_quantity <= 20 THEN 'Low'
          ELSE 'Healthy'
        END as stock_status
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN order_items oi ON pv.id = oi.variant_id
      LEFT JOIN orders o ON oi.order_id = o.id
        AND o.status NOT IN ('CANCELLED')
        AND o.order_date >= date('now', '-30 days')
      GROUP BY pv.id, p.name, pv.name, pv.inventory_quantity, pv.price
      ORDER BY turnover_ratio DESC NULLS LAST
    `);

    // Stock movement analysis
    const stockMovement = await query(`
      SELECT
        DATE(ial.created_at) as date,
        SUM(CASE WHEN ial.quantity_change > 0 THEN ial.quantity_change ELSE 0 END) as stock_in,
        SUM(CASE WHEN ial.quantity_change < 0 THEN ABS(ial.quantity_change) ELSE 0 END) as stock_out,
        COUNT(*) as total_movements
      FROM inventory_audit_log ial
      WHERE ial.created_at >= date('now', '-30 days')
      GROUP BY DATE(ial.created_at)
      ORDER BY date DESC
    `);

    return {
      overview: inventoryValue.rows[0],
      turnover: inventoryTurnover.rows,
      movement: stockMovement.rows
    };
  }

  // Customer Analytics

  async getCustomerAnalytics(dateFrom = null, dateTo = null) {
    let dateFilter = '';
    const params = [];

    if (dateFrom && dateTo) {
      dateFilter = 'AND o.order_date BETWEEN ? AND ?';
      params.push(dateFrom, dateTo);
    }

    // Customer segmentation
    const customerSegments = await query(`
      SELECT
        CASE
          WHEN order_count >= 10 THEN 'VIP'
          WHEN order_count >= 5 THEN 'Regular'
          WHEN order_count >= 2 THEN 'Occasional'
          ELSE 'New'
        END as segment,
        COUNT(*) as customer_count,
        AVG(total_spent) as avg_spent,
        SUM(total_spent) as total_segment_revenue,
        AVG(order_count) as avg_orders
      FROM (
        SELECT
          o.user_id,
          COUNT(o.id) as order_count,
          SUM(o.total) as total_spent
        FROM orders o
        WHERE o.status NOT IN ('CANCELLED') ${dateFilter}
        GROUP BY o.user_id
      ) customer_orders
      GROUP BY
        CASE
          WHEN order_count >= 10 THEN 'VIP'
          WHEN order_count >= 5 THEN 'Regular'
          WHEN order_count >= 2 THEN 'Occasional'
          ELSE 'New'
        END
      ORDER BY total_segment_revenue DESC
    `, params);

    // Customer lifetime value
    const customerLifetimeValue = await query(`
      SELECT
        AVG(customer_value.total_spent) as avg_customer_lifetime_value,
        MAX(customer_value.total_spent) as max_customer_value,
        MIN(customer_value.total_spent) as min_customer_value,
        COUNT(CASE WHEN customer_value.total_spent >= 100 THEN 1 END) as high_value_customers,
        COUNT(CASE WHEN customer_value.total_spent >= 50 THEN 1 END) as medium_value_customers
      FROM (
        SELECT
          o.user_id,
          SUM(o.total) as total_spent
        FROM orders o
        WHERE o.status NOT IN ('CANCELLED')
        GROUP BY o.user_id
      ) customer_value
    `);

    // Repeat purchase analysis
    const repeatPurchaseAnalysis = await query(`
      SELECT
        COUNT(DISTINCT CASE WHEN order_count > 1 THEN user_id END) as repeat_customers,
        COUNT(DISTINCT user_id) as total_customers,
        AVG(order_count) as avg_orders_per_customer,
        SUM(CASE WHEN order_count > 1 THEN total_spent ELSE 0 END) as repeat_customer_revenue,
        SUM(total_spent) as total_revenue
      FROM (
        SELECT
          o.user_id,
          COUNT(o.id) as order_count,
          SUM(o.total) as total_spent
        FROM orders o
        WHERE o.status NOT IN ('CANCELLED') ${dateFilter}
        GROUP BY o.user_id
      ) customer_stats
    `, params);

    return {
      segments: customerSegments.rows,
      lifetimeValue: customerLifetimeValue.rows[0],
      repeatPurchase: repeatPurchaseAnalysis.rows[0]
    };
  }

  // Real-time Analytics

  async getRealTimeAnalytics() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Today's metrics
    const todayMetrics = await query(`
      SELECT
        COUNT(DISTINCT o.id) as orders_today,
        SUM(o.total) as revenue_today,
        COUNT(DISTINCT o.user_id) as customers_today,
        COUNT(oi.id) as items_sold_today
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE DATE(o.order_date) = ? AND o.status NOT IN ('CANCELLED')
    `, [today]);

    // Yesterday's metrics for comparison
    const yesterdayMetrics = await query(`
      SELECT
        COUNT(DISTINCT o.id) as orders_yesterday,
        SUM(o.total) as revenue_yesterday,
        COUNT(DISTINCT o.user_id) as customers_yesterday,
        COUNT(oi.id) as items_sold_yesterday
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE DATE(o.order_date) = ? AND o.status NOT IN ('CANCELLED')
    `, [yesterday]);

    // Current active users (logged in today)
    const activeUsers = await query(`
      SELECT COUNT(*) as active_users_today
      FROM users
      WHERE last_login >= datetime('now', '-24 hours')
    `);

    // Low stock alerts
    const lowStockCount = await query(`
      SELECT COUNT(*) as low_stock_items
      FROM product_variants
      WHERE inventory_quantity <= 10
    `);

    // Pending orders
    const pendingOrders = await query(`
      SELECT COUNT(*) as pending_orders
      FROM orders
      WHERE status = 'PENDING'
    `);

    return {
      today: todayMetrics.rows[0],
      yesterday: yesterdayMetrics.rows[0],
      activeUsers: activeUsers.rows[0].active_users_today,
      alerts: {
        lowStock: lowStockCount.rows[0].low_stock_items,
        pendingOrders: pendingOrders.rows[0].pending_orders
      }
    };
  }

  // Performance Analytics

  async getPerformanceAnalytics(timeRange = '24h') {
    let timeFilter;
    switch (timeRange) {
      case '1h':
        timeFilter = "datetime('now', '-1 hour')";
        break;
      case '24h':
        timeFilter = "datetime('now', '-24 hours')";
        break;
      case '7d':
        timeFilter = "datetime('now', '-7 days')";
        break;
      case '30d':
        timeFilter = "datetime('now', '-30 days')";
        break;
      default:
        timeFilter = "datetime('now', '-24 hours')";
    }

    // API response times
    const apiPerformance = await query(`
      SELECT
        AVG(response_time) as avg_response_time,
        MIN(response_time) as min_response_time,
        MAX(response_time) as max_response_time,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN response_time > 1000 THEN 1 END) as slow_requests,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_requests
      FROM api_logs
      WHERE created_at >= ${timeFilter}
    `);

    // Database query performance
    const dbPerformance = await query(`
      SELECT
        AVG(execution_time) as avg_query_time,
        MAX(execution_time) as max_query_time,
        COUNT(*) as total_queries,
        COUNT(CASE WHEN execution_time > 100 THEN 1 END) as slow_queries
      FROM query_logs
      WHERE created_at >= ${timeFilter}
    `);

    // System resource usage
    const systemMetrics = await query(`
      SELECT
        AVG(cpu_usage) as avg_cpu_usage,
        MAX(cpu_usage) as max_cpu_usage,
        AVG(memory_usage) as avg_memory_usage,
        MAX(memory_usage) as max_memory_usage,
        AVG(disk_usage) as avg_disk_usage
      FROM system_metrics
      WHERE created_at >= ${timeFilter}
    `);

    return {
      api: apiPerformance.rows[0] || {},
      database: dbPerformance.rows[0] || {},
      system: systemMetrics.rows[0] || {}
    };
  }

  // Custom Analytics Queries

  async runCustomQuery(queryType, parameters = {}) {
    const client = await getClient();

    try {
      await client.begin();

      let result;
      switch (queryType) {
        case 'user_cohort_analysis':
          result = await this.getUserCohortAnalysis(client, parameters);
          break;
        case 'product_cross_sell':
          result = await this.getProductCrossSellAnalysis(client, parameters);
          break;
        case 'geographic_sales':
          result = await this.getGeographicSalesAnalysis(client, parameters);
          break;
        case 'seasonal_trends':
          result = await this.getSeasonalTrendsAnalysis(client, parameters);
          break;
        default:
          throw new Error('Unknown query type');
      }

      await client.commit();
      return result;

    } catch (error) {
      await client.rollback();
      console.error('Custom analytics query error:', error);
      throw error;
    }
  }

  async getUserCohortAnalysis(client, params) {
    const { months = 12 } = params;

    const cohortAnalysis = await client.query(`
      SELECT
        strftime('%Y-%m', u.created_at) as cohort_month,
        strftime('%Y-%m', o.order_date) as order_month,
        COUNT(DISTINCT u.id) as users,
        COUNT(o.id) as orders,
        SUM(o.total) as revenue
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
        AND o.status NOT IN ('CANCELLED')
        AND o.order_date >= u.created_at
      WHERE u.created_at >= date('now', '-${months} months')
      GROUP BY cohort_month, order_month
      ORDER BY cohort_month, order_month
    `);

    return cohortAnalysis.rows;
  }

  async getProductCrossSellAnalysis(client, params) {
    const { productId, limit = 10 } = params;

    const crossSellAnalysis = await client.query(`
      SELECT
        p2.name as recommended_product,
        COUNT(*) as frequency,
        AVG(o2.total) as avg_order_value
      FROM orders o1
      JOIN order_items oi1 ON o1.id = oi1.order_id
      JOIN orders o2 ON o1.user_id = o2.user_id AND o1.id != o2.id
      JOIN order_items oi2 ON o2.id = oi2.order_id
      JOIN product_variants pv2 ON oi2.variant_id = pv2.id
      JOIN products p2 ON pv2.product_id = p2.id
      WHERE oi1.variant_id IN (
        SELECT id FROM product_variants WHERE product_id = ?
      )
      AND oi2.variant_id NOT IN (
        SELECT id FROM product_variants WHERE product_id = ?
      )
      AND o1.status NOT IN ('CANCELLED')
      AND o2.status NOT IN ('CANCELLED')
      GROUP BY p2.id, p2.name
      ORDER BY frequency DESC
      LIMIT ?
    `, [productId, productId, limit]);

    return crossSellAnalysis.rows;
  }

  async getGeographicSalesAnalysis(client, params) {
    const geographicAnalysis = await client.query(`
      SELECT
        COALESCE(ua.country, 'Unknown') as country,
        COALESCE(ua.city, 'Unknown') as city,
        COUNT(DISTINCT o.id) as orders_count,
        SUM(o.total) as revenue,
        COUNT(DISTINCT o.user_id) as unique_customers,
        AVG(o.total) as avg_order_value
      FROM orders o
      LEFT JOIN user_addresses ua ON o.user_id = ua.user_id
        AND ua.address_type = 'SHIPPING'
        AND ua.is_default = true
      WHERE o.status NOT IN ('CANCELLED')
      GROUP BY ua.country, ua.city
      ORDER BY revenue DESC
    `);

    return geographicAnalysis.rows;
  }

  async getSeasonalTrendsAnalysis(client, params) {
    const { years = 2 } = params;

    const seasonalAnalysis = await client.query(`
      SELECT
        strftime('%Y', o.order_date) as year,
        strftime('%m', o.order_date) as month,
        COUNT(o.id) as orders_count,
        SUM(o.total) as revenue,
        AVG(o.total) as avg_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers
      FROM orders o
      WHERE o.status NOT IN ('CANCELLED')
        AND o.order_date >= date('now', '-${years} years')
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `);

    return seasonalAnalysis.rows;
  }

  // Export Analytics Data

  async exportAnalyticsData(dataType, format = 'json', dateFrom = null, dateTo = null) {
    let data;

    switch (dataType) {
      case 'sales':
        data = await this.getSalesAnalytics(dateFrom, dateTo);
        break;
      case 'users':
        data = await this.getUserAnalytics(dateFrom, dateTo);
        break;
      case 'products':
        data = await this.getProductAnalytics(dateFrom, dateTo);
        break;
      case 'inventory':
        data = await this.getInventoryAnalytics();
        break;
      case 'customers':
        data = await this.getCustomerAnalytics(dateFrom, dateTo);
        break;
      default:
        throw new Error('Unknown data type for export');
    }

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return data;
  }

  convertToCSV(data) {
    // Simple CSV conversion - in production, use a proper CSV library
    const flattenObject = (obj, prefix = '') => {
      let result = {};
      for (let key in obj) {
        if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          Object.assign(result, flattenObject(obj[key], prefix + key + '.'));
        } else {
          result[prefix + key] = obj[key];
        }
      }
      return result;
    };

    const csvRows = [];
    const headers = new Set();

    // Collect all headers
    Object.values(data).forEach(items => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          Object.keys(flattenObject(item)).forEach(key => headers.add(key));
        });
      }
    });

    csvRows.push(Array.from(headers).join(','));

    // Add data rows
    Object.values(data).forEach(items => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          const flatItem = flattenObject(item);
          const row = Array.from(headers).map(header => {
            const value = flatItem[header];
            return value !== undefined ? JSON.stringify(value) : '';
          });
          csvRows.push(row.join(','));
        });
      }
    });

    return csvRows.join('\n');
  }
}

module.exports = new AnalyticsService();