-- ============================================================
-- Migration 042: close the anon EXECUTE hole (app-safe)
-- ============================================================
-- REWRITTEN after review. The first draft of this file would have broken the
-- running application. Preserved here so the trap is not re-entered:
--
--   * `approve_subscription` is called from the BROWSER:
--     app/(portals)/admin/subscriptions/SubscriptionsAdmin.tsx:228, via
--     createClient() -- so it executes as `authenticated`, not as a server role.
--     Revoking EXECUTE from `authenticated` breaks admin subscription approval.
--
--   * `increment_sub_usage` and `decrement_credit_balance` are called from the
--     BROWSER too: app/(portals)/client/new-order/QuickOrder.tsx:167-168, via
--     createClient(), and wrapped in `.catch(()=>{})`. Revoking from
--     `authenticated` makes those fail SILENTLY -- credits stop being deducted
--     and usage stops being recorded, with no error anywhere. That is a
--     revenue leak that would never show up in a log.
--
--   * `increment_coupon_counter` is called via createAdminClient()
--     (lib/coupons.ts:118), so it runs as `service_role`. Because revoking from
--     PUBLIC also strips the grant service_role inherits from PUBLIC, it needs
--     an explicit grant or coupon counters silently stop incrementing.
--
-- THE RULE: revoke from PUBLIC and anon, then EXPLICITLY re-grant every role
-- that legitimately calls the function. Never revoke from `authenticated`
-- without first confirming no browser code path calls it.
--
-- WHAT THIS FILE DOES NOT DO
--
-- It does not attempt to fix signup. An earlier draft claimed
-- handle_new_user() was missing; that is impossible -- CREATE TRIGGER records a
-- pg_depend dependency on the function, so DROP FUNCTION fails without CASCADE.
-- If the trigger exists, the function exists. The 500 is the trigger's body
-- RAISING, most likely on one of its three INSERTs, and this file contains no
-- DDL that would repair a drifted table shape. Diagnose it with
-- supabase/diagnostics/signup_probe.sql before attempting a fix.
--
-- SAFETY PROPERTIES
--   * No `raise exception` anywhere. Nothing here aborts on a missing object.
--   * Every object reference is guarded by to_regprocedure()/to_regclass().
--   * Every CREATE POLICY has a matching DROP POLICY IF EXISTS.
--   * Idempotent -- safe to run repeatedly.
--   * The final verification SELECT references only pg_catalog, so it cannot
--     roll back the file by naming a table that might not exist.

-- ============================================================
-- 1. Revoke PUBLIC + anon, then re-grant the legitimate callers
-- ============================================================
-- Browser-called (authenticated) and server-called (service_role) are listed
-- separately so the intent survives a future edit.
do $$
declare
  fn        text;
  browser   text[] := array[
    'public.approve_subscription(uuid, uuid, text)',
    'public.increment_sub_usage(uuid)',
    'public.increment_sub_usage(uuid, integer)',
    'public.decrement_sub_usage(uuid)',
    'public.decrement_sub_usage(uuid, integer)',
    'public.decrement_credit_balance(uuid, integer)'
  ];
  server    text[] := array[
    'public.increment_coupon_counter(uuid)',
    'public.sync_order_stats()'
  ];
  -- Objects this repo does not create. They are almost certainly owned by
  -- supabase_admin, and a GRANT by a non-owner RAISES `must be owner of
  -- function` -- which would abort this whole file. REVOKE by a non-owner only
  -- warns, so these are revoke-only: never grant on something we do not own.
  revoke_only text[] := array[
    'public.rls_auto_enable()',
    'public.create_portfolio_tables_v1()'
  ];
  all_fns   text[];
