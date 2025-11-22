-- Create hierarchical category structure for Wick Wax Relax
-- This migration creates parent categories (Seasons, Collections, Aroma Profiles)
-- with appropriate subcategories beneath them

-- First, let's create a new table for the hierarchical structure
-- We'll keep the existing categories table for backward compatibility
-- but add a new table that better supports our hierarchical structure

CREATE TABLE IF NOT EXISTS category_hierarchy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(255),
  parent_id UUID REFERENCES category_hierarchy(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0, -- 0 for root, 1 for parent categories, 2 for subcategories
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_category_hierarchy_parent ON category_hierarchy(parent_id);
CREATE INDEX idx_category_hierarchy_level ON category_hierarchy(level);
CREATE INDEX idx_category_hierarchy_slug ON category_hierarchy(slug);
CREATE INDEX idx_category_hierarchy_active ON category_hierarchy(is_active);

-- Create a junction table to map the new hierarchy to the old categories
-- This allows us to maintain backward compatibility while transitioning
CREATE TABLE IF NOT EXISTS category_mapping (
  old_category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  new_category_id UUID REFERENCES category_hierarchy(id) ON DELETE CASCADE,
  PRIMARY KEY (old_category_id, new_category_id)
);

-- Insert the root parent categories
INSERT INTO category_hierarchy (name, slug, description, level, display_order) VALUES
('Seasons', 'seasons', 'Seasonal scented melts that capture the essence of each time of year', 1, 1),
('Collections', 'collections', 'Curated collections of our most popular and special edition scented melts', 1, 2),
('Aroma Profiles', 'aroma-profiles', 'Scented melts organized by their aromatic characteristics and fragrance families', 1, 3);

-- Insert Seasons subcategories
INSERT INTO category_hierarchy (name, slug, description, parent_id, level, display_order) VALUES
('Spring', 'spring', 'Fresh and floral scents that capture the renewal of springtime', 
 (SELECT id FROM category_hierarchy WHERE slug = 'seasons'), 2, 1),
('Summer', 'summer', 'Bright and breezy scents that evoke warm summer days', 
 (SELECT id FROM category_hierarchy WHERE slug = 'seasons'), 2, 2),
('Autumn', 'autumn', 'Warm and spicy scents that reflect the cozy atmosphere of autumn', 
 (SELECT id FROM category_hierarchy WHERE slug = 'seasons'), 2, 3),
('Winter', 'winter', 'Comforting and rich scents that bring warmth to cold winter days', 
 (SELECT id FROM category_hierarchy WHERE slug = 'seasons'), 2, 4);

-- Insert Collections subcategories
INSERT INTO category_hierarchy (name, slug, description, parent_id, level, display_order) VALUES
('Limited Edition', 'limited-edition', 'Exclusive seasonal and special edition scented melts available for a limited time', 
 (SELECT id FROM category_hierarchy WHERE slug = 'collections'), 2, 1),
('Best Sellers', 'best-sellers', 'Our most popular scented melts that customers love', 
 (SELECT id FROM category_hierarchy WHERE slug = 'collections'), 2, 2),
('Signature Series', 'signature-series', 'Our premium collection of carefully crafted signature scents', 
 (SELECT id FROM category_hierarchy WHERE slug = 'collections'), 2, 3);

-- Insert Aroma Profiles subcategories
INSERT INTO category_hierarchy (name, slug, description, parent_id, level, display_order) VALUES
('Floral', 'floral', 'Delicate and romantic floral scents featuring rose, jasmine, lavender and more', 
 (SELECT id FROM category_hierarchy WHERE slug = 'aroma-profiles'), 2, 1),
('Fruity', 'fruity', 'Sweet and juicy fruit scents that brighten any space', 
 (SELECT id FROM category_hierarchy WHERE slug = 'aroma-profiles'), 2, 2),
('Spicy', 'spicy', 'Warm and exotic spice blends that add depth and comfort', 
 (SELECT id FROM category_hierarchy WHERE slug = 'aroma-profiles'), 2, 3),
('Fresh', 'fresh', 'Clean and invigorating scents that evoke freshness and clarity', 
 (SELECT id FROM category_hierarchy WHERE slug = 'aroma-profiles'), 2, 4),
('Woody', 'woody', 'Earthy and grounding woody scents with notes of sandalwood, cedar and more', 
 (SELECT id FROM category_hierarchy WHERE slug = 'aroma-profiles'), 2, 5);

-- Create a function to get the full category path
CREATE OR REPLACE FUNCTION get_category_path(category_id UUID)
RETURNS TABLE(path_id UUID, path_name VARCHAR, path_level INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    SELECT 
      id, 
      name, 
      level,
      ARRAY[id] as id_path,
      ARRAY[name] as name_path
    FROM category_hierarchy
    WHERE id = category_id
    
    UNION ALL
    
    SELECT 
      c.id,
      c.name,
      c.level,
      c.id || ct.id_path,
      c.name || ct.name_path
    FROM category_hierarchy c
    JOIN category_tree ct ON c.id = ct.parent_id
  )
  SELECT 
    UNNEST(id_path) as path_id,
    UNNEST(name_path) as path_name,
    UNNEST(ARRAY(SELECT generate_series(1, array_length(id_path, 1)))) as path_level
  FROM category_tree
  ORDER BY path_level;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_category_hierarchy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER category_hierarchy_updated_at
  BEFORE UPDATE ON category_hierarchy
  FOR EACH ROW
  EXECUTE FUNCTION update_category_hierarchy_updated_at();

-- Create a view to get categories with product counts
CREATE OR REPLACE VIEW categories_with_counts AS
SELECT 
  ch.id,
  ch.name,
  ch.slug,
  ch.description,
  ch.image_url,
  ch.parent_id,
  ch.level,
  ch.display_order,
  ch.is_active,
  ch.meta_title,
  ch.meta_description,
  ch.created_at,
  ch.updated_at,
  COUNT(DISTINCT p.id) as product_count
FROM category_hierarchy ch
LEFT JOIN category_mapping cm ON ch.id = cm.new_category_id
LEFT JOIN product_categories pc ON cm.old_category_id = pc.category_id
LEFT JOIN products p ON pc.product_id = p.id
WHERE ch.is_active = TRUE
GROUP BY ch.id, ch.name, ch.slug, ch.description, ch.image_url, ch.parent_id, 
         ch.level, ch.display_order, ch.is_active, ch.meta_title, ch.meta_description,
         ch.created_at, ch.updated_at
ORDER BY ch.level, ch.display_order, ch.name;

-- Create a view to get hierarchical categories with their children
CREATE OR REPLACE VIEW hierarchical_categories AS
SELECT 
  parent.id as parent_id,
  parent.name as parent_name,
  parent.slug as parent_slug,
  parent.description as parent_description,
  parent.image_url as parent_image_url,
  parent.level as parent_level,
  parent.display_order as parent_display_order,
  parent.is_active as parent_is_active,
  parent.meta_title as parent_meta_title,
  parent.meta_description as parent_meta_description,
  parent.created_at as parent_created_at,
  parent.updated_at as parent_updated_at,
  parent.product_count as parent_product_count,
  child.id as child_id,
  child.name as child_name,
  child.slug as child_slug,
  child.description as child_description,
  child.image_url as child_image_url,
  child.level as child_level,
  child.display_order as child_display_order,
  child.is_active as child_is_active,
  child.meta_title as child_meta_title,
  child.meta_description as child_meta_description,
  child.created_at as child_created_at,
  child.updated_at as child_updated_at,
  child.product_count as child_product_count
FROM categories_with_counts parent
LEFT JOIN categories_with_counts child ON parent.id = child.parent_id
WHERE parent.is_active = TRUE
ORDER BY parent.level, parent.display_order, child.display_order;

-- Create a junction table to directly link products to the new hierarchy
CREATE TABLE IF NOT EXISTS product_category_hierarchy (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES category_hierarchy(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Create indexes for the new junction table
CREATE INDEX idx_product_category_hierarchy_product ON product_category_hierarchy(product_id);
CREATE INDEX idx_product_category_hierarchy_category ON product_category_hierarchy(category_id);

-- Create a function to migrate existing product-category relationships to the new hierarchy
CREATE OR REPLACE FUNCTION migrate_product_categories() RETURNS VOID AS $$
DECLARE
  product_record RECORD;
  category_record RECORD;
  new_category_id UUID;
BEGIN
  -- Iterate through all existing product-category relationships
  FOR product_record IN 
    SELECT DISTINCT product_id, category_id FROM product_categories
  LOOP
    -- Find the corresponding new category in the hierarchy
    -- First, try to find an exact match by name
    SELECT id INTO new_category_id 
    FROM category_hierarchy 
    WHERE LOWER(name) = (
      SELECT LOWER(name) FROM categories WHERE id = product_record.category_id
    ) AND level = 2;
    
    -- If no exact match found, try to map based on existing category patterns
    IF new_category_id IS NULL THEN
      -- Map seasonal collections
      IF EXISTS (SELECT 1 FROM categories WHERE id = product_record.category_id AND name LIKE '%Seasonal%') THEN
        SELECT id INTO new_category_id 
        FROM category_hierarchy 
        WHERE parent_id = (SELECT id FROM category_hierarchy WHERE slug = 'seasons') 
        AND level = 2
        LIMIT 1;
      -- Map floral scents
      ELSIF EXISTS (SELECT 1 FROM categories WHERE id = product_record.category_id AND name LIKE '%Floral%') THEN
        SELECT id INTO new_category_id FROM category_hierarchy WHERE slug = 'floral';
      -- Map citrus scents
      ELSIF EXISTS (SELECT 1 FROM categories WHERE id = product_record.category_id AND name LIKE '%Citrus%') THEN
        SELECT id INTO new_category_id FROM category_hierarchy WHERE slug = 'fresh';
      END IF;
    END IF;
    
    -- If we found a matching new category, create the relationship
    IF new_category_id IS NOT NULL THEN
      INSERT INTO product_category_hierarchy (product_id, category_id)
      VALUES (product_record.product_id, new_category_id)
      ON CONFLICT DO NOTHING;
      
      -- Also create the mapping between old and new categories
      INSERT INTO category_mapping (old_category_id, new_category_id)
      VALUES (product_record.category_id, new_category_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a view to get products with their hierarchical categories
CREATE OR REPLACE VIEW products_with_hierarchical_categories AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.scent_profile,
  p.base_price,
  p.created_at,
  p.updated_at,
  ch.id as category_id,
  ch.name as category_name,
  ch.slug as category_slug,
  ch.description as category_description,
  ch.level as category_level,
  parent_ch.name as parent_category_name,
  parent_ch.slug as parent_category_slug,
  grandparent_ch.name as grandparent_category_name,
  grandparent_ch.slug as grandparent_category_slug
FROM products p
JOIN product_category_hierarchy pch ON p.id = pch.product_id
JOIN category_hierarchy ch ON pch.category_id = ch.id
LEFT JOIN category_hierarchy parent_ch ON ch.parent_id = parent_ch.id
LEFT JOIN category_hierarchy grandparent_ch ON parent_ch.parent_id = grandparent_ch.id
WHERE ch.is_active = TRUE;

-- Create a function to get all categories in hierarchical order
CREATE OR REPLACE FUNCTION get_hierarchical_categories()
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  description TEXT,
  image_url VARCHAR,
  parent_id UUID,
  level INTEGER,
  display_order INTEGER,
  is_active BOOLEAN,
  meta_title VARCHAR,
  meta_description VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  product_count BIGINT,
  path TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    SELECT 
      ch.*,
      0 as depth,
      ARRAY[ch.name] as path_names,
      ARRAY[ch.slug] as path_slugs,
      cwc.product_count
    FROM category_hierarchy ch
    LEFT JOIN categories_with_counts cwc ON ch.id = cwc.id
    WHERE ch.parent_id IS NULL AND ch.is_active = TRUE
    
    UNION ALL
    
    SELECT 
      ch.*,
      ct.depth + 1,
      ct.path_names || ch.name,
      ct.path_slugs || ch.slug,
      cwc.product_count
    FROM category_hierarchy ch
    JOIN category_tree ct ON ch.parent_id = ct.id
    LEFT JOIN categories_with_counts cwc ON ch.id = cwc.id
    WHERE ch.is_active = TRUE
  )
  SELECT 
    ct.*,
    ARRAY_TO_STRING(ct.path_names, ' > ') as path
  FROM category_tree ct
  ORDER BY ct.level, ct.display_order, ct.name;
END;
$$ LANGUAGE plpgsql;