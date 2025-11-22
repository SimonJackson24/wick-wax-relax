-- Add image fields to products table
ALTER TABLE products
ADD COLUMN image_url VARCHAR(500),
ADD COLUMN image_alt_text VARCHAR(255),
ADD COLUMN additional_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN seo_title VARCHAR(255),
ADD COLUMN seo_description TEXT,
ADD COLUMN seo_keywords VARCHAR(500),
ADD COLUMN is_featured BOOLEAN DEFAULT false,
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN sort_order INTEGER DEFAULT 0,
ADD COLUMN tags VARCHAR(500),
ADD COLUMN weight_grams INTEGER,
ADD COLUMN dimensions JSONB,
ADD COLUMN care_instructions TEXT,
ADD COLUMN ingredients TEXT,
ADD COLUMN allergens TEXT,
ADD COLUMN country_of_origin VARCHAR(100),
ADD COLUMN brand VARCHAR(100),
ADD COLUMN warranty_info TEXT,
ADD COLUMN return_policy TEXT;

-- Create product images table for better image management
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_brand ON products(brand);

-- Update existing products to be active by default
UPDATE products SET is_active = true WHERE is_active IS NULL;