-- Create suppliers table
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  payment_terms TEXT,
  lead_time_days INTEGER,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create supplier products table (many-to-many relationship)
CREATE TABLE supplier_products (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_sku TEXT,
  supplier_price REAL,
  minimum_order_quantity INTEGER DEFAULT 1,
  lead_time_days INTEGER,
  last_ordered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(supplier_id, product_id)
);

-- Create supplier orders table
CREATE TABLE supplier_orders (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ORDERED', 'SHIPPED', 'RECEIVED', 'CANCELLED')),
  total_amount REAL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create supplier order items table
CREATE TABLE supplier_order_items (
  id TEXT PRIMARY KEY,
  supplier_order_id TEXT NOT NULL REFERENCES supplier_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price REAL,
  total_price REAL,
  received_quantity INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX idx_supplier_orders_supplier ON supplier_orders(supplier_id);
CREATE INDEX idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX idx_supplier_order_items_order ON supplier_order_items(supplier_order_id);
CREATE INDEX idx_supplier_order_items_product ON supplier_order_items(product_id);