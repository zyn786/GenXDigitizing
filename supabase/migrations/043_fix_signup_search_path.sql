-- ============================================================
-- Migration 043: fix signup -- pin handle_new_user's search_path
-- ============================================================
-- THE ACTUAL CAUSE OF THE SIGNUP 500, confirmed by reading the deployed
-- function out of pg_proc rather than inferring it:
--
--     function_config = search_path=""
--
-- The function's body casts new.raw_user_meta_data->>'role' to the bare type
-- `user_role`. With an EMPTY search_path, `public` is not in scope, so that
-- cast raises:
--
--     ERROR: type "user_role" does not exist   (SQLSTATE 42704)
--
-- The body's exception handler catches ONLY invalid_text_representation, so
-- 42704 is not caught. It propagates out of the trigger, the INSERT into
-- auth.users fails, and GoTrue reports it to the client as the generic
-- "Database error saving new user" -- the 500 every signup has been getting.
--
-- This is the same root cause as the two functions 042 repaired:
--     approve_subscription     -> type "client_tier" does not exist
--     decrement_credit_balance -> relation "clients" does not exist
-- Something set search_path = '' across the public functions, and only the
-- ones using fully-qualified names survived it. 042 pinned the financial
-- RPCs; this pins the trigger.
--
-- Ruled out by the same probe, so this is not a guess:
--   trigger_exists=1, trigger_enabled=O      -> the trigger is present and live
--   security_definer=true                    -> runs as its owner
--   function_owner=postgres,
--   owner_bypassrls=true,
--   users_table_owner=postgres               -> RLS never applies; the
--                                               users_insert policy is NOT the
--                                               cause
--   auth_admin_can_execute=true              -> the grant is not the cause
--   no NOT NULL column lacking a default     -> column drift is not the cause
--
-- pg_catalog is named explicitly and first. It is implicitly searched anyway,
-- but naming it makes the intent explicit and keeps `public` from ever
-- preceding it.

alter function public.handle_new_user() set search_path = pg_catalog, public;

-- PostgREST caches function metadata; without this the change may not be
-- visible until the next restart.
notify pgrst, 'reload schema';

-- ============================================================
-- VERIFY
-- ============================================================
-- Expected: config = 'search_path=pg_catalog, public'
select
  p.proname                                             as function,
  coalesce(array_to_string(p.proconfig, ', '), '(none)') as config,
  p.prosecdef                                           as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'handle_new_user', 'approve_subscription', 'decrement_credit_balance',
    'increment_sub_usage', 'decrement_sub_usage', 'increment_coupon_counter'
  )
order by p.proname;

-- If `handle_new_user` still shows search_path="" after running this, the ALTER
-- did not take -- most likely the role running it is not the function's owner
-- (owner is `postgres`). Re-run it from the SQL editor, which connects as a
-- role that owns it.
