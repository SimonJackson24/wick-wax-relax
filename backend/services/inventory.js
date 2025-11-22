const { query, getClient } = require('../config/database');

class InventoryService {
  // Sync inventory from external channels (Amazon, Etsy)
  async syncChannelInventory(channelName, products) {
    const client = await getClient();

    try {
      await client.begin();

      // Get channel ID
      const channelResult = await client.query(
        'SELECT id FROM channels WHERE name = ?',
        [channelName]
      );

      if (channelResult.rows.length === 0) {
        throw new Error(`Channel ${channelName} not found`);
      }

      const channelId = channelResult.rows[0].id;

      for (const product of products) {
        // Find variant by SKU
        const variantResult = await client.query(
          'SELECT id FROM product_variants WHERE sku = ?',
          [product.sku]
        );

        if (variantResult.rows.length === 0) {
          console.warn(`Variant with SKU ${product.sku} not found, skipping`);
          continue;
        }

        const variantId = variantResult.rows[0].id;

        // Update or insert inventory record
        await client.query(`
          INSERT OR REPLACE INTO inventory (product_id, channel_id, quantity, last_synced)
          VALUES (?, ?, ?, datetime('now'))
        `, [variantId, channelId, product.quantity]);

        // Update variant inventory if this is the primary channel
        if (channelName === 'AMAZON' || channelName === 'PWA') {
          await client.query(
            'UPDATE product_variants SET inventory_quantity = ? WHERE id = ?',
            [product.quantity, variantId]
          );
        }
      }

      await client.commit();
      console.log(`Synced ${products.length} products for ${channelName}`);

    } catch (error) {
      await client.rollback();
      console.error('Inventory sync failed:', error);
      throw error;
    }
  }

  // Get inventory levels for all channels
  async getInventoryLevels(variantId = null) {
    let queryText = `
      SELECT
        i.product_id,
        i.channel_id,
        i.quantity,
        i.last_synced,
        c.name as channel_name,
        pv.sku,
        pv.name as variant_name,
        p.name as product_name
      FROM inventory i
      JOIN channels c ON i.channel_id = c.id
      JOIN product_variants pv ON i.product_id = pv.id
      JOIN products p ON pv.product_id = p.id
    `;

    const params = [];
    if (variantId) {
      queryText += ' WHERE i.product_id = ?';
      params.push(variantId);
    }

    queryText += ' ORDER BY p.name, pv.name, c.name';

    const result = await query(queryText, params);
    return result.rows;
  }

  // Check for low stock items
  async getLowStockAlerts(threshold = 10) {
    const result = await query(`
      SELECT
        pv.id,
        pv.sku,
        pv.name as variant_name,
        pv.inventory_quantity,
        p.name as product_name,
        c.name as category_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE pv.inventory_quantity <= ?
      ORDER BY pv.inventory_quantity ASC
    `, [threshold]);

    return result.rows;
  }

  // Reserve inventory for order
  async reserveInventory(orderId, items) {
    const client = await getClient();

    try {
      await client.begin();

      for (const item of items) {
        // Check current inventory
        const inventoryResult = await client.query(
          'SELECT inventory_quantity FROM product_variants WHERE id = ?',
          [item.variantId]
        );

        if (inventoryResult.rows.length === 0) {
          throw new Error(`Variant ${item.variantId} not found`);
        }

        const currentQuantity = inventoryResult.rows[0].inventory_quantity;

        if (currentQuantity < item.quantity) {
          throw new Error(`Insufficient inventory for variant ${item.variantId}`);
        }

        // Reserve inventory (temporarily reduce available quantity)
        await client.query(
          'UPDATE product_variants SET inventory_quantity = inventory_quantity - ? WHERE id = ?',
          [item.quantity, item.variantId]
        );

        // Log reservation
        await this.logInventoryChange(
          item.variantId,
          -item.quantity,
          'RESERVED',
          `Order ${orderId}`,
          client
        );
      }

      await client.commit();
      return { success: true };

    } catch (error) {
      await client.rollback();
      throw error;
    }
  }

