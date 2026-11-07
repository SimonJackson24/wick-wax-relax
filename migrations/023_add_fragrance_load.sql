-- Migration: 023_add_fragrance_load.sql
-- Fragrance oil load (%) of the finished product. This is NOT a CLP
-- label element — it determines WHICH classification line from the
-- supplier's CLP datasheet applies (suppliers issue different hazard
-- lines per concentration band, and per application: candle vs wax melt
-- vs diffuser). Stored per product so the admin can cross-check the
-- entered CLP data against the correct datasheet row, and the Label Kit
-- prints it as a reference note for batch records.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS fragrance_load_percent NUMERIC(5,2)
    CHECK (fragrance_load_percent IS NULL OR (fragrance_load_percent > 0 AND fragrance_load_percent <= 100));
