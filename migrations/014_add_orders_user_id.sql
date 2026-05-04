-- Migration: Add user_id to orders table for proper user-order association
-- This enables order history tracking, fraud detection, and user analytics

-- Add user_id column to orders table
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for efficient user order lookups
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Backfill existing orders if there's a way to determine ownership
-- For orders without clear user association, leave user_id as NULL
-- This would typically be done based on payment records or session data

-- Add comment for documentation
COMMENT ON COLUMN orders.user_id IS 'References the user who placed the order. NULL for guest orders or orders where user association cannot be determined.';
