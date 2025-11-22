-- Create product categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product-category relationship
CREATE TABLE product_categories (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Create category attributes for filtering
CREATE TABLE category_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  filter_type VARCHAR(20) NOT NULL CHECK (filter_type IN ('RANGE', 'SELECT', 'BOOLEAN')),
  min_value NUMERIC(10,2),
  max_value NUMERIC(10,2),
  sort_order INTEGER DEFAULT 0
);

-- Insert core categories
INSERT INTO categories (name, slug, description, display_order) VALUES
('Wax Melts', 'wax-melts', 'Hand-poured soy wax melts for electric warmers', 1),
('Candles', 'candles', 'Premium soy wax candles with wooden wicks', 2),
('Bath Bombs', 'bath-bombs', 'Fizzy bath bombs with therapeutic essential oils', 3),
('Diffusers', 'diffusers', 'Reed diffusers for continuous fragrance', 4);

-- Insert subcategories
INSERT INTO categories (name, slug, description, parent_id, display_order) VALUES
('Floral Scents', 'floral', 'Rose, jasmine, and lavender blends', 
 (SELECT id FROM categories WHERE slug = 'wax-melts'), 1),
('Citrus Scents', 'citrus', 'Lemon, orange, and grapefruit blends', 
 (SELECT id FROM categories WHERE slug = 'wax-melts'), 2),
('Seasonal Collections', 'seasonal', 'Limited edition holiday scents', 
 (SELECT id FROM categories WHERE slug = 'wax-melts'), 3);

-- Configure category attributes
INSERT INTO category_attributes (category_id, name, display_name, filter_type, min_value, max_value) VALUES
-- Wax Melts attributes
((SELECT id FROM categories WHERE slug = 'wax-melts'), 'burn_time', 'Burn Time (hours)', 'RANGE', 8, 20),
((SELECT id FROM categories WHERE slug = 'wax-melts'), 'scent_strength', 'Fragrance Intensity', 'SELECT', NULL, NULL),
((SELECT id FROM categories WHERE slug = 'wax-melts'), 'vegan', 'Vegan Formula', 'BOOLEAN', NULL, NULL),

-- Candles attributes
((SELECT id FROM categories WHERE slug = 'candles'), 'burn_time', 'Burn Time (hours)', 'RANGE', 40, 100),
((SELECT id FROM categories WHERE slug = 'candles'), 'size', 'Size (oz)', 'RANGE', 8, 16),
((SELECT id FROM categories WHERE slug = 'candles'), 'cruelty_free', 'Cruelty Free', 'BOOLEAN', NULL, NULL),

-- Bath Bombs attributes
((SELECT id FROM categories WHERE slug = 'bath-bombs'), 'effervescence', 'Fizziness Level', 'SELECT', NULL, NULL),
((SELECT id FROM categories WHERE slug = 'bath-bombs'), 'skin_type', 'Skin Type', 'SELECT', NULL, NULL),
((SELECT id FROM categories WHERE slug = 'bath-bombs'), 'vegan', 'Vegan Formula', 'BOOLEAN', NULL, NULL);

-- Create indexes for performance
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_product_categories_product ON product_categories(product_id);
CREATE INDEX idx_product_categories_category ON product_categories(category_id);