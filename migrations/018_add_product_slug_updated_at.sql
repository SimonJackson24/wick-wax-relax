-- 018_add_product_slug_updated_at.sql
-- Fixes schema drift found 2026-11-07 (three bugs, one migration):
--   1. backend/routes/products.js queries p.slug in 8 places (including
--      GET /api/products/slug/:slug) but no migration ever created the
--      column -> every product listing failed with "column does not exist"
--      against a migration-built database.
--   2. backend/services/product.js updateProduct() sets updated_at but the
--      products table never had that column.
--   3. Both fixed here so the app-level slug generation added alongside this
--      migration has a home.
-- Idempotent: safe to re-run (ADD COLUMN IF NOT EXISTS, guarded UPDATEs,
-- SET NOT NULL is a no-op on re-run, CREATE UNIQUE INDEX IF NOT EXISTS).

ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill slug from name: lowercase, collapse non-alphanumeric runs to a
-- single hyphen, trim leading/trailing hyphens.
UPDATE products
SET slug = TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Deduplicate collisions deterministically (oldest by created_at keeps the
-- bare slug, later duplicates get -2, -3, ...). Pre-launch assumption: the
-- catalogue is empty or tiny, so a natural "lavender-2" colliding with a
-- suffixed "lavender-2" is not expected; app-level generation (product.js
-- uniqueSlug) enforces uniqueness from here on.
WITH ranked AS (
  SELECT id, slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at, id) AS rn
  FROM products
)
UPDATE products p
SET slug = r.slug || '-' || r.rn
FROM ranked r
WHERE p.id = r.id
  AND r.rn > 1;

ALTER TABLE products ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
