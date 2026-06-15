-- ============================================================
-- 016_subscription_usage_rpc: Atomic usage counter increment
-- ============================================================

-- RPC: Atomically increment designs_used (prevents race condition
-- when multiple orders are placed concurrently on a subscription)
CREATE OR REPLACE FUNCTION public.increment_sub_usage(sub_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.client_subscriptions
  SET designs_used = designs_used + 1,
      updated_at = now()
  WHERE id = sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Atomically decrement designs_used (for order cancellation/refund)
CREATE OR REPLACE FUNCTION public.decrement_sub_usage(sub_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.client_subscriptions
  SET designs_used = GREATEST(designs_used - 1, 0),
      updated_at = now()
  WHERE id = sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
