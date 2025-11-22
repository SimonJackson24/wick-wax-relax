const { query, getClient } = require('../config/database');
const revolutService = require('./revolut');
const inventoryService = require('./inventory');
const royalMailService = require('./royalMail');
const emailService = require('./emailService');

class OrderService {
  // Create order with payment processing
  async createOrder(orderData, userId) {
    const client = await getClient();

    try {
      await client.begin();

      const { items, shippingAddress, paymentMethod } = orderData;

      // Get PWA channel ID
      const channelResult = await client.query(
        'SELECT id FROM channels WHERE name = ?',
        ['PWA']
      );

      if (channelResult.rows.length === 0) {
        throw new Error('PWA channel not found');
      }

      const channelId = channelResult.rows[0].id;

      // Calculate total and validate items
      let total = 0;
      const orderItems = [];

      for (const item of items) {
        const variantResult = await client.query(
          'SELECT pv.id, pv.price, pv.inventory_quantity, p.name as product_name FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.id = ?',
          [item.variantId]
        );

        if (variantResult.rows.length === 0) {
          throw new Error(`Product variant ${item.variantId} not found`);
        }

        const variant = variantResult.rows[0];

        if (variant.inventory_quantity < item.quantity) {
          throw new Error(`Insufficient inventory for ${variant.product_name}`);
        }

        const itemTotal = variant.price * item.quantity;
        total += itemTotal;

        orderItems.push({
          variantId: variant.id,
          quantity: item.quantity,
          unitPrice: variant.price,
          totalPrice: itemTotal
        });
      }

      // Create order
      const orderResult = await client.query(
        'INSERT INTO orders (channel_id, external_id, status, total) VALUES (?, ?, ?, ?) RETURNING id',
        [channelId, `PWA-${Date.now()}`, 'PENDING', total]
      );

      const orderId = orderResult.rows[0].id;

      // Create order items
      for (const item of orderItems) {
        await client.query(
          'INSERT INTO order_items (order_id, variant_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.variantId, item.quantity, item.unitPrice, item.totalPrice]
        );
      }

      // Reserve inventory
      await inventoryService.reserveInventory(orderId, orderItems);

      // Create payment intent with Revolut
      const paymentIntent = await revolutService.createPaymentIntent(
        total,
        'GBP',
        `Order ${orderId}`
      );

      // Create payment record
      await client.query(
        'INSERT INTO payments (order_id, payment_method, revolut_payment_id, amount, status) VALUES (?, ?, ?, ?, ?)',
        [orderId, paymentMethod, paymentIntent.paymentIntentId, total, 'REQUIRES_ACTION']
      );

      // Log order creation
      await this.logOrderStatusChange(orderId, null, 'PENDING', null, 'Order created', client);

      // Send order confirmation email
      try {
        await this.sendOrderConfirmationEmail(orderId, userId);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't fail the order creation if email fails
      }

      await client.commit();

      return {
        orderId,
        total,
        status: 'PENDING',
        paymentIntent: {
          id: paymentIntent.paymentIntentId,
          clientSecret: paymentIntent.clientSecret
        }
      };

    } catch (error) {
      await client.rollback();
      console.error('Order creation error:', error);
      throw error;
    }
  }

  // Get orders with filtering and pagination
  async getOrders(filters = {}, page = 1, limit = 20) {
    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      whereClause += ` AND o.status = ?`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.channel) {
      whereClause += ` AND c.name = ?`;
      params.push(filters.channel);
      paramIndex++;
    }

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

