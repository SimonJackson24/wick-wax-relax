-- Performance optimization indexes for frequently queried columns

-- Products table indexes (only for existing columns)
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);

-- Product variants indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_inventory_quantity ON product_variants(inventory_quantity) WHERE inventory_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_product_variants_price ON product_variants(price);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_display_order_name ON categories(display_order, name);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- User addresses indexes
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_type_default ON user_addresses(user_id, address_type, is_default DESC);
CREATE INDEX IF NOT EXISTS idx_user_addresses_created_at ON user_addresses(created_at DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_status_order_date ON orders(status, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_channel_status ON orders(channel_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_orders_status_channel_order_date ON orders(status, channel_id, order_date DESC);