begin
  all_fns := browser || server || revoke_only;

  foreach fn in array all_fns loop
    if to_regprocedure(fn) is null then
      raise notice 'SKIP (absent): %', fn;
      continue;
    end if;
    -- anon is the key shipped in the browser bundle -- never grant it these.
    -- REVOKE never raises, so no exception handler is needed here.
    execute format('revoke execute on function %s from public, anon', fn);
    raise notice 'revoked from public/anon: %', fn;
  end loop;

  -- GRANTs on objects we do not own can raise. Each is isolated so one
  -- ownership failure cannot roll back the rest of the file.
  foreach fn in array browser loop
    if to_regprocedure(fn) is null then continue; end if;
    begin
      -- Re-grant `authenticated`: called from client components and MUST keep
      -- working. See the header for the two call sites.
      execute format('grant execute on function %s to authenticated', fn);
    exception when others then
      raise notice 'GRANT FAILED (not owner?) % -> % : %', fn, 'authenticated', sqlerrm;
    end;
  end loop;

  foreach fn in array server loop
    if to_regprocedure(fn) is null then continue; end if;
    begin
      execute format('grant execute on function %s to service_role', fn);
    exception when others then
      raise notice 'GRANT FAILED (not owner?) % -> % : %', fn, 'service_role', sqlerrm;
    end;
  end loop;

  raise notice 'done: % browser fns -> authenticated, % server fns -> service_role, % revoke-only',
    array_length(browser, 1), array_length(server, 1), array_length(revoke_only, 1);
end $$;

-- handle_new_user: revoke the public grants and make sure the role that fires
-- the trigger can still execute it.
--
-- This is NOT an attempt to fix signup -- the trigger demonstrably fires (that
-- is why signup returns an error rather than succeeding without a profile row).
-- It is the grant 034 intended and never delivered. A trigger-returning
-- function cannot be called through /rest/v1/rpc/, so revoking from anon costs
-- nothing.
do $$
begin
  if to_regprocedure('public.handle_new_user()') is null then
    raise notice 'SKIP: handle_new_user absent';
    return;
  end if;
  execute 'revoke execute on function public.handle_new_user() from public, anon, authenticated';
  begin
    execute 'grant execute on function public.handle_new_user() to supabase_auth_admin';
  exception when others then
    raise notice 'handle_new_user grant FAILED (not owner?): %', sqlerrm;
  end;
  raise notice 'handle_new_user: revoked from public/anon/authenticated, granted to supabase_auth_admin';
end $$;

-- The my_* helpers are called from inside RLS policies and must stay reachable
-- by every role that evaluates one.
do $$
declare fn text;
begin
  foreach fn in array array[
    'public.my_role()', 'public.my_client_id()', 'public.my_designer_id()'
  ] loop
    if to_regprocedure(fn) is not null then
      execute format('grant execute on function %s to anon, authenticated, service_role', fn);
    end if;
  end loop;
  raise notice 'my_* helpers remain callable (required by RLS policies)';
end $$;

-- ============================================================
-- 2. blog_comments: stop exposing commenter emails
-- ============================================================
-- NOTE ON COLUMN PRIVILEGES: `revoke select (author_email) ...` does NOT work
-- here. In Supabase, anon/authenticated hold TABLE-level SELECT on public
-- tables, and a table-level grant covers every column -- Postgres has no
-- negative ACLs, so a column revoke cannot subtract from it. It warns
-- "no privileges could be revoked" and does nothing. The correct pattern is to
-- drop the table-level grant and re-grant the safe columns explicitly.
do $$
begin
  if to_regclass('public.blog_comments') is null then
    raise notice 'SKIP: blog_comments absent';
    return;
  end if;
  -- blog_comments is created by no migration and no setup script, so we are not
  -- its owner and the GRANT below can raise `must be owner of table`. Isolated
  -- so it cannot take the rest of the file with it. REVOKE would only warn --
  -- but if this GRANT fails, the table-level SELECT is gone and no column grant
  -- replaces it, so anon may lose read access to blog_comments entirely. The
  -- application is unaffected (both readers use createAdminClient), but check
  -- the notice output for this line.
  begin
    execute 'revoke select on public.blog_comments from anon, authenticated';
    -- Only the columns a public comment view legitimately needs. author_email is
    -- deliberately absent, and must never be added back.
    execute 'grant select (id, post_id, author_name, content, is_approved, created_at)
               on public.blog_comments to anon, authenticated';
    raise notice 'blog_comments: table-level SELECT replaced with an explicit column list';
  exception when others then
    raise notice 'blog_comments column grant FAILED (not owner? or column missing): %', sqlerrm;
    raise notice '  -> anon/authenticated may now have NO select on blog_comments. The app is unaffected (createAdminClient is used for both readers).';
  end;
end $$;

