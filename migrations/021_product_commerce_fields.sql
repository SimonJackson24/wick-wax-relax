-- Migration: 021_product_commerce_fields.sql
-- Completes the product data model for launch (roadmap 1.5, 1.6, 1.50-completeness).
--
-- VAT (1.5 / N-4): vat_rate is stored per product for accounting. The
-- display policy is the `vat_registered` platform setting (flip-of-switch):
--   OFF  (pre-registration): base_price displays as-is, no VAT line anywhere.
--   ON   (post-registration): the SAME base_price is treated as VAT-inclusive;
--        invoices/admin show the ex-VAT amount + VAT at vat_rate.
-- Prices are always entered as what the customer pays — no re-entry on the
-- day registration flips.
--
-- CLP (1.6 / N-1): EU Regulation (EC) 1272/2008 — scented candles legally
-- require allergen disclosures, hazard pictograms, signal word, H/P
-- statements and (for EU) a UFI on the label and packaging. Stored per
-- product, rendered on the PDP and packing slip.
--
-- SEO (1.50): per-product meta overrides. When absent, the storefront
-- falls back to name/description.
--
-- Shipping: weight/dimensions feed carrier rate calculation (1.19-1.23).
--
-- Lifecycle: status gates storefront visibility (DRAFT never appears).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00
    CHECK (vat_rate >= 0 AND vat_rate <= 100),
  ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS weight_grams INTEGER CHECK (weight_grams IS NULL OR weight_grams > 0),
  ADD COLUMN IF NOT EXISTS dimensions_cm JSONB,
  ADD COLUMN IF NOT EXISTS clp_allergens JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS clp_hazard_pictograms JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS clp_signal_word VARCHAR(10)
    CHECK (clp_signal_word IS NULL OR clp_signal_word IN ('DANGER', 'WARNING')),
  ADD COLUMN IF NOT EXISTS clp_hazard_statements JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS clp_precautionary_statements JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ufi_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS clp_responsible_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Backfill: every existing product becomes ACTIVE (they were all visible
-- before the status column existed).
UPDATE products SET status = 'ACTIVE' WHERE status IS NULL;

-- VAT display policy — the flip-of-switch. vat_registration_number is
-- deliberately empty until HMRC issues one; it is displayed on invoices
-- the moment it is set + vat_registered is true.
INSERT INTO platform_settings (id, category, key, value, description, validation_rules) VALUES
  ('gen-vat-registered', 'general', 'vat_registered', 'false',
   'VAT registration switch. OFF: prices displayed as-entered, no VAT lines. ON: the same prices are treated as VAT-inclusive and invoices show the breakdown.',
   '{"type": "boolean"}'),
  ('gen-vat-number', 'general', 'vat_registration_number', '',
   'HMRC VAT registration number (e.g. GB123456789). Leave empty until issued.',
   '{"type": "string", "pattern": "^(|GB[0-9]{9}|GB[0-9]{12})$"}')
ON CONFLICT (id) DO NOTHING;

-- Correct the seeded contact email to the canonical domain (the seed
-- predates the .co.uk decision).
UPDATE platform_settings
   SET value = 'info@wickwaxrelax.co.uk'
 WHERE id = 'gen-contact-email' AND value LIKE '%wickwaxrelax.com';
