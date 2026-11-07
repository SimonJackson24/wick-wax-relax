-- Migration: 024_add_rrp.sql
-- Recommended Retail Price (compare-at price) for the PDP buy box:
-- strikethrough framing ("£14.99 ~~£18.99~~ Save 21%"). Optional per
-- product; when NULL the price displays without framing. Must be >=
-- base_price to make sense — enforced with a CHECK so a typo can't
-- render "Save -20%".

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS rrp NUMERIC(10,2)
    CHECK (rrp IS NULL OR rrp >= base_price);
