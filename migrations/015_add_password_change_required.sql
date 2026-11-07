-- Migration: Add password change requirement tracking for security
-- This enforces password changes for default/admin accounts

ALTER TABLE users ADD COLUMN password_change_required BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN password_change_required_at TIMESTAMP WITH TIME ZONE;

-- Index for finding users requiring password change
-- (predicate fixed from `= 1` to `= TRUE`: Postgres cannot compare a BOOLEAN
-- column to an integer, so this CREATE INDEX failed on every migration-built
-- database and the runner's error tolerance skipped it silently)
CREATE INDEX idx_users_password_change_required ON users(password_change_required) WHERE password_change_required = TRUE;
