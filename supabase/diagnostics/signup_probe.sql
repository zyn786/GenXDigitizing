-- ============================================================
-- signup_probe.sql -- READ-ONLY diagnostic for the signup 500
-- ============================================================
-- Paste the whole file into the Supabase SQL editor and run it. It writes
-- nothing: every statement is a SELECT against pg_catalog. There is no
-- transaction to roll back and nothing to undo.
--
-- WHY THIS EXISTS
--
-- An earlier theory -- that public.handle_new_user() was missing -- is
-- impossible. CREATE TRIGGER records a pg_depend dependency on the function, so
-- DROP FUNCTION fails unless you CASCADE, which drops the trigger with it. If
-- the trigger exists, the function exists. So the 500 is the trigger's body
-- RAISING on one of its three INSERTs, and the only way to know which is to
-- look at what is actually deployed.
--
-- The four results below answer, in order:
--   1. does the trigger exist, and is the function SECURITY DEFINER?
--   2. what is the function's ACTUAL source in the database? (compare to
--      migration 001 -- if it has drifted, that is the bug)
--   3. is RLS enabled on users/clients, and what do the insert policies allow?
--      A SECURITY DEFINER function only bypasses RLS if its OWNER owns the
--      table or has BYPASSRLS. If it does not, `users_insert` is evaluated
--      during signup, auth.uid() is NULL, and the INSERT is rejected -- which
--      surfaces to the user as the generic "Database error saving new user".
--   4. have the columns the trigger writes drifted?

-- ------------------------------------------------------------
-- 1. Trigger + function state
-- ------------------------------------------------------------
-- owner must be the table owner (or have BYPASSRLS) for the inserts to skip
-- RLS. security_definer must be true. config shows search_path.
select
  '1. trigger/function'                       as probe,
  t.tgname                                    as trigger_name,
  t.tgenabled                                 as trigger_enabled,   -- 'O' = enabled
  p.oid::regprocedure                         as function_signature,
  pg_get_userbyid(p.proowner)                 as function_owner,
  p.prosecdef                                 as security_definer,
  coalesce(array_to_string(p.proconfig, ', '), '(none)') as config
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
where t.tgname = 'on_auth_user_created';

-- If the row above is missing entirely, the trigger does not exist -- report
-- that, because it contradicts the reasoning in the header.

-- ------------------------------------------------------------
-- 2. The DEPLOYED function body
-- ------------------------------------------------------------
-- This is the single most useful result. Compare it to
-- supabase/migrations/001_initial_schema.sql lines 314-357. Any difference --
-- a missing `security definer`, a missing `set search_path`, a renamed column --
-- is the answer.
select
  '2. deployed body' as probe,
  p.prosrc           as function_source
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'handle_new_user';

-- ------------------------------------------------------------
-- 3. RLS state and insert policies
-- ------------------------------------------------------------
-- If relrowsecurity is true on users/clients AND the function owner in result 1
-- is not the table owner and lacks BYPASSRLS, the trigger's INSERT is subject
-- to these policies -- and during signup there is no authenticated user, so
-- `id = auth.uid()` is NULL and the insert is refused.
select
  '3a. rls state'    as probe,
  c.relname          as table_name,
  c.relrowsecurity   as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  pg_get_userbyid(c.relowner) as table_owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('users', 'clients', 'designers')
order by c.relname;

select
  '3b. insert policies' as probe,
  tablename,
  policyname,
  cmd,
  roles::text,
  coalesce(qual, '(none)')        as using_expression,
  coalesce(with_check, '(none)')  as with_check_expression
from pg_policies
where schemaname = 'public'
  and tablename in ('users', 'clients', 'designers')
order by tablename, cmd, policyname;

-- Does the function owner bypass RLS? (true is what you want)
select
  '3c. owner bypassrls' as probe,
  r.rolname,
  r.rolbypassrls,
  r.rolsuper
from pg_roles r
where r.rolname = (
  select pg_get_userbyid(p.proowner)
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'handle_new_user'
);

-- ------------------------------------------------------------
-- 4. Column drift on the tables the trigger writes
-- ------------------------------------------------------------
-- The trigger inserts into (id, email, full_name, role) and
-- (user_id, company_name, country). A NOT NULL column added later with no
-- default would make those inserts fail with 23502.
select
  '4. columns' as probe,
  table_name,
  column_name,
  data_type,
  is_nullable,
  coalesce(column_default, '(none)') as column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('users', 'clients', 'designers')
order by table_name, ordinal_position;

-- ============================================================
-- READING THE RESULTS
-- ============================================================
-- Result 1 missing            -> no trigger; signup would SUCCEED without a
--                                profile row, so the 500 has another cause.
-- Result 1 security_definer = false
--                             -> the inserts run as the CALLER, RLS applies,
--                                and result 3 shows what blocks them. Fix is to
--                                re-create the function with SECURITY DEFINER.
-- Result 3c rolbypassrls = false AND rolname is not the table owner
--                             -> same conclusion: RLS is blocking the insert.
-- Result 4 any NOT NULL with no default that the trigger does not supply
--                             -> that is the raising statement.
-- Result 2 differs from migration 001
--                             -> the deployed body is stale; that is the bug.
