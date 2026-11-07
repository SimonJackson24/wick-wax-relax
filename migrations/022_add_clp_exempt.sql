-- Migration: 022_add_clp_exempt.sql
-- CLP enforcement model (N-1):
--   clp_exempt = FALSE (default): scented candles/wax melts — CLP data is
--   MANDATORY before the product can go ACTIVE. The admin form enforces
--   it client-side; routes/admin.js enforces it server-side.
--   clp_exempt = TRUE: product explicitly marked as not requiring CLP
--   (e.g. unscented accessories, some bath products). The tick of the
--   box IS the audit trail — who ticked it and when is in the admin
--   session logs.
-- Exempt products render no CLP section on the PDP.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS clp_exempt BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_clp_exempt ON products(clp_exempt) WHERE clp_exempt = FALSE;
