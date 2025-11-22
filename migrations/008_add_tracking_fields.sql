-- Add tracking fields to orders table
ALTER TABLE orders ADD COLUMN tracking_number TEXT;
ALTER TABLE orders ADD COLUMN carrier TEXT DEFAULT 'ROYAL_MAIL';
ALTER TABLE orders ADD COLUMN shipping_date DATETIME;
ALTER TABLE orders ADD COLUMN estimated_delivery_date DATETIME;
ALTER TABLE orders ADD COLUMN tracking_status TEXT DEFAULT 'NOT_SHIPPED';
ALTER TABLE orders ADD COLUMN tracking_updated_at DATETIME;

-- Create tracking history table
CREATE TABLE tracking_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  status TEXT NOT NULL,
  status_description TEXT,
  location TEXT,
  timestamp DATETIME NOT NULL,
  carrier_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_tracking_history_order ON tracking_history(order_id);
CREATE INDEX idx_tracking_history_tracking_number ON tracking_history(tracking_number);
CREATE INDEX idx_tracking_history_timestamp ON tracking_history(timestamp);

-- Create cache table for tracking data
CREATE TABLE tracking_cache (
  id TEXT PRIMARY KEY,
  tracking_number TEXT NOT NULL UNIQUE,
  carrier TEXT NOT NULL DEFAULT 'ROYAL_MAIL',
  tracking_data TEXT NOT NULL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for cache lookups
CREATE INDEX idx_tracking_cache_tracking_number ON tracking_cache(tracking_number);
CREATE INDEX idx_tracking_cache_expires_at ON tracking_cache(expires_at);