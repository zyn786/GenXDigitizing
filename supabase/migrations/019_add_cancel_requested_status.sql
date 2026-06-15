-- Migration 019: Add cancellation_requested status to client_subscriptions
-- Enables admin-reviewed cancellation flow
-- Drops both possible constraint names (inline CHECK from 014 + named from previous runs)

ALTER TABLE client_subscriptions DROP CONSTRAINT IF EXISTS client_subscriptions_status_check;
ALTER TABLE client_subscriptions DROP CONSTRAINT IF EXISTS chk_subscription_status;
ALTER TABLE client_subscriptions ADD CONSTRAINT client_subscriptions_status_check
  CHECK (status IN ('active','pending','paused','cancelled','expired','cancellation_requested'));
