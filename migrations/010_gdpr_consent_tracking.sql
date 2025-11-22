-- Create GDPR consent tracking table
CREATE TABLE user_consents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('marketing', 'analytics', 'third_party', 'data_processing')),
  consent_given BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add GDPR-related columns to users table
ALTER TABLE users ADD COLUMN marketing_consent BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN marketing_consent_date DATETIME;
ALTER TABLE users ADD COLUMN marketing_consent_version TEXT;

ALTER TABLE users ADD COLUMN analytics_consent BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN analytics_consent_date DATETIME;
ALTER TABLE users ADD COLUMN analytics_consent_version TEXT;

ALTER TABLE users ADD COLUMN third_party_consent BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN third_party_consent_date DATETIME;
ALTER TABLE users ADD COLUMN third_party_consent_version TEXT;

ALTER TABLE users ADD COLUMN data_processing_consent BOOLEAN DEFAULT 1; -- Default to true for existing users
ALTER TABLE users ADD COLUMN data_processing_consent_date DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN data_processing_consent_version TEXT DEFAULT '1.0';

ALTER TABLE users ADD COLUMN gdpr_deleted BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN gdpr_deletion_date DATETIME;
ALTER TABLE users ADD COLUMN gdpr_deletion_reason TEXT;

-- Add GDPR anonymization flag to orders
ALTER TABLE orders ADD COLUMN gdpr_anonymized BOOLEAN DEFAULT 0;

-- Create indexes for GDPR compliance
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX idx_user_consents_created ON user_consents(created_at);

CREATE INDEX idx_users_gdpr_deleted ON users(gdpr_deleted);
CREATE INDEX idx_users_gdpr_deletion_date ON users(gdpr_deletion_date);

CREATE INDEX idx_orders_gdpr_anonymized ON orders(gdpr_anonymized);

-- Insert default consent records for existing users
INSERT INTO user_consents (user_id, consent_type, consent_given, consent_version)
SELECT
  id,
  'data_processing',
  1,
  '1.0'
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_consents
  WHERE user_consents.user_id = users.id
  AND user_consents.consent_type = 'data_processing'
);

-- Update existing users with default consent values
UPDATE users SET
  data_processing_consent = 1,
  data_processing_consent_date = CURRENT_TIMESTAMP,
  data_processing_consent_version = '1.0'
WHERE data_processing_consent IS NULL;