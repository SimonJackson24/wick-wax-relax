const { query, getClient } = require('../config/database');

class SupplierService {
  // Get all suppliers
  async getSuppliers() {
    const result = await query(`
      SELECT
        s.*,
        COUNT(sp.id) as product_count,
        MAX(sp.last_ordered_at) as last_ordered_at
      FROM suppliers s
      LEFT JOIN supplier_products sp ON s.id = sp.supplier_id
      GROUP BY s.id
      ORDER BY s.name
    `);
    return result.rows;
  }

  // Get supplier by ID
  async getSupplierById(id) {
    const result = await query('SELECT * FROM suppliers WHERE id = ?', [id]);
    return result.rows[0];
  }

  // Create new supplier
  async createSupplier(supplierData) {
    const { name, contact_person, email, phone, address, website, payment_terms, lead_time_days, notes } = supplierData;

    const result = await query(`
      INSERT INTO suppliers (name, contact_person, email, phone, address, website, payment_terms, lead_time_days, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, contact_person, email, phone, address, website, payment_terms, lead_time_days, notes]);

    return { id: result.lastID, ...supplierData };
  }

  // Update supplier
  async updateSupplier(id, supplierData) {
    const { name, contact_person, email, phone, address, website, payment_terms, lead_time_days, notes, is_active } = supplierData;

    await query(`
      UPDATE suppliers
      SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, website = ?,
          payment_terms = ?, lead_time_days = ?, notes = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, contact_person, email, phone, address, website, payment_terms, lead_time_days, notes, is_active, id]);

    return { id, ...supplierData };
  }

  // Delete supplier
  async deleteSupplier(id) {
    await query('DELETE FROM suppliers WHERE id = ?', [id]);
    return { success: true };
  }

  // Get supplier products
  async getSupplierProducts(supplierId) {
    const result = await query(`
      SELECT
        sp.*,
        p.name as product_name,
        pv.name as variant_name,
        pv.sku
      FROM supplier_products sp
      JOIN products p ON sp.product_id = p.id
      LEFT JOIN product_variants pv ON sp.variant_id = pv.id
      WHERE sp.supplier_id = ?
      ORDER BY p.name, pv.name
    `, [supplierId]);
    return result.rows;
  }

  // Add product to supplier
  async addSupplierProduct(supplierId, productData) {
    const { product_id, variant_id, supplier_sku, supplier_price, minimum_order_quantity, lead_time_days } = productData;

    const result = await query(`
      INSERT INTO supplier_products (supplier_id, product_id, variant_id, supplier_sku, supplier_price, minimum_order_quantity, lead_time_days)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [supplierId, product_id, variant_id, supplier_sku, supplier_price, minimum_order_quantity, lead_time_days]);

    return { id: result.lastID, ...productData };
  }

  // Update supplier product
  async updateSupplierProduct(supplierId, productId, productData) {
    const { supplier_sku, supplier_price, minimum_order_quantity, lead_time_days } = productData;

    await query(`
      UPDATE supplier_products
      SET supplier_sku = ?, supplier_price = ?, minimum_order_quantity = ?, lead_time_days = ?
      WHERE supplier_id = ? AND product_id = ?
    `, [supplier_sku, supplier_price, minimum_order_quantity, lead_time_days, supplierId, productId]);

    return { supplierId, productId, ...productData };
  }

  // Remove product from supplier
  async removeSupplierProduct(supplierId, productId) {
    await query('DELETE FROM supplier_products WHERE supplier_id = ? AND product_id = ?', [supplierId, productId]);
    return { success: true };
  }

  // Get supplier orders
  async getSupplierOrders(supplierId = null) {
    let queryText = `
      SELECT
        so.*,
        s.name as supplier_name,
        COUNT(soi.id) as item_count
      FROM supplier_orders so
      JOIN suppliers s ON so.supplier_id = s.id
      LEFT JOIN supplier_order_items soi ON so.id = soi.supplier_order_id
    `;

    const params = [];
    if (supplierId) {
      queryText += ' WHERE so.supplier_id = ?';
      params.push(supplierId);
    }

    queryText += ' GROUP BY so.id, s.name ORDER BY so.created_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  // Create supplier order
  async createSupplierOrder(orderData) {
    const client = await getClient();

    try {
      await client.begin();

      const { supplier_id, items, expected_delivery_date, notes } = orderData;

      // Calculate total
      let total = 0;
      for (const item of items) {
        total += item.quantity * item.unit_price;
      }

      // Create order
      const orderResult = await client.query(`
        INSERT INTO supplier_orders (supplier_id, order_number, total_amount, expected_delivery_date, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [supplier_id, `SO-${Date.now()}`, total, expected_delivery_date, notes]);

      const orderId = orderResult.lastID;

      // Create order items
      for (const item of items) {
        await client.query(`
          INSERT INTO supplier_order_items (supplier_order_id, product_id, variant_id, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [orderId, item.product_id, item.variant_id, item.quantity, item.unit_price, item.quantity * item.unit_price]);
      }

      await client.commit();
      return { id: orderId, ...orderData };
    } catch (error) {
      await client.rollback();
      throw error;
    }
  }

  // Update supplier order status
  async updateSupplierOrderStatus(orderId, status, actualDeliveryDate = null) {
    await query(`
      UPDATE supplier_orders
      SET status = ?, actual_delivery_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, actualDeliveryDate, orderId]);

    return { id: orderId, status, actual_delivery_date: actualDeliveryDate };
  }
}

module.exports = new SupplierService();