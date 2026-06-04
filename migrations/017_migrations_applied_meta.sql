-- Migration: 017 - migrations_applied tracking table
--
-- Tracks which migrations have been applied, with their SHA-256 checksums.
-- Used by the dynamic migration runner in backend/init-db.js to:
--   1. Detect which migrations need to be applied on a fresh `db:init`
--   2. Detect which migrations have been modified after being applied
--      (a serious bug — modifying an applied migration is silently corrupting)
--   3. Provide a status / rollback CLI

CREATE TABLE IF NOT EXISTS migrations_applied (
  id                SERIAL       PRIMARY KEY,
  filename          TEXT         NOT NULL UNIQUE,
  checksum          TEXT         NOT NULL,
  applied_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  execution_time_ms INTEGER,
  notes             TEXT
);

-- Fast lookup by filename (UNIQUE already creates an implicit index, but be explicit)
CREATE INDEX IF NOT EXISTS idx_migrations_applied_filename ON migrations_applied(filename);

-- Latest-applied lookup
CREATE INDEX IF NOT EXISTS idx_migrations_applied_applied_at ON migrations_applied(applied_at DESC);
