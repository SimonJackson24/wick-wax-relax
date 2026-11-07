-- Migration: 028_create_reviews_table.sql
-- The reviews table was queried by routes/products.js (list + submit with
-- verified_purchase) and ALTERed by 026_review_photos.sql, but no migration
-- ever CREATED it — so on a migration-built database every reviews call
-- failed with 'relation "reviews" does not exist', and the PDP review
-- section (plus the star-rating JSON-LD) had nothing to read.
--
-- created here to match exactly what the code expects:
--   - unique (product_id, user_id) — the submit route upserts on it
--   - verified_purchase — set when the reviewer has a matching order
--   - helpful_count — "N found this helpful"
--   - photo_url — added by 026

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  review_text TEXT,
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
