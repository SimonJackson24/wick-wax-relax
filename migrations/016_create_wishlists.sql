-- Migration: Create wishlists table for persistent user wishlists/favorites
-- This enables cross-device wishlist sync and proper data persistence

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate wishlist entries
  CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
);

-- Index for efficient user wishlist lookups
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX idx_wishlists_created_at ON wishlists(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE wishlists IS 'Stores user product wishlists/favorites for cross-device sync';
COMMENT ON COLUMN wishlists.user_id IS 'The user who owns this wishlist item';
COMMENT ON COLUMN wishlists.product_id IS 'The product that was favorited';
COMMENT ON COLUMN wishlists.variant_id IS 'Optional specific variant that was favorited';
