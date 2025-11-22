-- Initial schema for Wick Wax Relax - SQLite compatible version

-- Create sales channels table
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create product catalog
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  scent_profile TEXT NOT NULL,
  base_price REAL NOT NULL CHECK (base_price > 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory tracking
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  last_synced DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, channel_id)
);

-- Create orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id),
  external_id TEXT NOT NULL,
  status TEXT NOT NULL,
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total REAL NOT NULL,
  UNIQUE(channel_id, external_id)
);

-- Create payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  revolut_payment_id TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL,
  status TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_channel ON inventory(channel_id);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- Insert default channels
INSERT INTO channels (id, name, api_key) VALUES 
('pwa-channel', 'PWA', 'pwa-api-key'),
('amazon-channel', 'AMAZON', 'amazon-api-key'),
('etsy-channel', 'ETSY', 'etsy-api-key')
ON CONFLICT(name) DO NOTHING;