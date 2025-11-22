-- Create security audit log table for comprehensive security event tracking
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  event_type TEXT NOT NULL,
  user_id TEXT,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  resource TEXT,
  action TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_email ON audit_log(email);
CREATE INDEX idx_audit_ip ON audit_log(ip_address);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_audit_resource ON audit_log(resource);

-- Create composite indexes for common query patterns
CREATE INDEX idx_audit_security_events ON audit_log(event_type, created_at) WHERE event_type LIKE 'SECURITY_%';
CREATE INDEX idx_audit_user_events ON audit_log(user_id, created_at);
CREATE INDEX idx_audit_ip_events ON audit_log(ip_address, created_at);

-- Insert initial audit log entry
INSERT INTO audit_log (event_type, details) VALUES ('SYSTEM_AUDIT_LOG_INITIALIZED', '{"message": "Security audit logging system initialized", "version": "1.0"}');