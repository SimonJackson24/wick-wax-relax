-- Migration: 019_admin_totp_2fa.sql
-- (Renamed from 0001 — that prefix sorted it BEFORE 001_initial_schema /
-- 004_user_accounts, so it ALTERed `users` before the table existed and the
-- runner's error tolerance silently skipped every statement. Renamed so it
-- runs after 004.)
--
-- Adds columns required for TOTP-based two-factor authentication for admin
-- accounts.
--
-- mfa_secret: the TOTP shared secret (base32). Stored in plaintext because
--   the server needs to use it to verify codes; this is the standard pattern
--   (RFC 6238). The secret is generated when the admin enrols and shown once
--   in the form of a QR code.
--
-- mfa_enabled: false until the admin successfully verifies a TOTP code from
--   their authenticator app. The user cannot access any /api/admin/* endpoint
--   until this is true.
--
-- mfa_recovery_codes_hashed: array of bcrypt hashes of the single-use recovery
--   codes generated at enrollment. Each code is consumed (deleted) on use so
--   an attacker who steals the row cannot replay codes.
--
-- mfa_enrolled_at: timestamp for audit / UI display.
--
-- Idempotent: every ALTER/CREATE uses IF NOT EXISTS.
--
-- No BEGIN/COMMIT wrapper: this runner executes each statement with
-- autocommit by design (see init-db.js applyMigration). A file-level
-- transaction wrapper is dangerous here — one failing statement (this file
-- originally compared the BOOLEAN is_admin to the integer 1, which Postgres
-- rejects) aborts the transaction, and COMMIT then rolls back statements
-- that had already "succeeded", while the runner still records the file as
-- applied. splitStatements now also strips stray BEGIN/COMMIT as a guard.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mfa_recovery_codes_hashed TEXT,
  ADD COLUMN IF NOT EXISTS mfa_enrolled_at TIMESTAMP WITH TIME ZONE;

-- Backfill: any user that is already admin and has no mfa_secret must
-- enrol on next login. The requireMfaComplete middleware enforces this.
UPDATE users
   SET mfa_enabled = FALSE
 WHERE is_admin = TRUE
   AND mfa_secret IS NULL;

-- Index for the admin-lookup query in the auth middleware.
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled) WHERE mfa_enabled = TRUE;
