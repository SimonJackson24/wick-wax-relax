-- Product categories for Wick Wax Relax - SQLite compatible version

-- Create product categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create product-category relationship
CREATE TABLE IF NOT EXISTS product_categories (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Create category attributes for filtering
CREATE TABLE IF NOT EXISTS category_attributes (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  filter_type TEXT NOT NULL,
  min_value REAL,
  max_value REAL,
  sort_order INTEGER DEFAULT 0
);

-- Insert core categories
INSERT INTO categories (id, name, slug, description, display_order) VALUES
('wax-melts-1', 'Wax Melts', 'wax-melts', 'Hand-poured soy wax melts for electric warmers', 1),
('candles-1', 'Candles', 'candles', 'Premium soy wax candles with wooden wicks', 2),
('bath-bombs-1', 'Bath Bombs', 'bath-bombs', 'Fizzy bath bombs with therapeutic essential oils', 3),
('diffusers-1', 'Diffusers', 'diffusers', 'Reed diffusers for continuous fragrance', 4)
ON CONFLICT(slug) DO NOTHING;

-- Insert subcategories
INSERT INTO categories (id, name, slug, description, parent_id, display_order) VALUES
('floral-1', 'Floral Scents', 'floral', 'Rose, jasmine, and lavender blends', 
 'wax-melts-1', 1),
('citrus-1', 'Citrus Scents', 'citrus', 'Lemon, orange, and grapefruit blends', 
 'wax-melts-1', 2),
('seasonal-1', 'Seasonal Collections', 'seasonal', 'Limited edition holiday scents', 
 'wax-melts-1', 3)
ON CONFLICT(slug) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);