  // Release reserved inventory (on order cancellation)
  async releaseInventory(orderId, items) {
    const client = await getClient();

    try {
      await client.begin();

      for (const item of items) {
        // Release inventory
        await client.query(
          'UPDATE product_variants SET inventory_quantity = inventory_quantity + ? WHERE id = ?',
          [item.quantity, item.variantId]
        );

        // Log release
        await this.logInventoryChange(
          item.variantId,
          item.quantity,
          'RELEASED',
          `Order ${orderId} cancelled`,
          client
        );
      }

      await client.commit();
      return { success: true };

    } catch (error) {
      await client.rollback();
      throw error;
    }
  }

  // Log inventory changes for audit trail
  async logInventoryChange(variantId, quantityChange, changeType, reason, client = null) {
    const queryFn = client ? client.query.bind(client) : query;

    await queryFn(`
      INSERT INTO inventory_audit_log (variant_id, quantity_change, change_type, reason, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [variantId, quantityChange, changeType, reason]);
  }

  // Get inventory audit trail
  async getInventoryAuditTrail(variantId = null, limit = 100) {
    let queryText = `
      SELECT
        ial.id,
        ial.variant_id,
        ial.quantity_change,
        ial.change_type,
        ial.reason,
        ial.created_at,
        pv.sku,
        pv.name as variant_name,
        p.name as product_name
      FROM inventory_audit_log ial
      JOIN product_variants pv ON ial.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
    `;

    const params = [];
    if (variantId) {
      queryText += ' WHERE ial.variant_id = ?';
      params.push(variantId);
    }

    queryText += ' ORDER BY ial.created_at DESC LIMIT ?';
    params.push(limit);

    const result = await query(queryText, params);
    return result.rows;
  }

  // Bulk update inventory
  async bulkUpdateInventory(updates) {
    const client = await getClient();

    try {
      await client.begin();

      for (const update of updates) {
        const { variantId, newQuantity, reason = 'Bulk update' } = update;

        // Get current quantity for audit log
        const currentResult = await client.query(
          'SELECT inventory_quantity FROM product_variants WHERE id = ?',
          [variantId]
        );

        if (currentResult.rows.length === 0) {
          console.warn(`Variant ${variantId} not found, skipping`);
          continue;
        }

        const currentQuantity = currentResult.rows[0].inventory_quantity;
        const quantityChange = newQuantity - currentQuantity;

        // Update inventory
        await client.query(
          'UPDATE product_variants SET inventory_quantity = ? WHERE id = ?',
          [newQuantity, variantId]
        );

        // Log change
        await this.logInventoryChange(
          variantId,
          quantityChange,
          'ADJUSTMENT',
          reason,
          client
        );
      }

      await client.commit();
      return { success: true, updated: updates.length };

    } catch (error) {
      await client.rollback();
      throw error;
    }
  }

  // Get stock movement summary
  async getStockMovementSummary(dateFrom = null, dateTo = null) {
    let queryText = `
      SELECT
        ial.variant_id,
        pv.sku,
        pv.name as variant_name,
        p.name as product_name,
        SUM(CASE WHEN ial.quantity_change > 0 THEN ial.quantity_change ELSE 0 END) as stock_in,
        SUM(CASE WHEN ial.quantity_change < 0 THEN ABS(ial.quantity_change) ELSE 0 END) as stock_out,
        COUNT(*) as total_movements,
        MAX(ial.created_at) as last_movement
      FROM inventory_audit_log ial
      JOIN product_variants pv ON ial.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
    `;

    const params = [];
    if (dateFrom && dateTo) {
      queryText += ' WHERE ial.created_at BETWEEN ? AND ?';
      params.push(dateFrom, dateTo);
    }

    queryText += ' GROUP BY ial.variant_id, pv.sku, pv.name, p.name ORDER BY total_movements DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  // Get inventory value
  async getInventoryValue() {
    const result = await query(`
      SELECT
        SUM(pv.inventory_quantity * pv.price) as total_value,
        COUNT(*) as total_items,
        AVG(pv.price) as average_price,
        MIN(pv.price) as min_price,
        MAX(pv.price) as max_price
      FROM product_variants pv
      WHERE pv.inventory_quantity > 0
    `);

    return result.rows[0] || {
      total_value: 0,
      total_items: 0,
      average_price: 0,
      min_price: 0,
      max_price: 0
    };
  }
}

module.exports = new InventoryService();