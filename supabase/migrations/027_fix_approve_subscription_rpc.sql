-- Migration 027: Fix approve_subscription RPC - use client_tier type instead of TEXT
-- Also adds pro_max plan support (maps to vip tier)
CREATE OR REPLACE FUNCTION public.approve_subscription(
  p_sub_id UUID,
  p_client_id UUID,
  p_payment_link TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub RECORD;
  v_inv RECORD;
  v_client_tier client_tier;
  v_new_tier client_tier;
  v_tier_rank_new INT;
  v_tier_rank_current INT;
BEGIN
  SELECT * INTO v_sub FROM public.client_subscriptions WHERE id = p_sub_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription not found');
  END IF;

  UPDATE public.client_subscriptions
  SET status = 'active', updated_at = now()
  WHERE id = p_sub_id;

  SELECT * INTO v_inv FROM public.invoices
  WHERE client_id = p_client_id
    AND status = 'pending'
    AND notes ILIKE '%subscription%'
  ORDER BY created_at DESC LIMIT 1;

  IF FOUND THEN
    UPDATE public.invoices
    SET status = 'paid', paid_at = now(),
        payoneer_checkout_url = COALESCE(p_payment_link, payoneer_checkout_url)
    WHERE id = v_inv.id;
  END IF;

  SELECT tier INTO v_client_tier FROM public.clients WHERE id = p_client_id;

  CASE v_sub.plan
    WHEN 'pro_max' THEN v_new_tier := 'vip'::client_tier;
    WHEN 'pro' THEN v_new_tier := 'vip'::client_tier;
    WHEN 'business' THEN v_new_tier := 'active'::client_tier;
    WHEN 'starter' THEN v_new_tier := 'new'::client_tier;
    ELSE v_new_tier := 'new'::client_tier;
  END CASE;

  v_tier_rank_new := CASE v_new_tier::text WHEN 'vip' THEN 2 WHEN 'active' THEN 1 ELSE 0 END;
  v_tier_rank_current := CASE v_client_tier::text WHEN 'vip' THEN 2 WHEN 'active' THEN 1 ELSE 0 END;

  IF v_tier_rank_new >= v_tier_rank_current THEN
    UPDATE public.clients SET tier = v_new_tier WHERE id = p_client_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'plan', v_sub.plan, 'designs_total', v_sub.designs_total);
END;
$$;
