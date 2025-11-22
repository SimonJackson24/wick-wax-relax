const { query, getClient } = require('../config/database');
const orderService = require('./order');
const emailService = require('./emailService');

class SubscriptionService {
  // Get all subscription plans
  async getSubscriptionPlans(activeOnly = true) {
    let queryText = `
      SELECT
        id,
        name,
        description,
        interval,
        discount_percentage,
        is_active,
        created_at
      FROM subscription_plans
    `;

    const params = [];
    if (activeOnly) {
      queryText += ' WHERE is_active = ?';
      params.push(true);
    }

    queryText += ' ORDER BY discount_percentage DESC, name';

    const result = await query(queryText, params);
    return result.rows;
  }

  // Get subscription plan by ID
  async getSubscriptionPlanById(planId) {
    const result = await query(`
      SELECT
        id,
        name,
        description,
        interval,
        discount_percentage,
        is_active,
        created_at
      FROM subscription_plans
      WHERE id = ?
    `, [planId]);

    return result.rows[0] || null;
  }

  // Create subscription plan (Admin only)
  async createSubscriptionPlan(planData) {
    const { name, description, interval, discount_percentage } = planData;

    const result = await query(`
      INSERT INTO subscription_plans (name, description, interval, discount_percentage)
      VALUES (?, ?, ?, ?)
      RETURNING id, name, description, interval, discount_percentage, is_active, created_at
    `, [name, description, interval, discount_percentage]);

    return result.rows[0];
  }

  // Update subscription plan (Admin only)
  async updateSubscriptionPlan(planId, planData) {
    const { name, description, interval, discount_percentage, is_active } = planData;

    const result = await query(`
      UPDATE subscription_plans
      SET name = ?, description = ?, interval = ?, discount_percentage = ?, is_active = ?
      WHERE id = ?
      RETURNING id, name, description, interval, discount_percentage, is_active, created_at
    `, [name, description, interval, discount_percentage, is_active, planId]);

    if (result.rows.length === 0) {
      throw new Error('Subscription plan not found');
    }

    return result.rows[0];
  }

  // Delete subscription plan (Admin only)
  async deleteSubscriptionPlan(planId) {
    // Check if plan is being used
    const usageCheck = await query(`
      SELECT COUNT(*) as usage_count FROM user_subscriptions WHERE plan_id = ?
    `, [planId]);

    if (usageCheck.rows[0].usage_count > 0) {
      throw new Error('Cannot delete plan that is currently in use by subscribers');
    }

    await query('DELETE FROM subscription_plans WHERE id = ?', [planId]);
    return { success: true };
  }

  // Create user subscription
  async createUserSubscription(subscriptionData, userId) {
    const client = await getClient();

    try {
      await client.begin();

      const { planId, productId, variantId, shippingAddress } = subscriptionData;

      // Validate plan exists and is active
      const planResult = await client.query(`
        SELECT id, name, interval, discount_percentage FROM subscription_plans
        WHERE id = ? AND is_active = true
      `, [planId]);

      if (planResult.rows.length === 0) {
        throw new Error('Subscription plan not found or inactive');
      }

      const plan = planResult.rows[0];

      // Validate product and variant exist
      const productResult = await client.query(`
        SELECT p.id, p.name, pv.id as variant_id, pv.price, pv.inventory_quantity
        FROM products p
        JOIN product_variants pv ON p.id = pv.product_id
        WHERE p.id = ? AND pv.id = ?
      `, [productId, variantId]);

      if (productResult.rows.length === 0) {
        throw new Error('Product or variant not found');
      }

      const product = productResult.rows[0];

      if (product.inventory_quantity < 1) {
        throw new Error('Product is out of stock');
      }

      // Calculate next order date based on interval
      const nextOrderDate = this.calculateNextOrderDate(plan.interval);

      // Create subscription
      const subscriptionResult = await client.query(`
        INSERT INTO user_subscriptions (
          user_id, plan_id, product_id, variant_id, status, next_order_date
        ) VALUES (?, ?, ?, ?, 'ACTIVE', ?)
        RETURNING id, user_id, plan_id, product_id, variant_id, status, next_order_date, created_at
      `, [userId, planId, productId, variantId, nextOrderDate]);

      const subscription = subscriptionResult.rows[0];

      // Store shipping address for subscription
      if (shippingAddress) {
        await this.updateSubscriptionShippingAddress(subscription.id, shippingAddress, client);
      }

      // Send welcome email
      try {
        await this.sendSubscriptionWelcomeEmail(userId, subscription.id);
      } catch (emailError) {
        console.error('Failed to send subscription welcome email:', emailError);
        // Don't fail the subscription creation if email fails
      }

      await client.commit();

      return {
        ...subscription,
        plan: plan,
        product: {
          id: product.id,
          name: product.name,
          variant_id: product.variant_id,
          price: product.price
        }
      };

    } catch (error) {
      await client.rollback();
      console.error('Subscription creation error:', error);
      throw error;
    }
  }

