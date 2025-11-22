-- Create product variants table
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  inventory_quantity INTEGER NOT NULL DEFAULT 0 CHECK (inventory_quantity >= 0),
  attributes JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create channel-specific pricing
CREATE TABLE channel_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  UNIQUE(variant_id, channel_id)
);

-- Update inventory table to reference variants instead of products
ALTER TABLE inventory 
DROP CONSTRAINT inventory_product_id_fkey,
ADD CONSTRAINT inventory_variant_id_fkey 
FOREIGN KEY (product_id) REFERENCES product_variants(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_channel_pricing_variant ON channel_pricing(variant_id);