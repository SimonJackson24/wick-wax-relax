-- Migration: 026_shipping_rates.sql
-- Shipping rates (roadmap 1.19-1.22). Until now the store had a
-- free_shipping_threshold SETTING that no code ever read, and order
-- totals contained items only — shipping was never charged.
--
-- Rates are per-zone (UK / EU / WORLDWIDE) and optionally per weight
-- band (min/max grams, NULL = open-ended). free_over_amount makes a
-- rate free once the basket value reaches it — that is how the
-- free_shipping_threshold setting becomes live.
--
-- Seeded with the standard UK Royal Mail services; admin can edit prices,
-- add international rates and adjust weight bands.

CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone VARCHAR(20) NOT NULL DEFAULT 'UK'
    CHECK (zone IN ('UK', 'EU', 'WORLDWIDE')),
  method_code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  min_weight_grams INTEGER CHECK (min_weight_grams IS NULL OR min_weight_grams >= 0),
  max_weight_grams INTEGER CHECK (max_weight_grams IS NULL OR max_weight_grams >= 0),
  free_over_amount NUMERIC(10,2) CHECK (free_over_amount IS NULL OR free_over_amount >= 0),
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (zone, method_code, min_weight_grams, max_weight_grams)
);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_zone ON shipping_rates(zone, is_active, sort_order);

-- Orders record what was charged for shipping: the chosen method, its
-- cost, the zone and the delivery estimate the customer saw. Without
-- these, the shipping cost could not be shown on the order or invoice.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_zone VARCHAR(20) DEFAULT 'UK',
  ADD COLUMN IF NOT EXISTS shipping_estimated_days VARCHAR(20),
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Default UK rates (Royal Mail Tracked). Prices are placeholders —
-- confirm against your negotiated Royal Mail rates before launch.
INSERT INTO shipping_rates
  (zone, method_code, name, description, price, min_weight_grams, max_weight_grams, free_over_amount, estimated_days_min, estimated_days_max, sort_order)
VALUES
  ('UK', 'RM_TRACKED_48', 'Royal Mail Tracked 48', 'Tracked, 2-3 working days', 3.95, NULL, 2000, 50.00, 2, 3, 1),
  ('UK', 'RM_TRACKED_48', 'Royal Mail Tracked 48', 'Tracked, 2-3 working days', 4.95, 2000, NULL, 50.00, 2, 3, 2),
  ('UK', 'RM_TRACKED_24', 'Royal Mail Tracked 24', 'Tracked, next working day', 6.95, NULL, 2000, 50.00, 1, 2, 3),
  ('UK', 'RM_TRACKED_24', 'Royal Mail Tracked 24', 'Tracked, next working day', 7.95, 2000, NULL, 50.00, 1, 2, 4),
  ('UK', 'RM_SPECIAL_DELIVERY', 'Royal Mail Special Delivery', 'Next day guaranteed by 1pm (Mon-Fri)', 12.95, NULL, NULL, NULL, 1, 1, 5),
  ('EU', 'EU_TRACKED', 'International Tracked', '2-5 working days, tracked', 9.95, NULL, NULL, NULL, 2, 5, 6),
  ('WORLDWIDE', 'WW_TRACKED', 'International Tracked', '5-10 working days, tracked', 14.95, NULL, NULL, NULL, 5, 10, 7);