    const offset = (page - 1) * limit;

    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN channels c ON o.channel_id = c.id
      WHERE 1=1 ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].total);

    const result = await query(`
      SELECT
        o.id,
        o.external_id,
        o.status,
        o.total,
        o.order_date,
        c.name as channel_name,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN channels c ON o.channel_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1 ${whereClause}
      GROUP BY o.id, o.external_id, o.status, o.total, o.order_date, c.name
      ORDER BY o.order_date DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return {
      orders: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get order statistics (Admin dashboard)
  async getOrderStats(dateFrom = null, dateTo = null) {
    try {
      let dateFilter = '';
      const params = [];

      if (dateFrom && dateTo) {
        dateFilter = 'AND o.order_date BETWEEN ? AND ?';
        params.push(dateFrom, dateTo);
      }

      const result = await query(`
        SELECT
          COUNT(*) as total_orders,
          SUM(CASE WHEN o.status = 'PENDING' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN o.status = 'PROCESSING' THEN 1 ELSE 0 END) as processing_orders,
          SUM(CASE WHEN o.status = 'SHIPPED' THEN 1 ELSE 0 END) as shipped_orders,
          SUM(CASE WHEN o.status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered_orders,
          SUM(CASE WHEN o.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_orders,
          SUM(o.total) as total_revenue,
          AVG(o.total) as average_order_value
        FROM orders o
        WHERE 1=1 ${dateFilter}
      `, params);

      if (!result || result.rows.length === 0) {
        return {
          total_orders: 0,
          pending_orders: 0,
          processing_orders: 0,
          shipped_orders: 0,
          delivered_orders: 0,
          cancelled_orders: 0,
          total_revenue: 0,
          average_order_value: 0
        };
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error getting order stats:', error);
      throw new Error('Failed to get order statistics');
    }
  }

  // Get order with full details
  async getOrderDetails(orderId) {
    const result = await query(`
      SELECT
        o.id,
        o.external_id,
        o.status,
        o.total,
        o.order_date,
        o.channel_id,
        c.name as channel_name,
        json_agg(
          json_build_object(
            'id', oi.id,
            'variant_id', oi.variant_id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'product_name', p.name,
            'variant_name', pv.name,
            'sku', pv.sku
          )
        ) as items,
        (
          SELECT json_build_object(
            'id', pay.id,
            'payment_method', pay.payment_method,
            'revolut_payment_id', pay.revolut_payment_id,
            'amount', pay.amount,
            'status', pay.status,
            'created_at', pay.created_at
          )
          FROM payments pay
          WHERE pay.order_id = o.id
          LIMIT 1
        ) as payment
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      LEFT JOIN channels c ON o.channel_id = c.id
      WHERE o.id = ?
      GROUP BY o.id, o.external_id, o.status, o.total, o.order_date, o.channel_id, c.name
    `, [orderId]);

    if (result.rows.length === 0) {
      return null;
    }

    const order = result.rows[0];

    // Get status history
    const historyResult = await query(`
      SELECT
        osh.old_status,
        osh.new_status,
        osh.reason,
        osh.created_at,
        u.first_name,
        u.last_name
      FROM order_status_history osh
      LEFT JOIN users u ON osh.changed_by = u.id
      WHERE osh.order_id = ?
      ORDER BY osh.created_at DESC
    `, [orderId]);

    order.statusHistory = historyResult.rows;

    // Parse items from GROUP_CONCAT
    if (order.items) {
      order.items = order.items.split(';').map(item => {
        const [id, variant_id, quantity, unit_price, total_price, product_name, variant_name, sku] = item.split(',');
        return {
          id: parseInt(id),
          variant_id: parseInt(variant_id),
          quantity: parseInt(quantity),
          unit_price: parseFloat(unit_price),
          total_price: parseFloat(total_price),
          product_name,
          variant_name,
          sku
        };
      });
    } else {
      order.items = [];
    }

    // Parse payment from GROUP_CONCAT
    if (order.payment) {
      const [id, payment_method, revolut_payment_id, amount, status, created_at] = order.payment.split(',');
      order.payment = {
        id: parseInt(id),
        payment_method,
        revolut_payment_id,
        amount: parseFloat(amount),
        status,
        created_at
      };
    }

    return order;
  }

  // Update order status
  async updateOrderStatus(orderId, newStatus, changedBy = null, reason = '') {
    const client = await getClient();

    try {
      await client.begin();

      // Get current status
      const currentResult = await client.query(
        'SELECT status FROM orders WHERE id = ?',
        [orderId]
      );

      if (currentResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const oldStatus = currentResult.rows[0].status;

      // Update order status
      await client.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        [newStatus, orderId]
      );

      // Log status change
      await this.logOrderStatusChange(orderId, oldStatus, newStatus, changedBy, reason, client);

      // Handle status-specific actions
      await this.handleStatusChangeActions(orderId, oldStatus, newStatus, client);

      await client.commit();

      return { success: true, oldStatus, newStatus };

    } catch (error) {
      await client.rollback();
      throw error;
    }
  }

  // Handle status change side effects
  async handleStatusChangeActions(orderId, oldStatus, newStatus, client) {
    // Get order items for inventory management
    const itemsResult = await client.query(
      'SELECT variant_id, quantity FROM order_items WHERE order_id = ?',
      [orderId]
    );

    const items = itemsResult.rows.map(item => ({
      variantId: item.variant_id,
      quantity: item.quantity
    }));

    switch (newStatus) {
      case 'SHIPPED':
        // Generate tracking number if not already set
        const trackingResult = await client.query(
          'SELECT tracking_number FROM orders WHERE id = ?',
          [orderId]
        );

        if (!trackingResult.rows[0].tracking_number) {
          // Generate a mock tracking number for demo purposes
          const trackingNumber = `RM${Date.now().toString().slice(-10)}GB`;
          await client.query(
            `UPDATE orders SET
              tracking_number = ?,
              carrier = 'ROYAL_MAIL',
              shipping_date = ?,
              tracking_status = 'SHIPPED',
              tracking_updated_at = ?
              WHERE id = ?`,
            [trackingNumber, new Date().toISOString(), new Date().toISOString(), orderId]
          );

          // Log initial tracking event
          await client.query(
            `INSERT INTO tracking_history
              (order_id, tracking_number, status, status_description, location, timestamp)
              VALUES (?, ?, ?, ?, ?, ?)`,
            [
              orderId,
              trackingNumber,
              'SHIPPED',
              'Order shipped from warehouse',
              'Wick Wax & Relax Warehouse',
              new Date().toISOString()
            ]
          );
        }

        console.log(`Order ${orderId} marked as shipped`);
        await this.sendOrderStatusEmail(orderId, 'SHIPPED');
        break;

      case 'DELIVERED':
        // Order completed successfully
        console.log(`Order ${orderId} delivered successfully`);
        await this.sendOrderStatusEmail(orderId, 'DELIVERED');
        break;

      case 'CANCELLED':
        // Release reserved inventory
        if (oldStatus === 'PENDING' || oldStatus === 'PROCESSING') {
          await inventoryService.releaseInventory(orderId, items);
        }
        console.log(`Order ${orderId} cancelled`);
        await this.sendOrderStatusEmail(orderId, 'CANCELLED');
        break;

      case 'REFUNDED':
        // Process refund if payment was successful
        const paymentResult = await client.query(
          'SELECT revolut_payment_id, amount FROM payments WHERE order_id = ? AND status = ?',
          [orderId, 'SUCCEEDED']
        );

        if (paymentResult.rows.length > 0) {
          const payment = paymentResult.rows[0];
          try {
            await revolutService.processRefund(payment.revolut_payment_id, payment.amount);
            console.log(`Refund processed for order ${orderId}`);
          } catch (error) {
            console.error(`Failed to process refund for order ${orderId}:`, error);
          }
        }
        await this.sendOrderStatusEmail(orderId, 'REFUNDED');
        break;
    }
  }

  // Send order confirmation email
  async sendOrderConfirmationEmail(orderId, userId) {
    try {
      // Get user email
      const userResult = await query('SELECT email, first_name, last_name FROM users WHERE id = ?', [userId]);
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Get order details
      const orderDetails = await this.getOrderDetails(orderId);
      if (!orderDetails) {
        throw new Error('Order not found');
      }

      // Format order data for email
      const emailOrderData = {
        id: orderDetails.id,
        orderDate: orderDetails.order_date,
        total: orderDetails.total,
        items: orderDetails.items.map(item => ({
          productName: item.product_name,
          variantName: item.variant_name,
          quantity: item.quantity,
          price: item.unit_price
        }))
      };

      await emailService.sendOrderConfirmationEmail(user.email, emailOrderData);
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      throw error;
    }
  }

  // Send order status update email
  async sendOrderStatusEmail(orderId, status) {
    try {
      // Get order details with user info
      const orderResult = await query(`
        SELECT o.id, o.status, o.total, o.order_date, u.email, u.first_name, u.last_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      // Send status update email
      const subject = `Order ${order.id} Status Update - ${status}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Status Update</h2>
          <p>Dear ${order.first_name} ${order.last_name},</p>
          <p>Your order #${order.id} status has been updated to: <strong>${status}</strong></p>
          <p>Order Date: ${new Date(order.order_date).toLocaleDateString()}</p>
          <p>Total: £${order.total}</p>
          <br>
          <p>Thank you for shopping with Wick Wax & Relax!</p>
        </div>
      `;

      await emailService.sendOrderStatusEmail(order.email, subject, html);
    } catch (error) {
      console.error('Error sending order status email:', error);
      // Don't throw error to avoid breaking order processing
    }
  }

  // Log order status change
  async logOrderStatusChange(orderId, oldStatus, newStatus, changedBy, reason, client = null) {
    const queryFn = client ? client.query.bind(client) : query;

    await queryFn(
      'INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, reason) VALUES (?, ?, ?, ?, ?)',
      [orderId, oldStatus, newStatus, changedBy, reason]
    );
  }

  // Set tracking number for an order
  async setTrackingNumber(orderId, trackingNumber, carrier = 'ROYAL_MAIL') {
    const client = await getClient();

    try {
      await client.begin();

      // Update order with tracking information
      await client.query(
        `UPDATE orders SET
          tracking_number = ?,
          carrier = ?,
          shipping_date = ?,
          tracking_status = 'SHIPPED',
          tracking_updated_at = ?
          WHERE id = ?`,
        [trackingNumber, carrier, new Date().toISOString(), new Date().toISOString(), orderId]
      );

      // Log status change
      await this.logOrderStatusChange(orderId, null, 'SHIPPED', null, `Tracking number set: ${trackingNumber}`, client);

      await client.commit();

      return { success: true, trackingNumber, carrier };
    } catch (error) {
      await client.rollback();
      console.error('Error setting tracking number:', error);
      throw error;
    }
  }

  // Get tracking information for an order
  async getTrackingInfo(orderId) {
    try {
      // Get order tracking data
      const orderResult = await query(
        `SELECT tracking_number, carrier, shipping_date, estimated_delivery_date, tracking_status, tracking_updated_at
         FROM orders WHERE id = ?`,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      if (!order.tracking_number) {
        return {
          orderId,
          hasTracking: false,
          message: 'No tracking number assigned to this order'
        };
      }

      // Get tracking data from Royal Mail
      const trackingData = await royalMailService.getTrackingInfoWithCache(order.tracking_number, orderId);

      // Get tracking history
      const historyResult = await query(
        `SELECT status, status_description, location, timestamp, carrier_data
         FROM tracking_history
         WHERE order_id = ?
         ORDER BY timestamp DESC`,
        [orderId]
      );

      return {
        orderId,
        hasTracking: true,
        trackingNumber: order.tracking_number,
        carrier: order.carrier,
        shippingDate: order.shipping_date,
        estimatedDelivery: order.estimated_delivery_date,
        currentStatus: order.tracking_status,
        lastUpdated: order.tracking_updated_at,
        trackingData,
        history: historyResult.rows
      };
    } catch (error) {
      console.error('Error getting tracking info:', error);
      throw error;
    }
  }
}

module.exports = new OrderService();