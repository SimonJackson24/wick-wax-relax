-- Migration: 027_webhook_deliveries.sql
-- Webhook monitoring + replay (admin completeness phase).
-- Every inbound webhook is recorded BEFORE verification so failed/
-- rejected deliveries are visible too — the console is the audit trail.

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source VARCHAR(50) NOT NULL,              -- 'revolut', future: 'royalmail', ...
  event_type VARCHAR(100),
  payload JSONB NOT NULL,
  signature_valid BOOLEAN,
  status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED'
    CHECK (status IN ('RECEIVED', 'PROCESSED', 'FAILED', 'REJECTED')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
