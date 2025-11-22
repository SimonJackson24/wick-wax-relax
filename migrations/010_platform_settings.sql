-- Create platform settings table for storing configuration
CREATE TABLE platform_settings (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('shipping', 'payment', 'api', 'email', 'notifications', 'general')),
  key TEXT NOT NULL,
  value TEXT,
  encrypted INTEGER DEFAULT 0,
  description TEXT,
  validation_rules TEXT, -- JSON stored as TEXT in SQLite
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);

-- Create indexes for performance
CREATE INDEX idx_platform_settings_category ON platform_settings(category);
CREATE INDEX idx_platform_settings_key ON platform_settings(key);
CREATE INDEX idx_platform_settings_category_key ON platform_settings(category, key);

-- Create settings audit log table
CREATE TABLE settings_audit_log (
  id TEXT PRIMARY KEY,
  setting_id TEXT NOT NULL REFERENCES platform_settings(id) ON DELETE CASCADE,
  old_value TEXT,
  new_value TEXT,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  changed_by TEXT,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);

-- Create index for audit log
CREATE INDEX idx_settings_audit_log_setting_id ON settings_audit_log(setting_id);
CREATE INDEX idx_settings_audit_log_changed_at ON settings_audit_log(changed_at);

-- Insert default settings
INSERT INTO platform_settings (id, category, key, value, description, validation_rules) VALUES
-- General Settings
('gen-site-name', 'general', 'site_name', 'Wick Wax & Relax', 'Website name displayed in header and emails', '{"type": "string", "minLength": 1, "maxLength": 100}'),
('gen-site-desc', 'general', 'site_description', 'Premium hand-poured soy wax products', 'Site description for SEO', '{"type": "string", "maxLength": 255}'),
('gen-contact-email', 'general', 'contact_email', 'info@wickwaxrelax.com', 'Primary contact email', '{"type": "string", "format": "email"}'),
('gen-support-phone', 'general', 'support_phone', '+44 123 456 7890', 'Customer support phone number', '{"type": "string", "pattern": "^\\+?[0-9\\s\\-\\(\\)]+$"}'),
('gen-business-addr', 'general', 'business_address', '{"street": "123 Main St", "city": "London", "postcode": "SW1A 1AA", "country": "UK"}', 'Business address for orders and returns', '{"type": "object"}'),

-- Shipping Settings
('ship-free-threshold', 'shipping', 'free_shipping_threshold', '50.00', 'Minimum order value for free shipping', '{"type": "number", "minimum": 0}'),
('ship-default-method', 'shipping', 'default_shipping_method', 'standard', 'Default shipping method', '{"type": "string", "enum": ["standard", "express", "overnight"]}'),
('ship-zones', 'shipping', 'shipping_zones', '["UK", "EU", "Worldwide"]', 'Available shipping zones', '{"type": "array", "items": {"type": "string"}}'),
('ship-max-weight', 'shipping', 'max_order_weight', '10.0', 'Maximum order weight in kg', '{"type": "number", "minimum": 0.1, "maximum": 50}'),

-- Payment Settings
('pay-currency', 'payment', 'currency', 'GBP', 'Default currency for transactions', '{"type": "string", "enum": ["GBP", "EUR", "USD"]}'),
('pay-methods', 'payment', 'payment_methods', '["card", "apple_pay", "google_pay", "klarna", "clearpay"]', 'Enabled payment methods', '{"type": "array", "items": {"type": "string"}}'),
('pay-min-value', 'payment', 'min_order_value', '5.00', 'Minimum order value', '{"type": "number", "minimum": 0}'),
('pay-max-value', 'payment', 'max_order_value', '1000.00', 'Maximum order value', '{"type": "number", "minimum": 1}'),

-- Email Settings
('email-smtp-host', 'email', 'smtp_host', '', 'SMTP server hostname', '{"type": "string"}'),
('email-smtp-port', 'email', 'smtp_port', '587', 'SMTP server port', '{"type": "integer", "minimum": 1, "maximum": 65535}'),
('email-smtp-secure', 'email', 'smtp_secure', 'false', 'Use SSL/TLS for SMTP', '{"type": "boolean"}'),
('email-from-name', 'email', 'email_from_name', 'Wick Wax & Relax', 'Sender name for emails', '{"type": "string", "minLength": 1, "maxLength": 100}'),
('email-from-addr', 'email', 'email_from_address', 'noreply@wickwaxrelax.com', 'Sender email address', '{"type": "string", "format": "email"}'),

-- Notification Settings
('notif-order-confirm', 'notifications', 'order_confirmation_enabled', 'true', 'Send order confirmation emails', '{"type": "boolean"}'),
('notif-shipping', 'notifications', 'shipping_notification_enabled', 'true', 'Send shipping notification emails', '{"type": "boolean"}'),
('notif-delivery', 'notifications', 'delivery_notification_enabled', 'true', 'Send delivery confirmation emails', '{"type": "boolean"}'),
('notif-push', 'notifications', 'push_notifications_enabled', 'true', 'Enable push notifications', '{"type": "boolean"}'),

-- API Settings (placeholders for encrypted values)
('api-amazon-key', 'api', 'amazon_api_key', '', 'Amazon SP-API Key (encrypted)', '{"type": "string"}'),
('api-amazon-secret', 'api', 'amazon_client_secret', '', 'Amazon SP-API Client Secret (encrypted)', '{"type": "string"}'),
('api-etsy-key', 'api', 'etsy_api_key', '', 'Etsy API Key (encrypted)', '{"type": "string"}'),
('api-etsy-secret', 'api', 'etsy_shared_secret', '', 'Etsy Shared Secret (encrypted)', '{"type": "string"}'),
('api-revolut-key', 'api', 'revolut_api_key', '', 'Revolut API Key (encrypted)', '{"type": "string"}'),
('api-revolut-webhook', 'api', 'revolut_webhook_secret', '', 'Revolut Webhook Secret (encrypted)', '{"type": "string"}');

-- Mark sensitive settings as encrypted
UPDATE platform_settings SET encrypted = 1 WHERE key IN (
  'amazon_api_key',
  'amazon_client_secret',
  'etsy_api_key',
  'etsy_shared_secret',
  'revolut_api_key',
  'revolut_webhook_secret'
);