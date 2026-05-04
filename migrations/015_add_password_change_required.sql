-- Migration: Add password change requirement tracking for security
-- This enforces password changes for default/admin accounts

ALTER TABLE users ADD COLUMN password_change_required BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN password_change_required_at DATETIME;

-- Index for finding users requiring password change
CREATE INDEX idx_users_password_change_required ON users(password_change_required) WHERE password_change_required = 1;
