-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sales channels table
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('AMAZON', 'PWA', 'ETSY')),
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product catalog
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scent_profile JSONB NOT NULL,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory tracking
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, channel_id)
);

-- Create orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id),
  external_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  order_date TIMESTAMPTZ DEFAULT NOW(),
  total NUMERIC(10,2) NOT NULL,
  UNIQUE(channel_id, external_id)
);

-- Create payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('APPLE_PAY', 'GOOGLE_PAY', 'KLARNA', 'CLEARPAY')),
  revolut_payment_id VARCHAR(255) NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCEEDED', 'REQUIRES_ACTION', 'CANCELED', 'FAILED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_channel ON inventory(channel_id);
CREATE INDEX idx_orders_channel ON orders(channel_id);
CREATE INDEX idx_payments_order ON payments(order_id);