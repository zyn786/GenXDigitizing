-- ============================================================
-- 017_subscription_approval_rpc: Atomic subscription approval
-- Wraps all approval steps in a single DB transaction:
--   1. Activate subscription
--   2. Mark subscription invoice as paid
--   3. Upgrade client tier (only if new tier >= current)
-- Returns: { success: boolean, plan: text, designs_total: int }
-- ============================================================

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
  v_client_tier TEXT;
  v_new_tier TEXT;
  v_tier_rank_new INT;
  v_tier_rank_current INT;
BEGIN
  -- 1. Get subscription
  SELECT * INTO v_sub FROM public.client_subscriptions WHERE id = p_sub_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription not found');
  END IF;

  -- 2. Activate subscription
  UPDATE public.client_subscriptions
  SET status = 'active', updated_at = now()
  WHERE id = p_sub_id;

  -- 3. Find and mark pending subscription invoice as paid
  SELECT * INTO v_inv FROM public.invoices
  WHERE client_id = p_client_id
    AND status = 'pending'
    AND notes ILIKE '%subscription%'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.invoices
    SET status = 'paid',
        paid_at = now(),
        payoneer_checkout_url = COALESCE(p_payment_link, payoneer_checkout_url)
    WHERE id = v_inv.id;
  END IF;

  -- 4. Upgrade client tier (never downgrade)
  SELECT tier INTO v_client_tier FROM public.clients WHERE id = p_client_id;

  CASE v_sub.plan
    WHEN 'pro' THEN v_new_tier := 'vip';
    WHEN 'business' THEN v_new_tier := 'active';
    WHEN 'starter' THEN v_new_tier := 'new';
    ELSE v_new_tier := 'new';
  END CASE;

  v_tier_rank_new := CASE v_new_tier
    WHEN 'vip' THEN 2 WHEN 'active' THEN 1 ELSE 0 END;
  v_tier_rank_current := CASE v_client_tier
    WHEN 'vip' THEN 2 WHEN 'active' THEN 1 ELSE 0 END;

  IF v_tier_rank_new >= v_tier_rank_current THEN
    UPDATE public.clients SET tier = v_new_tier WHERE id = p_client_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'plan', v_sub.plan,
    'designs_total', v_sub.designs_total
  );
END;
$$;
