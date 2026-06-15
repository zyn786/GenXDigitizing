-- Migration 026: Fix audit gaps - missing indexes, lead_id column
-- 1. Ensure lead_id column exists on orders (CRM conversion)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='lead_id') THEN
    ALTER TABLE orders ADD COLUMN lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Missing compound indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_order_files_type_ver ON order_files(order_id, file_type);
CREATE INDEX IF NOT EXISTS idx_notifications_type_created ON notifications(type, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON audit_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_endpoint ON user_push_subscriptions(user_id, endpoint);
