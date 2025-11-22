-- Add refresh_token column to users table
ALTER TABLE users ADD COLUMN refresh_token TEXT;
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Create index for refresh_token for faster lookups
CREATE INDEX idx_users_refresh_token ON users(refresh_token) WHERE refresh_token IS NOT NULL;