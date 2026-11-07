-- Migration: 020_add_audit_log_and_reset_tokens.sql
-- Creates schema that application code has queried since the security
-- hardening era but that no migration ever created (found by running the
-- Jest suite against a real migration-built database — task 1.9):
--
--   * audit_log: backend/services/auditService.js INSERTs security events
--     (failed logins, admin actions) and reads them for the admin audit
--     view + GDPR export. Every insert failed with
--     'relation "audit_log" does not exist'.
--   * users.reset_token / reset_token_expires: the password-reset flow
--     (routes/auth.js) stores the SHA-256 hash of the reset token and its
--     expiry on the user row. The flow 500'd on every reset request.
--
-- Idempotent (IF NOT EXISTS throughout). No BEGIN/COMMIT wrapper — this
-- runner uses per-statement autocommit (see init-db.js).

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  resource VARCHAR(255),
  action VARCHAR(100),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ,
  -- Used by the refresh-token rotation in routes/auth.js ('generation'
  -- increments each rotation; a mismatch indicates token reuse).
  ADD COLUMN IF NOT EXISTS refresh_token_generation INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
