-- Migration 034: Revoke anon EXECUTE on sensitive SECURITY DEFINER functions
-- + fix search_path on RLS utility functions

-- ============================================================
-- 1. Revoke anon execute on dangerous functions
-- ============================================================

-- Financial / subscription operations
REVOKE EXECUTE ON FUNCTION public.approve_subscription(p_sub_id uuid, p_client_id uuid, p_payment_link text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_credit_balance(p_client_id uuid, p_amount integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_sub_usage(sub_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_sub_usage(sub_id uuid, amount integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_sub_usage(sub_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_sub_usage(sub_id uuid, amount integer) FROM anon;

-- Admin / system operations
REVOKE EXECUTE ON FUNCTION public.sync_order_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

-- ============================================================
-- 2. Fix search_path on RLS utility functions (no DROP needed)
-- ============================================================
ALTER FUNCTION public.my_role() SET search_path = '';
ALTER FUNCTION public.my_client_id() SET search_path = '';
ALTER FUNCTION public.my_designer_id() SET search_path = '';

-- ============================================================
-- 3. Prevent direct RPC calls to handle_new_user by anyone
--    (Only the auth trigger should call it)
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
