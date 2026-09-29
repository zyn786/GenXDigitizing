-- ============================================================
-- dump_function_bodies.sql
-- ============================================================
-- Dumps the DEPLOYED source of every function in public, so the search_path
-- hardening can be applied by rewriting actual bodies rather than assuming
-- they match the migration files.
--
-- WHY THIS IS NECESSARY
--
-- The repo and the database have already been shown to disagree:
--   * handle_new_user's deployed body matches migration 001, but its
--     search_path config does not ("" vs public).
--   * blog_comments and the portfolio tables exist in NEITHER
--     supabase/migrations/ NOR supabase/setup/.
--   * migration 034 was applied and had no effect for months.
--
-- Re-creating a function from a migration file when the live copy has been
-- edited since would silently revert that edit. So: read first, rewrite second.
--
-- Run this in the SQL editor. It writes to public.zz_fns and touches nothing
-- else. The agent reads the table back over the API -- nothing to copy.
--
-- Cleanup afterwards:
--   drop table if exists public.zz_fns;

create table if not exists public.zz_fns (
  signature text primary key,
  proname   text,
  config    text,
  security_definer boolean,
  language  text,
  returns   text,
  body      text
);

delete from public.zz_fns;

insert into public.zz_fns (signature, proname, config, security_definer, language, returns, body)
select
  p.oid::regprocedure::text,
  p.proname,
  coalesce(array_to_string(p.proconfig, ', '), '(none)'),
  p.prosecdef,
  l.lanname,
  pg_get_function_result(p.oid),
  p.prosrc
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
  -- User-defined functions only. Excludes extension-owned objects, which we
  -- neither own nor should touch (e.g. anything from pgcrypto or uuid-ossp).
  and not exists (
    select 1 from pg_depend d
    where d.objid = p.oid and d.deptype = 'e'
  )
  and p.proname in (
    'handle_new_user',
    'approve_subscription',
    'decrement_credit_balance',
    'decrement_sub_usage',
    'increment_sub_usage',
    'increment_coupon_counter',
    'sync_order_stats',
    'my_role',
    'my_client_id',
    'my_designer_id',
    'rls_auto_enable',
    'create_portfolio_tables_v1',
    'update_coupon_updated_at',
    'touch_updated_at'
  );

-- Anything that exists but was not in the list above is also worth seeing --
-- a function we have not accounted for could be another search_path casualty.
insert into public.zz_fns (signature, proname, config, security_definer, language, returns, body)
select
  p.oid::regprocedure::text,
  p.proname,
  coalesce(array_to_string(p.proconfig, ', '), '(none)'),
  p.prosecdef,
  l.lanname,
  pg_get_function_result(p.oid),
  left(p.prosrc, 300)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
  and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  and p.proname not in (
    'handle_new_user','approve_subscription','decrement_credit_balance',
    'decrement_sub_usage','increment_sub_usage','increment_coupon_counter',
    'sync_order_stats','my_role','my_client_id','my_designer_id',
    'rls_auto_enable','create_portfolio_tables_v1','update_coupon_updated_at',
    'touch_updated_at'
  )
on conflict (signature) do nothing;

-- Eyeball check you can read without copying: which functions have an empty or
-- missing search_path, i.e. which are one unqualified reference away from
-- breaking exactly like handle_new_user did.
select
  count(*) filter (where config = '(none)')                       as no_config,
  count(*) filter (where config like '%search_path=""%')          as empty_search_path,
  count(*) filter (where config like '%search_path=%' and config not like '%search_path=""%') as pinned,
  count(*)                                                        as total
from public.zz_fns;

select signature, config, security_definer
from public.zz_fns
order by (config like '%search_path=""%') desc, signature;
