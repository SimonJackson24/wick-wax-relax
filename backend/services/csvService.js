const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const orderService = require('./order');

class CSVService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Export orders to CSV
  async exportOrders(filters = {}, userId = null) {
    try {
      const fileName = `orders-export-${Date.now()}.csv`;
      const filePath = path.join(this.tempDir, fileName);

      // Get orders data
      const ordersData = await this.getOrdersData(filters, userId);

      // Create CSV writer
      const csvWriter = createCsvWriter({
        path: filePath,
        header: this.getOrderHeaders()
      });

      // Write data to CSV
      await csvWriter.writeRecords(ordersData);

      return {
        filePath,
        fileName,
        contentType: 'text/csv',
        recordCount: ordersData.length
      };

    } catch (error) {
      console.error('Error exporting orders to CSV:', error);
      throw error;
    }
  }

  // Get CSV headers for orders
  getOrderHeaders() {
    return [
      { id: 'order_id', title: 'Order ID' },
      { id: 'external_id', title: 'External ID' },
      { id: 'order_date', title: 'Order Date' },
      { id: 'status', title: 'Status' },
      { id: 'total', title: 'Total (£)' },
      { id: 'channel_name', title: 'Channel' },
      { id: 'item_count', title: 'Item Count' },
      { id: 'customer_email', title: 'Customer Email' },
      { id: 'payment_method', title: 'Payment Method' },
      { id: 'payment_status', title: 'Payment Status' },
      { id: 'tracking_number', title: 'Tracking Number' },
      { id: 'carrier', title: 'Carrier' },
      { id: 'shipping_date', title: 'Shipping Date' },
      { id: 'estimated_delivery', title: 'Estimated Delivery' },
      { id: 'tracking_status', title: 'Tracking Status' }
    ];
  }

  // Get orders data for CSV export
  async getOrdersData(filters = {}, userId = null) {
    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    // Add user filter if specified (for customer exports)
    if (userId) {
      whereClause += ` AND o.user_id = ?`;
      params.push(userId);
      paramIndex++;
    }

    // Add status filter
    if (filters.status) {
      whereClause += ` AND o.status = ?`;
      params.push(filters.status);
      paramIndex++;
    }

    // Add channel filter
    if (filters.channel) {
      whereClause += ` AND c.name = ?`;
      params.push(filters.channel);
      paramIndex++;
    }

    // Add date range filters
    if (filters.dateFrom) {
      whereClause += ` AND o.order_date >= ?`;
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      whereClause += ` AND o.order_date <= ?`;
      params.push(filters.dateTo);
      paramIndex++;
    }

    // Get orders with customer and payment info
    const ordersQuery = `
      SELECT
        o.id as order_id,
        o.external_id,
        o.order_date,
        o.status,
        o.total,
        c.name as channel_name,
        COUNT(oi.id) as item_count,
        u.email as customer_email,
        p.payment_method,
        p.status as payment_status,
        o.tracking_number,
        o.carrier,
        o.shipping_date,
        o.estimated_delivery_date,
        o.tracking_status
      FROM orders o
      LEFT JOIN channels c ON o.channel_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON o.id = p.order_id AND p.status = 'SUCCEEDED'
      WHERE 1=1 ${whereClause}
      GROUP BY o.id, o.external_id, o.order_date, o.status, o.total, c.name, u.email, p.payment_method, p.status,
               o.tracking_number, o.carrier, o.shipping_date, o.estimated_delivery_date, o.tracking_status
      ORDER BY o.order_date DESC
    `;

    const result = await query(ordersQuery, params);

    // Format the data for CSV
    return result.rows.map(order => ({
      order_id: order.order_id,
      external_id: order.external_id,
      order_date: order.order_date ? new Date(order.order_date).toLocaleDateString('en-GB') : '',
      status: order.status,
      total: parseFloat(order.total).toFixed(2),
      channel_name: order.channel_name || 'PWA',
      item_count: order.item_count,
      customer_email: order.customer_email || '',
      payment_method: order.payment_method || '',
      payment_status: order.payment_status || '',
      tracking_number: order.tracking_number || '',
      carrier: order.carrier || '',
      shipping_date: order.shipping_date ? new Date(order.shipping_date).toLocaleDateString('en-GB') : '',
      estimated_delivery: order.estimated_delivery_date ? new Date(order.estimated_delivery_date).toLocaleDateString('en-GB') : '',
      tracking_status: order.tracking_status || ''
    }));
  }

  // Export detailed order items to CSV
  async exportOrderItems(filters = {}, userId = null) {
    try {
      const fileName = `order-items-export-${Date.now()}.csv`;
      const filePath = path.join(this.tempDir, fileName);

      // Get order items data
      const itemsData = await this.getOrderItemsData(filters, userId);

      // Create CSV writer
      const csvWriter = createCsvWriter({
        path: filePath,
        header: this.getOrderItemsHeaders()
      });

      // Write data to CSV
      await csvWriter.writeRecords(itemsData);

      return {
        filePath,
        fileName,
        contentType: 'text/csv',
        recordCount: itemsData.length
      };

    } catch (error) {
      console.error('Error exporting order items to CSV:', error);
      throw error;
    }
  }

  // Get CSV headers for order items
  getOrderItemsHeaders() {
    return [
      { id: 'order_id', title: 'Order ID' },
      { id: 'external_id', title: 'External Order ID' },
      { id: 'order_date', title: 'Order Date' },
      { id: 'customer_email', title: 'Customer Email' },
      { id: 'product_name', title: 'Product Name' },
      { id: 'variant_name', title: 'Variant' },
      { id: 'sku', title: 'SKU' },
      { id: 'quantity', title: 'Quantity' },
      { id: 'unit_price', title: 'Unit Price (£)' },
      { id: 'total_price', title: 'Total Price (£)' },
      { id: 'status', title: 'Order Status' },
      { id: 'tracking_number', title: 'Tracking Number' },
      { id: 'carrier', title: 'Carrier' }
    ];
  }

  // Get order items data for CSV export
  async getOrderItemsData(filters = {}, userId = null) {
    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    // Add user filter if specified
    if (userId) {
      whereClause += ` AND o.user_id = ?`;
      params.push(userId);
      paramIndex++;
    }

    // Add status filter
    if (filters.status) {
      whereClause += ` AND o.status = ?`;
      params.push(filters.status);
      paramIndex++;
    }

    // Add date range filters
    if (filters.dateFrom) {
      whereClause += ` AND o.order_date >= ?`;
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      whereClause += ` AND o.order_date <= ?`;
      params.push(filters.dateTo);
      paramIndex++;
    }

    const itemsQuery = `
      SELECT
        o.id as order_id,
        o.external_id,
        o.order_date,
        u.email as customer_email,
        p.name as product_name,
        pv.name as variant_name,
        pv.sku,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        o.status,
        o.tracking_number,
        o.carrier
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1 ${whereClause}
      ORDER BY o.order_date DESC, o.id, p.name
    `;

    const result = await query(itemsQuery, params);

    // Format the data for CSV
    return result.rows.map(item => ({
      order_id: item.order_id,
      external_id: item.external_id,
      order_date: item.order_date ? new Date(item.order_date).toLocaleDateString('en-GB') : '',
      customer_email: item.customer_email || '',
      product_name: item.product_name || '',
      variant_name: item.variant_name || 'Default',
      sku: item.sku || '',
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price).toFixed(2),
      total_price: parseFloat(item.total_price).toFixed(2),
      status: item.status,
      tracking_number: item.tracking_number || '',
      carrier: item.carrier || ''
    }));
  }

  // Export customer order summary
  async exportCustomerSummary(userId) {
    try {
      const fileName = `customer-summary-${Date.now()}.csv`;
      const filePath = path.join(this.tempDir, fileName);

      // Get customer summary data
      const summaryData = await this.getCustomerSummaryData(userId);

      // Create CSV writer
      const csvWriter = createCsvWriter({
        path: filePath,
        header: this.getCustomerSummaryHeaders()
      });

      // Write data to CSV
      await csvWriter.writeRecords(summaryData);

      return {
        filePath,
        fileName,
        contentType: 'text/csv',
        recordCount: summaryData.length
      };

    } catch (error) {
      console.error('Error exporting customer summary to CSV:', error);
      throw error;
    }
  }

  // Get CSV headers for customer summary
  getCustomerSummaryHeaders() {
    return [
      { id: 'period', title: 'Period' },
      { id: 'total_orders', title: 'Total Orders' },
      { id: 'total_spent', title: 'Total Spent (£)' },
      { id: 'average_order_value', title: 'Average Order Value (£)' },
      { id: 'last_order_date', title: 'Last Order Date' },
      { id: 'most_ordered_product', title: 'Most Ordered Product' },
      { id: 'total_products_ordered', title: 'Total Products Ordered' }
    ];
  }

  // Get customer summary data
  async getCustomerSummaryData(userId) {
    // Get user info
    const userResult = await query('SELECT email, first_name, last_name FROM users WHERE id = ?', [userId]);
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Get order statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_orders,
        SUM(total) as total_spent,
        AVG(total) as average_order_value,
        MAX(order_date) as last_order_date,
        SUM((SELECT COUNT(*) FROM order_items WHERE order_id = o.id)) as total_products_ordered
      FROM orders o
      WHERE o.user_id = ?
    `;

    const statsResult = await query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    // Get most ordered product
    const productQuery = `
      SELECT
        p.name as product_name,
        SUM(oi.quantity) as total_quantity
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY p.id, p.name
      ORDER BY total_quantity DESC
      LIMIT 1
    `;

    const productResult = await query(productQuery, [userId]);
    const mostOrderedProduct = productResult.rows.length > 0 ? productResult.rows[0].product_name : 'N/A';

    return [{
      period: 'All Time',
      total_orders: stats.total_orders || 0,
      total_spent: stats.total_spent ? parseFloat(stats.total_spent).toFixed(2) : '0.00',
      average_order_value: stats.average_order_value ? parseFloat(stats.average_order_value).toFixed(2) : '0.00',
      last_order_date: stats.last_order_date ? new Date(stats.last_order_date).toLocaleDateString('en-GB') : 'N/A',
      most_ordered_product: mostOrderedProduct,
      total_products_ordered: stats.total_products_ordered || 0
    }];
  }

  // Clean up temporary files
  cleanup(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }

  // Get export statistics
  async getExportStats() {
    try {
      const stats = await query(`
        SELECT
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered_orders,
          COUNT(CASE WHEN tracking_number IS NOT NULL THEN 1 END) as orders_with_tracking,
          SUM(total) as total_revenue,
          AVG(total) as average_order_value
        FROM orders
      `);

      return stats.rows[0];
    } catch (error) {
      console.error('Error getting export stats:', error);
      throw error;
    }
  }
}

module.exports = new CSVService();