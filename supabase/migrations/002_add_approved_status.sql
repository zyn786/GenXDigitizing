-- Add 'approved' status to order_status enum
-- Represents: QA passed, pending client release by admin
-- Position: after 'review', before 'delivered'
ALTER TYPE order_status ADD VALUE 'approved' AFTER 'review';
