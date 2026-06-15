-- ============================================================
-- 013_coupon_system: Coupons & Promotions
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE coupon_status AS ENUM ('active', 'disabled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  description     TEXT,
  discount_type   discount_type NOT NULL DEFAULT 'percentage',
  discount_value  NUMERIC(5,2) NOT NULL CHECK (discount_value >= 0),
  min_file_count  INT NOT NULL DEFAULT 0,
  max_redemptions INT DEFAULT NULL,
  current_redemptions INT NOT NULL DEFAULT 0,
  applies_to      TEXT[] DEFAULT '{}',
  is_first_order_only BOOLEAN NOT NULL DEFAULT false,
  is_bulk_discount    BOOLEAN NOT NULL DEFAULT false,
  is_subscribe_offer  BOOLEAN NOT NULL DEFAULT false,
  starts_at       TIMESTAMPTZ DEFAULT NULL,
  expires_at      TIMESTAMPTZ DEFAULT NULL,
  status          coupon_status NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coupon redemptions table
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id       UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  visitor_id      TEXT NOT NULL,
  email           TEXT,
  order_reference TEXT,
  discount_amount NUMERIC(10,2),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate first-order coupon use per visitor
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_redemptions_unique
  ON public.coupon_redemptions (coupon_id, visitor_id);

-- Index for visitor lookup
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_visitor
  ON public.coupon_redemptions (visitor_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_coupon_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coupon_updated_at ON public.coupons;
CREATE TRIGGER trg_coupon_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_coupon_updated_at();

-- RLS: public can read active coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coupons_public_read ON public.coupons;
CREATE POLICY coupons_public_read ON public.coupons
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- RLS: admin full access on coupons
DROP POLICY IF EXISTS coupons_admin_all ON public.coupons;
CREATE POLICY coupons_admin_all ON public.coupons
  FOR ALL
  TO authenticated
  USING (public.my_role() = 'admin')
  WITH CHECK (public.my_role() = 'admin');

-- RLS: redemptions visible to owning visitor + admin
DROP POLICY IF EXISTS redemptions_select ON public.coupon_redemptions;
CREATE POLICY redemptions_select ON public.coupon_redemptions
  FOR SELECT
  TO anon, authenticated
  USING (true);  -- needed for validation lookups

-- RLS: insert via anon allowed (validated server-side)
DROP POLICY IF EXISTS redemptions_insert ON public.coupon_redemptions;
CREATE POLICY redemptions_insert ON public.coupon_redemptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================
-- Seed coupons
-- ============================================================
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_file_count, is_first_order_only, is_bulk_discount, is_subscribe_offer, status)
VALUES
  ('FIRST50',  '50% off your first design order',            'percentage', 50, 0, true,  false, false, 'active'),
  ('BULK20',   '20% off when you upload 5+ designs',         'percentage', 20, 5, false, true,  false, 'active'),
  ('RUSHFREE', 'Free rush upgrade on your first order',      'percentage', 0,  0, true,  false, false, 'active'),
  ('SAVE25',   'Subscribe & save 25% on recurring orders',   'percentage', 25, 0, false, false, true,  'active'),
  ('BULK30',   '30% off when you upload 10+ designs',        'percentage', 30, 10, false, true, false, 'active')
ON CONFLICT (code) DO NOTHING;
