-- Migration 018: Add cancellation reason tracking to client_subscriptions
-- Tracks why clients cancel so we can improve retention

ALTER TABLE client_subscriptions
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_notes TEXT;

-- Index for analytics queries grouping cancellations by reason
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_cancellation_reason
ON client_subscriptions (cancellation_reason)
WHERE cancellation_reason IS NOT NULL;
