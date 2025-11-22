-- Create inventory audit log table
CREATE TABLE inventory_audit_log (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('RESERVED', 'RELEASED', 'ADJUSTMENT', 'SYNC')),
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_inventory_audit_variant ON inventory_audit_log(variant_id);
CREATE INDEX idx_inventory_audit_created ON inventory_audit_log(created_at);

-- Create order status history table
CREATE TABLE order_status_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT, -- User who changed the status (nullable for system changes)
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created ON order_status_history(created_at);