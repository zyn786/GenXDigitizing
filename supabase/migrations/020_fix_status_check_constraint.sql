-- Migration 020: Clean up duplicate status CHECK constraints
-- Migration 019 added a second constraint alongside the original inline CHECK from 014
-- This ensures only one constraint exists with all 6 status values

ALTER TABLE client_subscriptions DROP CONSTRAINT IF EXISTS chk_subscription_status;
ALTER TABLE client_subscriptions DROP CONSTRAINT IF EXISTS client_subscriptions_status_check;
ALTER TABLE client_subscriptions ADD CONSTRAINT client_subscriptions_status_check
  CHECK (status IN ('active','pending','paused','cancelled','expired','cancellation_requested'));
