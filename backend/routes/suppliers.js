const express = require('express');
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const supplierService = require('../services/supplierService');

const router = express.Router();

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Get all suppliers
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const suppliers = await supplierService.getSuppliers();
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Get supplier by ID
router.get('/:id', authenticateToken, requireAdmin, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const supplier = await supplierService.getSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

// Create supplier
router.post('/', authenticateToken, requireAdmin, [
  body('name').isString().notEmpty(),
  body('email').optional().isEmail(),
  body('phone').optional().isString(),
  body('contact_person').optional().isString(),
  body('address').optional().isString(),
  body('website').optional().isString(),
  body('payment_terms').optional().isString(),
  body('lead_time_days').optional().isInt({ min: 0 }),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const supplier = await supplierService.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/:id', authenticateToken, requireAdmin, [
  param('id').isUUID(),
  body('name').isString().notEmpty(),
  body('email').optional().isEmail(),
  body('phone').optional().isString(),
  body('contact_person').optional().isString(),
  body('address').optional().isString(),
  body('website').optional().isString(),
  body('payment_terms').optional().isString(),
  body('lead_time_days').optional().isInt({ min: 0 }),
  body('notes').optional().isString(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier
router.delete('/:id', authenticateToken, requireAdmin, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await supplierService.deleteSupplier(req.params.id);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

// Get supplier products
router.get('/:id/products', authenticateToken, requireAdmin, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const products = await supplierService.getSupplierProducts(req.params.id);
    res.json(products);
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    res.status(500).json({ error: 'Failed to fetch supplier products' });
  }
});

// Add product to supplier
router.post('/:id/products', authenticateToken, requireAdmin, [
  param('id').isUUID(),
  body('product_id').isUUID(),
  body('variant_id').optional().isUUID(),
  body('supplier_sku').optional().isString(),
  body('supplier_price').isFloat({ min: 0 }),
  body('minimum_order_quantity').optional().isInt({ min: 1 }),
  body('lead_time_days').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await supplierService.addSupplierProduct(req.params.id, req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error adding supplier product:', error);
    res.status(500).json({ error: 'Failed to add supplier product' });
  }
});

// Update supplier product
router.put('/:supplierId/products/:productId', authenticateToken, requireAdmin, [
  param('supplierId').isUUID(),
  param('productId').isUUID(),
  body('supplier_sku').optional().isString(),
  body('supplier_price').isFloat({ min: 0 }),
  body('minimum_order_quantity').optional().isInt({ min: 1 }),
  body('lead_time_days').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await supplierService.updateSupplierProduct(req.params.supplierId, req.params.productId, req.body);
    res.json(product);
  } catch (error) {
    console.error('Error updating supplier product:', error);
    res.status(500).json({ error: 'Failed to update supplier product' });
  }
});

// Remove product from supplier
router.delete('/:supplierId/products/:productId', authenticateToken, requireAdmin, [
  param('supplierId').isUUID(),
  param('productId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await supplierService.removeSupplierProduct(req.params.supplierId, req.params.productId);
    res.json({ message: 'Product removed from supplier successfully' });
  } catch (error) {
    console.error('Error removing supplier product:', error);
    res.status(500).json({ error: 'Failed to remove supplier product' });
  }
});

// Get supplier orders
router.get('/:id/orders', authenticateToken, requireAdmin, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orders = await supplierService.getSupplierOrders(req.params.id);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({ error: 'Failed to fetch supplier orders' });
  }
});

// Create supplier order
router.post('/:id/orders', authenticateToken, requireAdmin, [
  param('id').isUUID(),
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').isUUID(),
  body('items.*.variant_id').optional().isUUID(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.unit_price').isFloat({ min: 0 }),
  body('expected_delivery_date').optional().isISO8601(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderData = { ...req.body, supplier_id: req.params.id };
    const order = await supplierService.createSupplierOrder(orderData);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating supplier order:', error);
    res.status(500).json({ error: 'Failed to create supplier order' });
  }
});

module.exports = router;