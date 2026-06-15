-- Migration 024: Add pro_max to plan CHECK constraint
ALTER TABLE client_subscriptions DROP CONSTRAINT IF EXISTS chk_subscription_plan;
ALTER TABLE client_subscriptions ADD CONSTRAINT chk_subscription_plan
  CHECK (plan IN ('starter','business','pro','pro_max'));
