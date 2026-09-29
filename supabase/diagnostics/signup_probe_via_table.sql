-- ============================================================
-- signup_probe_via_table.sql
-- ============================================================
-- WHY THIS EXISTS
--
-- Pasting SQL results back has not worked three times now -- the results are
-- not arriving. So this script does not ask you to copy anything. It writes the
-- diagnostic values into a scratch table, and the agent reads that table
-- directly over the Supabase API and prints the findings itself.
--
-- Your only job: run this file in the SQL editor, then say "done".
--
-- WHAT IT WRITES
--
-- One scratch table, public.zz_diag. Nothing else is touched -- no existing
-- table is read or modified. Every value is a scalar subquery, so a missing
-- object yields NULL rather than an error, and the whole file is safe to re-run.
--
-- Clean up afterwards with:
--   drop table if exists public.zz_diag;

create table if not exists public.zz_diag (
  k text primary key,
  v text
);

insert into public.zz_diag (k, v) values
  -- ---- trigger + function state -------------------------------------
  ('trigger_exists',
   (select count(*)::text from pg_trigger where tgname = 'on_auth_user_created')),

  ('trigger_enabled',
   (select tgenabled::text from pg_trigger where tgname = 'on_auth_user_created')),

  ('security_definer',
   (select prosecdef::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'handle_new_user')),

  ('function_owner',
   (select pg_get_userbyid(p.proowner) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'handle_new_user')),

  ('function_config',
   (select coalesce(array_to_string(p.proconfig, ', '), '(none)')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'handle_new_user')),

  ('function_returns',
   (select pg_get_function_result(p.oid) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'handle_new_user')),

  -- A missing EXECUTE for the role that fires the trigger produces the SAME
  -- generic 500 as a raising body, so this has to be ruled out explicitly.
  ('auth_admin_can_execute',
   (select has_function_privilege('supabase_auth_admin', p.oid, 'EXECUTE')::text
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'handle_new_user')),

  ('function_acl',
   (select coalesce(p.proacl::text, '(default: PUBLIC has EXECUTE)')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'handle_new_user')),

  -- Filtering by tgname alone hides a second or renamed trigger on auth.users.
  ('all_triggers_on_auth_users',
   (select coalesce(string_agg(t.tgname || ' -> ' || p.oid::regprocedure::text ||
                               ' enabled=' || t.tgenabled::text, ' || '), '(none)')
      from pg_trigger t
      join pg_proc p on p.oid = t.tgfoid
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal)),

  -- ---- does the owner bypass RLS? ------------------------------------
  -- If this is false AND the owner is not the table owner, the trigger's
  -- INSERT is subject to users_insert -- and during signup auth.uid() is NULL,
  -- so the policy refuses it. That is the leading hypothesis for the 500.
  ('owner_bypassrls',
   (select r.rolbypassrls::text from pg_roles r
     where r.rolname = (select pg_get_userbyid(p.proowner)
                          from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                         where n.nspname = 'public' and p.proname = 'handle_new_user'))),

  ('owner_is_superuser',
   (select r.rolsuper::text from pg_roles r
     where r.rolname = (select pg_get_userbyid(p.proowner)
                          from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                         where n.nspname = 'public' and p.proname = 'handle_new_user'))),

  -- ---- RLS state and table owners ------------------------------------
  ('users_rls_enabled',
   (select relrowsecurity::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'users')),

  ('users_table_owner',
   (select pg_get_userbyid(c.relowner) from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'users')),

  ('clients_rls_enabled',
   (select relrowsecurity::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'clients')),

  ('designers_rls_enabled',
   (select relrowsecurity::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'designers')),

  -- ---- the policies that would block the insert ----------------------
  ('users_insert_policy',
   (select coalesce(string_agg(policyname || ' roles=' || roles::text ||
                               ' check=' || coalesce(with_check, '(none)'), ' || '), '(none)')
      from pg_policies
     where schemaname = 'public' and tablename = 'users' and cmd in ('INSERT', 'ALL'))),

  ('clients_insert_policy',
   (select coalesce(string_agg(policyname || ' roles=' || roles::text ||
                               ' check=' || coalesce(with_check, '(none)'), ' || '), '(none)')
      from pg_policies
     where schemaname = 'public' and tablename = 'clients' and cmd in ('INSERT', 'ALL'))),

  -- ---- column drift ---------------------------------------------------
  -- A NOT NULL column with no default that the trigger does not supply would
  -- make the INSERT fail with 23502. Format: name:type:nullable:has_default
  ('users_notnull_no_default',
   (select coalesce(string_agg(column_name || ':' || data_type || ':nullable=' || is_nullable ||
                               ':default=' || coalesce(column_default, 'NONE'), ' || '), '(none)')
      from information_schema.columns
     where table_schema = 'public' and table_name = 'users'
       and is_nullable = 'NO' and column_default is null)),

  ('clients_notnull_no_default',
   (select coalesce(string_agg(column_name || ':' || data_type || ':nullable=' || is_nullable ||
                               ':default=' || coalesce(column_default, 'NONE'), ' || '), '(none)')
      from information_schema.columns
     where table_schema = 'public' and table_name = 'clients'
       and is_nullable = 'NO' and column_default is null)),

  -- ---- the deployed body, in one value --------------------------------
  -- The single most useful result: if this differs from migration 001
  -- lines 314-357, the deployed function is stale and that is the bug.
  ('function_body',
   (select p.prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'handle_new_user')),

  ('written_at', now()::text)

on conflict (k) do update set v = excluded.v;

-- Confirmation you can eyeball without copying anything:
select k, left(coalesce(v, '(null)'), 80) as value_preview
from public.zz_diag
order by k;