  // Get user's subscriptions
  async getUserSubscriptions(userId, includeInactive = false) {
    let queryText = `
      SELECT
        us.id,
        us.user_id,
        us.plan_id,
        us.product_id,
        us.variant_id,
        us.status,
        us.next_order_date,
        us.last_order_date,
        us.created_at,
        us.updated_at,
        us.cancelled_at,
        sp.name as plan_name,
        sp.description as plan_description,
        sp.interval as plan_interval,
        sp.discount_percentage,
        p.name as product_name,
        pv.name as variant_name,
        pv.price as variant_price,
        pv.sku,
        ua.full_name,
        ua.address_line1,
        ua.address_line2,
        ua.city,
        ua.state,
        ua.postal_code,
        ua.country
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      JOIN products p ON us.product_id = p.id
      JOIN product_variants pv ON us.variant_id = pv.id
      LEFT JOIN user_addresses ua ON us.id = ua.user_id AND ua.address_type = 'SHIPPING' AND ua.is_default = true
      WHERE us.user_id = ?
    `;

    const params = [userId];

    if (!includeInactive) {
      queryText += " AND us.status IN ('ACTIVE', 'PAUSED')";
    }

    queryText += ' ORDER BY us.created_at DESC';

    const result = await query(queryText, params);

    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      status: row.status,
      next_order_date: row.next_order_date,
      last_order_date: row.last_order_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      cancelled_at: row.cancelled_at,
      plan: {
        id: row.plan_id,
        name: row.plan_name,
        description: row.plan_description,
        interval: row.plan_interval,
        discount_percentage: row.discount_percentage
      },
      product: {
        id: row.product_id,
        name: row.product_name,
        variant_id: row.variant_id,
        variant_name: row.variant_name,
        price: row.variant_price,
        sku: row.sku
      },
      shipping_address: row.full_name ? {
        full_name: row.full_name,
        address_line1: row.address_line1,
        address_line2: row.address_line2,
        city: row.city,
        state: row.state,
        postal_code: row.postal_code,
        country: row.country
      } : null
    }));
  }

  // Get subscription by ID
  async getSubscriptionById(subscriptionId, userId = null) {
    let queryText = `
      SELECT
        us.id,
        us.user_id,
        us.plan_id,
        us.product_id,
        us.variant_id,
        us.status,
        us.next_order_date,
        us.last_order_date,
        us.created_at,
        us.updated_at,
        us.cancelled_at,
        sp.name as plan_name,
        sp.description as plan_description,
        sp.interval as plan_interval,
        sp.discount_percentage,
        p.name as product_name,
        pv.name as variant_name,
        pv.price as variant_price,
        pv.sku,
        ua.full_name,
        ua.address_line1,
        ua.address_line2,
        ua.city,
        ua.state,
        ua.postal_code,
        ua.country
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      JOIN products p ON us.product_id = p.id
      JOIN product_variants pv ON us.variant_id = pv.id
      LEFT JOIN user_addresses ua ON us.id = ua.user_id AND ua.address_type = 'SHIPPING' AND ua.is_default = true
      WHERE us.id = ?
    `;

    const params = [subscriptionId];

    if (userId) {
      queryText += ' AND us.user_id = ?';
      params.push(userId);
    }

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      status: row.status,
      next_order_date: row.next_order_date,
      last_order_date: row.last_order_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      cancelled_at: row.cancelled_at,
      plan: {
        id: row.plan_id,
        name: row.plan_name,
        description: row.plan_description,
        interval: row.plan_interval,
        discount_percentage: row.discount_percentage
      },
      product: {
        id: row.product_id,
        name: row.product_name,
        variant_id: row.variant_id,
        variant_name: row.variant_name,
        price: row.variant_price,
        sku: row.sku
      },
      shipping_address: row.full_name ? {
        full_name: row.full_name,
        address_line1: row.address_line1,
        address_line2: row.address_line2,
        city: row.city,
        state: row.state,
        postal_code: row.postal_code,
        country: row.country
      } : null
    };
  }

  // Update subscription
  async updateSubscription(subscriptionId, updateData, userId = null) {
    const client = await getClient();

    try {
      await client.begin();

      // Verify ownership if userId provided
      if (userId) {
        const ownershipCheck = await client.query(
          'SELECT id FROM user_subscriptions WHERE id = ? AND user_id = ?',
          [subscriptionId, userId]
        );

        if (ownershipCheck.rows.length === 0) {
          throw new Error('Subscription not found or access denied');
        }
      }

      const { planId, productId, variantId, shippingAddress, status } = updateData;
      const updates = [];
      const params = [];

      if (planId) {
        updates.push('plan_id = ?');
        params.push(planId);
      }

      if (productId) {
        updates.push('product_id = ?');
        params.push(productId);
      }

      if (variantId) {
        updates.push('variant_id = ?');
        params.push(variantId);
      }

      if (status) {
        updates.push('status = ?');
        params.push(status);
        if (status === 'CANCELLED') {
          updates.push('cancelled_at = ?');
          params.push(new Date().toISOString());
        }
      }

      updates.push('updated_at = ?');
      params.push(new Date().toISOString());

      const queryText = `
        UPDATE user_subscriptions
        SET ${updates.join(', ')}
        WHERE id = ?
        RETURNING id, status, updated_at
      `;

      params.push(subscriptionId);

      const result = await client.query(queryText, params);

      if (result.rows.length === 0) {
        throw new Error('Subscription not found');
      }

      // Update shipping address if provided
      if (shippingAddress) {
        await this.updateSubscriptionShippingAddress(subscriptionId, shippingAddress, client);
      }

      // Recalculate next order date if plan changed
      if (planId) {
        await this.recalculateNextOrderDate(subscriptionId, client);
      }

      await client.commit();

      return result.rows[0];

    } catch (error) {
      await client.rollback();
      console.error('Subscription update error:', error);
      throw error;
    }
  }

  // Pause subscription
  async pauseSubscription(subscriptionId, userId = null) {
    return this.updateSubscription(subscriptionId, { status: 'PAUSED' }, userId);
  }

  // Resume subscription
  async resumeSubscription(subscriptionId, userId = null) {
    const client = await getClient();

    try {
      await client.begin();

      // Verify ownership if userId provided
      if (userId) {
        const ownershipCheck = await client.query(
          'SELECT id FROM user_subscriptions WHERE id = ? AND user_id = ?',
          [subscriptionId, userId]
        );

        if (ownershipCheck.rows.length === 0) {
          throw new Error('Subscription not found or access denied');
        }
      }

      // Get current subscription to recalculate next order date
      const subscriptionResult = await client.query(`
        SELECT us.id, sp.interval
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE us.id = ?
      `, [subscriptionId]);

      if (subscriptionResult.rows.length === 0) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptionResult.rows[0];
      const nextOrderDate = this.calculateNextOrderDate(subscription.interval);

      const result = await client.query(`
        UPDATE user_subscriptions
        SET status = 'ACTIVE', next_order_date = ?, updated_at = ?
        WHERE id = ?
        RETURNING id, status, next_order_date, updated_at
      `, [nextOrderDate, new Date().toISOString(), subscriptionId]);

      await client.commit();

      return result.rows[0];

    } catch (error) {
      await client.rollback();
      console.error('Subscription resume error:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId, reason = '', userId = null) {
    const client = await getClient();

    try {
      await client.begin();

      // Verify ownership if userId provided
      if (userId) {
        const ownershipCheck = await client.query(
          'SELECT id FROM user_subscriptions WHERE id = ? AND user_id = ?',
          [subscriptionId, userId]
        );

        if (ownershipCheck.rows.length === 0) {
          throw new Error('Subscription not found or access denied');
        }
      }

      const result = await client.query(`
        UPDATE user_subscriptions
        SET status = 'CANCELLED', cancelled_at = ?, updated_at = ?
        WHERE id = ?
        RETURNING id, status, cancelled_at, updated_at
      `, [new Date().toISOString(), new Date().toISOString(), subscriptionId]);

      if (result.rows.length === 0) {
        throw new Error('Subscription not found');
      }

      // Log cancellation reason (you might want to create a cancellation_reasons table)
      if (reason) {
        console.log(`Subscription ${subscriptionId} cancelled. Reason: ${reason}`);
      }

      // Send cancellation confirmation email
      try {
        const subscription = await this.getSubscriptionById(subscriptionId);
        if (subscription) {
          await this.sendSubscriptionCancellationEmail(subscription.user_id, subscriptionId, reason);
        }
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
      }

      await client.commit();

      return result.rows[0];

    } catch (error) {
      await client.rollback();
      console.error('Subscription cancellation error:', error);
      throw error;
    }
  }

  // Process subscription orders (called by cron job)
  async processSubscriptionOrders() {
    const client = await getClient();

    try {
      await client.begin();

      // Find subscriptions due for processing
      const dueSubscriptions = await client.query(`
        SELECT
          us.id,
          us.user_id,
          us.plan_id,
          us.product_id,
          us.variant_id,
          sp.interval,
          sp.discount_percentage,
          pv.price,
          ua.full_name,
          ua.address_line1,
          ua.address_line2,
          ua.city,
          ua.state,
          ua.postal_code,
          ua.country
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        JOIN product_variants pv ON us.variant_id = pv.id
        LEFT JOIN user_addresses ua ON us.user_id = ua.user_id AND ua.address_type = 'SHIPPING' AND ua.is_default = true
        WHERE us.status = 'ACTIVE'
          AND us.next_order_date <= ?
          AND pv.inventory_quantity > 0
      `, [new Date().toISOString().split('T')[0]]); // Today's date

      console.log(`Processing ${dueSubscriptions.rows.length} subscription orders`);

      for (const subscription of dueSubscriptions.rows) {
        try {
          // Calculate discounted price
          const originalPrice = subscription.price;
          const discountAmount = (originalPrice * subscription.discount_percentage) / 100;
          const discountedPrice = originalPrice - discountAmount;

          // Create order
          const orderData = {
            items: [{
              variantId: subscription.variant_id,
              quantity: 1
            }],
            shippingAddress: {
              full_name: subscription.full_name,
              address_line1: subscription.address_line1,
              address_line2: subscription.address_line2,
              city: subscription.city,
              state: subscription.state,
              postal_code: subscription.postal_code,
              country: subscription.country
            },
            paymentMethod: 'SUBSCRIPTION' // Special payment method for subscriptions
          };

          const orderResult = await orderService.createOrder(orderData, subscription.user_id);

          // Link order to subscription
          await client.query(`
            INSERT INTO subscription_orders (subscription_id, order_id)
            VALUES (?, ?)
          `, [subscription.id, orderResult.orderId]);

          // Update subscription's last order date and next order date
          const nextOrderDate = this.calculateNextOrderDate(subscription.interval);
          await client.query(`
            UPDATE user_subscriptions
            SET last_order_date = ?, next_order_date = ?, updated_at = ?
            WHERE id = ?
          `, [
            new Date().toISOString().split('T')[0],
            nextOrderDate,
            new Date().toISOString(),
            subscription.id
          ]);

          console.log(`Created subscription order ${orderResult.orderId} for subscription ${subscription.id}`);

        } catch (orderError) {
          console.error(`Failed to process subscription ${subscription.id}:`, orderError);
          // Continue processing other subscriptions
        }
      }

      await client.commit();

      return {
        success: true,
        processed: dueSubscriptions.rows.length
      };

    } catch (error) {
      await client.rollback();
      console.error('Subscription order processing error:', error);
      throw error;
    }
  }

  // Helper methods

  calculateNextOrderDate(interval) {
    const today = new Date();
    const nextDate = new Date(today);

    switch (interval.toUpperCase()) {
      case 'WEEKLY':
        nextDate.setDate(today.getDate() + 7);
        break;
      case 'BIWEEKLY':
        nextDate.setDate(today.getDate() + 14);
        break;
      case 'MONTHLY':
        nextDate.setMonth(today.getMonth() + 1);
        break;
      default:
        nextDate.setDate(today.getDate() + 7); // Default to weekly
    }

    return nextDate.toISOString().split('T')[0]; // Return date in YYYY-MM-DD format
  }

  async recalculateNextOrderDate(subscriptionId, client) {
    // Get subscription plan interval
    const planResult = await client.query(`
      SELECT sp.interval
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.id = ?
    `, [subscriptionId]);

    if (planResult.rows.length > 0) {
      const nextOrderDate = this.calculateNextOrderDate(planResult.rows[0].interval);
      await client.query(`
        UPDATE user_subscriptions
        SET next_order_date = ?
        WHERE id = ?
      `, [nextOrderDate, subscriptionId]);
    }
  }

  async updateSubscriptionShippingAddress(subscriptionId, shippingAddress, client) {
    // For now, we'll store the shipping address in the user_addresses table
    // In a more complex system, you might want a separate subscription_addresses table

    const queryFn = client ? client.query.bind(client) : query;

    // Check if user has a default shipping address
    const existingAddress = await queryFn(`
      SELECT id FROM user_addresses
      WHERE user_id = (SELECT user_id FROM user_subscriptions WHERE id = ?)
        AND address_type = 'SHIPPING'
        AND is_default = true
    `, [subscriptionId]);

    if (existingAddress.rows.length > 0) {
      // Update existing address
      await queryFn(`
        UPDATE user_addresses
        SET full_name = ?, address_line1 = ?, address_line2 = ?, city = ?, state = ?, postal_code = ?, country = ?
        WHERE id = ?
      `, [
        shippingAddress.full_name,
        shippingAddress.address_line1,
        shippingAddress.address_line2 || '',
        shippingAddress.city,
        shippingAddress.state || '',
        shippingAddress.postal_code,
        shippingAddress.country,
        existingAddress.rows[0].id
      ]);
    } else {
      // Get user ID and create new address
      const userResult = await queryFn(`
        SELECT user_id FROM user_subscriptions WHERE id = ?
      `, [subscriptionId]);

      if (userResult.rows.length > 0) {
        await queryFn(`
          INSERT INTO user_addresses (
            user_id, address_type, full_name, address_line1, address_line2,
            city, state, postal_code, country, is_default
          ) VALUES (?, 'SHIPPING', ?, ?, ?, ?, ?, ?, ?, true)
        `, [
          userResult.rows[0].user_id,
          shippingAddress.full_name,
          shippingAddress.address_line1,
          shippingAddress.address_line2 || '',
          shippingAddress.city,
          shippingAddress.state || '',
          shippingAddress.postal_code,
          shippingAddress.country
        ]);
      }
    }
  }

  // Email methods

  async sendSubscriptionWelcomeEmail(userId, subscriptionId) {
    try {
      // Get user email
      const userResult = await query('SELECT email, first_name FROM users WHERE id = ?', [userId]);
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Get subscription details
      const subscription = await this.getSubscriptionById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const subject = `Welcome to your ${subscription.plan.name} subscription!`;
      const message = `
        <h2>Welcome to your Wick Wax & Relax subscription!</h2>
        <p>Dear ${user.first_name},</p>
        <p>Thank you for subscribing to our ${subscription.plan.name} plan!</p>
        <p><strong>Your subscription details:</strong></p>
        <ul>
          <li>Plan: ${subscription.plan.name}</li>
          <li>Product: ${subscription.product.name} (${subscription.product.variant_name})</li>
          <li>Interval: ${subscription.plan.interval.toLowerCase()}</li>
          <li>Discount: ${subscription.plan.discount_percentage}% off</li>
          <li>Next delivery: ${subscription.next_order_date}</li>
        </ul>
        <p>You'll receive your first delivery on ${subscription.next_order_date}.</p>
        <p>You can manage your subscription anytime from your account dashboard.</p>
      `;

      await emailService.sendOrderNotificationEmail(user.email, subject, message, subscription);

    } catch (error) {
      console.error('Error sending subscription welcome email:', error);
      throw error;
    }
  }

  async sendSubscriptionCancellationEmail(userId, subscriptionId, reason = '') {
    try {
      // Get user email
      const userResult = await query('SELECT email, first_name FROM users WHERE id = ?', [userId]);
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Get subscription details
      const subscription = await this.getSubscriptionById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const subject = `Subscription Cancelled - ${subscription.plan.name}`;
      const message = `
        <h2>We're sorry to see you go</h2>
        <p>Dear ${user.first_name},</p>
        <p>Your ${subscription.plan.name} subscription has been cancelled.</p>
        <p><strong>Cancellation details:</strong></p>
        <ul>
          <li>Plan: ${subscription.plan.name}</li>
          <li>Product: ${subscription.product.name} (${subscription.product.variant_name})</li>
          <li>Cancellation date: ${new Date().toLocaleDateString()}</li>
          ${reason ? `<li>Reason: ${reason}</li>` : ''}
        </ul>
        <p>If you change your mind, you can reactivate your subscription anytime from your account dashboard.</p>
        <p>Thank you for being part of the Wick Wax & Relax community!</p>
      `;

      await emailService.sendOrderNotificationEmail(user.email, subject, message, subscription);

    } catch (error) {
      console.error('Error sending subscription cancellation email:', error);
      throw error;
    }
  }

  // Analytics methods

  async getSubscriptionAnalytics(dateFrom = null, dateTo = null) {
    let dateFilter = '';
    const params = [];

    if (dateFrom && dateTo) {
      dateFilter = 'AND us.created_at BETWEEN ? AND ?';
      params.push(dateFrom, dateTo);
    }

    const analytics = await query(`
      SELECT
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN us.status = 'ACTIVE' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN us.status = 'PAUSED' THEN 1 END) as paused_subscriptions,
        COUNT(CASE WHEN us.status = 'CANCELLED' THEN 1 END) as cancelled_subscriptions,
        COUNT(CASE WHEN us.status = 'EXPIRED' THEN 1 END) as expired_subscriptions,
        AVG(sp.discount_percentage) as avg_discount_percentage,
        COUNT(DISTINCT us.user_id) as unique_subscribers,
        COUNT(DISTINCT CASE WHEN us.status = 'ACTIVE' THEN us.user_id END) as active_subscribers
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE 1=1 ${dateFilter}
    `, params);

    // Get plan popularity
    const planPopularity = await query(`
      SELECT
        sp.name,
        sp.interval,
        COUNT(us.id) as subscription_count,
        AVG(sp.discount_percentage) as avg_discount
      FROM subscription_plans sp
      LEFT JOIN user_subscriptions us ON sp.id = us.plan_id
      GROUP BY sp.id, sp.name, sp.interval
      ORDER BY subscription_count DESC
    `);

    // Get revenue from subscriptions
    const revenue = await query(`
      SELECT
        SUM(oi.total_price) as total_subscription_revenue,
        COUNT(so.id) as total_subscription_orders,
        AVG(oi.total_price) as avg_subscription_order_value
      FROM subscription_orders so
      JOIN orders o ON so.order_id = o.id
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status NOT IN ('CANCELLED')
    `);

    return {
      overview: analytics.rows[0],
      planPopularity: planPopularity.rows,
      revenue: revenue.rows[0]
    };
  }

  // Get subscriptions requiring attention (admin)
  async getSubscriptionsRequiringAttention() {
    const result = await query(`
      SELECT
        us.id,
        us.user_id,
        us.status,
        us.next_order_date,
        us.created_at,
        sp.name as plan_name,
        p.name as product_name,
        pv.name as variant_name,
        pv.inventory_quantity,
        u.email,
        u.first_name,
        u.last_name
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      JOIN products p ON us.product_id = p.id
      JOIN product_variants pv ON us.variant_id = pv.id
      JOIN users u ON us.user_id = u.id
      WHERE (
        (us.status = 'ACTIVE' AND us.next_order_date <= date('now', '+3 days')) OR
        (us.status = 'ACTIVE' AND pv.inventory_quantity = 0) OR
        (us.status = 'PAUSED' AND us.updated_at <= date('now', '-30 days'))
      )
      ORDER BY
        CASE
          WHEN pv.inventory_quantity = 0 THEN 1
          WHEN us.next_order_date <= date('now') THEN 2
          WHEN us.next_order_date <= date('now', '+3 days') THEN 3
          ELSE 4
        END,
        us.next_order_date
    `);

    return result.rows;
  }
}

module.exports = new SubscriptionService();