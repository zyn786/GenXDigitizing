-- ============================================================
-- 015_fix_subscription_flow: RLS policies + schema fixes
-- ============================================================

-- 1. Add INSERT/UPDATE policies for clients on client_subscriptions
-- (currently only SELECT for clients, ALL for admin)
DROP POLICY IF EXISTS sub_client_insert ON public.client_subscriptions;
CREATE POLICY sub_client_insert ON public.client_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = public.my_client_id());

DROP POLICY IF EXISTS sub_client_update ON public.client_subscriptions;
CREATE POLICY sub_client_update ON public.client_subscriptions
  FOR UPDATE
  TO authenticated
  USING (client_id = public.my_client_id());

-- 2. Make invoices.order_id nullable (subscription invoices have no order)
ALTER TABLE public.invoices ALTER COLUMN order_id DROP NOT NULL;

-- Drop the UNIQUE constraint on order_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'invoices'
      AND con.conname = 'invoices_order_id_key'
  ) THEN
    ALTER TABLE public.invoices DROP CONSTRAINT invoices_order_id_key;
  END IF;
END $$;

-- 3. Add notes column to invoices if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN notes text;
  END IF;
END $$;

-- 4. Drop unique index on coupon_redemptions (coupon_id, visitor_id)
-- Application logic (validateCoupon) already enforces first-order-only limits.
-- This index prevents legitimate reuse of non-first-order coupons.
DROP INDEX IF EXISTS idx_coupon_redemptions_unique;

-- 5. Update RUSHFREE coupon to have a real discount value
UPDATE public.coupons
SET discount_type = 'fixed_amount',
    discount_value = 15,
    description = 'Free rush upgrade on your first order ($15 value)'
WHERE code = 'RUSHFREE' AND discount_value = 0;

-- 6. Atomic counter increment function (prevents race condition in coupon redemptions)
CREATE OR REPLACE FUNCTION public.increment_coupon_counter(coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.coupons
  SET current_redemptions = current_redemptions + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;