-- ============================================================
-- 3. coupon_redemptions: remove the USING (true) policy
-- ============================================================
-- lib/coupons.ts uses createAdminClient() for both the read (line 85) and the
-- insert (line 106), so no anon/authenticated access is needed. The policy fix
-- is what closes this; a column revoke would be redundant here.
do $$
begin
  if to_regclass('public.coupon_redemptions') is null then
    raise notice 'SKIP: coupon_redemptions absent';
    return;
  end if;
  execute 'alter table public.coupon_redemptions enable row level security';
  execute 'drop policy if exists redemptions_select on public.coupon_redemptions';
  execute 'drop policy if exists redemptions_insert on public.coupon_redemptions';
  execute 'drop policy if exists redemptions_admin_all on public.coupon_redemptions';

  -- my_role() must exist for this policy to be creatable. It is referenced in
  -- the USING clause, which is resolved when the dynamic SQL runs -- so an
  -- absent function would raise here and roll back the whole file.
  if to_regprocedure('public.my_role()') is null then
    raise notice 'SKIP policy: public.my_role() absent';
    return;
  end if;
  execute $p$
    create policy redemptions_admin_all on public.coupon_redemptions
      for all to authenticated
      using (public.my_role() = 'admin')
      with check (public.my_role() = 'admin')
  $p$;
  raise notice 'coupon_redemptions: admin-only';
end $$;

-- ============================================================
-- 4. Pin search_path on the financial RPCs
-- ============================================================
-- Confirmed cause: migration 027 declares `v_client_tier client_tier` with no
-- pinned search_path, so a caller whose path excludes public gets exactly
-- `type "client_tier" does not exist`. pg_catalog is named explicitly alongside
-- public -- `public` alone is hijackable if the caller can create objects there.
do $$
declare
  fn  text;
  fns text[] := array[
    'public.approve_subscription(uuid, uuid, text)',
    'public.decrement_credit_balance(uuid, integer)',
    'public.decrement_sub_usage(uuid)',
    'public.decrement_sub_usage(uuid, integer)',
    'public.increment_sub_usage(uuid)',
    'public.increment_sub_usage(uuid, integer)',
    'public.increment_coupon_counter(uuid)'
  ];
begin
  foreach fn in array fns loop
    if to_regprocedure(fn) is null then continue; end if;
    execute format('alter function %s set search_path = pg_catalog, public', fn);
  end loop;
  raise notice 'search_path pinned on financial RPCs';
end $$;

notify pgrst, 'reload schema';

-- ============================================================
-- 5. Execution marker
-- ============================================================
-- A migration is one transaction: if this row is present the WHOLE file
-- committed; if absent, nothing did and you are looking at another silent
-- rollback. Drop it once this is settled:
--   drop table if exists public.zz_migration_probe;
create table if not exists public.zz_migration_probe (
  id         int primary key,
  label      text,
  applied_at timestamptz not null default now()
);
insert into public.zz_migration_probe (id, label)
values (1, '042_security_hardening')
on conflict (id) do update set label = excluded.label, applied_at = now();

-- ============================================================
-- VERIFY -- read the result grid
-- ============================================================
-- References pg_catalog only. An earlier draft selected from public.crm_leads
-- here, which would have raised on an absent table and rolled back every
-- statement above it -- the exact failure mode this migration exists to avoid.
select
  p.proname                                  as function,
  coalesce(array_to_string(p.proconfig, ','), '(none)') as config,
  has_function_privilege('anon',          p.oid, 'EXECUTE') as anon_can,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authd_can,
  has_function_privilege('service_role',  p.oid, 'EXECUTE') as service_can
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'approve_subscription', 'decrement_credit_balance', 'decrement_sub_usage',
    'increment_sub_usage', 'increment_coupon_counter', 'rls_auto_enable',
    'create_portfolio_tables_v1', 'sync_order_stats',
    'my_role', 'my_client_id', 'my_designer_id', 'handle_new_user'
  )
order by p.proname;

-- Expected:
--   anon_can   = false everywhere except my_role / my_client_id / my_designer_id
--   authd_can  = true for approve_subscription, increment_sub_usage,
--                decrement_sub_usage, decrement_credit_balance (the browser
--                call sites) and the my_* helpers
--   service_can= true for the service-role-called functions
--
-- rls_auto_enable and create_portfolio_tables_v1 are platform objects owned by
-- another role. If anon_can is still true for those, the REVOKE silently failed
-- (a non-owner REVOKE only warns) -- they can only be closed by their owner.
