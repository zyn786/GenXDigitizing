-- ============================================================
-- Migration 044: permanent search_path fix -- qualify the bodies
-- ============================================================
-- WHY
--
-- Something set search_path = '' across the public functions (the Supabase
-- linter recommends exactly that). Functions whose bodies use fully-qualified
-- names survived. Functions with bare references broke, and the failures were
-- silent or generic:
--
--   handle_new_user   -> type "user_role" does not exist    -> every signup 500
--   approve_subscription      -> type "client_tier" does not exist
--   decrement_credit_balance  -> relation "clients" does not exist
--   sync_order_stats          -> type "client_tier" does not exist  (STILL BROKEN)
--
-- 042 pinned `search_path = pg_catalog, public` on the first three and 043
-- pinned handle_new_user. That works, but it is a SETTING -- anything that
-- resets it re-breaks them, which is how this started.
--
-- This migration removes the dependency instead of configuring around it: every
-- bare reference is schema-qualified, so the functions no longer care what the
-- search path is. They are then set to '' -- the secure value the linter wants,
-- and now harmless because there is nothing left to resolve.
--
-- pg_catalog is always searched implicitly, even with search_path = '', so
-- built-ins (now(), coalesce(), jsonb_build_object()) keep working. That is why
-- touch_updated_at() and the my_* helpers already survive with ''.
--
-- BODIES WERE READ FROM pg_proc, NOT FROM THE MIGRATION FILES. Recreating from
-- the repo would have silently reverted any dashboard edit. Only the
-- qualification changed; behaviour is identical.
--
-- ALSO FIXES A LIVE BUG: sync_order_stats() is a trigger on public.orders. Both
-- bare casts sit in the `delivered` branch, so it raises on every transition to
-- 'delivered' and nothing else -- an assigned/in_progress change cannot reach
-- them. Because there are zero orders in this database, nobody has hit it yet:
-- the first real order marked delivered would have failed.

-- ============================================================
-- 1. sync_order_stats -- was BROKEN, bare client_tier casts
-- ============================================================
create or replace function public.sync_order_stats()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- When delivered: update client LTV + designer completed_orders
  if new.status = 'delivered' and (old.status is null or old.status <> 'delivered') then
    update public.clients
    set
      ltv  = ltv + new.price,
      tier = case
               when ltv + new.price >= 500 then 'vip'::public.client_tier
               when ltv + new.price >= 50  then 'active'::public.client_tier
               else tier
             end,
      updated_at = now()
    where id = new.client_id;

    if new.designer_id is not null then
      update public.designers
      set completed_orders = completed_orders + 1, updated_at = now()
      where id = new.designer_id;
    end if;

    new.delivered_at = now();
  end if;

  -- When assigned: increment designer total_orders
  if new.status = 'assigned' and (old.status is null or old.status <> 'assigned') then
    if new.designer_id is not null then
      update public.designers
      set total_orders = total_orders + 1, updated_at = now()
      where id = new.designer_id;
    end if;
    new.assigned_at = now();
  end if;

  -- When in_progress: set timestamp
  if new.status = 'in_progress' and (old.status is null or old.status <> 'in_progress') then
    new.in_progress_at = now();
  end if;

  return new;
end; $$;

-- ============================================================
-- 2. handle_new_user -- bare user_role casts
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_role public.user_role;
begin
  begin
    v_role := coalesce(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'client'
    );
  exception when others then
    -- Was `when invalid_text_representation` only. That caught a bad role
    -- string but NOT an unresolvable type -- which is precisely how a broken
    -- search_path took signup down for months with a generic 500. Falling back
    -- to 'client' is always safe here. Keep this broad.
    v_role := 'client';
  end;

  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_role
  )
  on conflict (id) do nothing;

  if v_role = 'client' then
    insert into public.clients (user_id, company_name, country)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'company_name', ''),
      coalesce(new.raw_user_meta_data->>'country', '')
    )
    on conflict (user_id) do nothing;
  end if;

  if v_role = 'designer' then
    insert into public.designers (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end; $$;

-- ============================================================
-- 3. approve_subscription -- bare client_tier casts
-- ============================================================
-- SIGNATURE IS REBUILT FROM THE CATALOG, NOT TYPED.
--
-- approve_subscription appears in NO migration in this repo -- it was created in
-- the dashboard -- and it carries a parameter DEFAULT. CREATE OR REPLACE refuses
-- to remove a default from an existing function, so a hand-typed argument list
-- fails with 42P13 and rolls the entire file back. That is exactly what happened
-- on the first attempt at this migration.
--
-- pg_get_function_arguments() returns the deployed argument list *including its
-- defaults*, so the new definition matches by construction and cannot drift.
-- The body is passed as a format() ARGUMENT rather than inlined, so the `%`
-- characters inside `notes ilike '%subscription%'` are not read as format
-- specifiers.
do $do$
declare
  v_args text;
  v_body text := $body$
declare
  v_sub record;
  v_inv record;
  v_client_tier public.client_tier;
  v_new_tier    public.client_tier;
  v_tier_rank_new     int;
  v_tier_rank_current int;
begin
  -- 1. Get subscription
  select * into v_sub from public.client_subscriptions where id = p_sub_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Subscription not found');
  end if;

  -- 2. Activate subscription
  update public.client_subscriptions
  set status = 'active', updated_at = now()
  where id = p_sub_id;

  -- 3. Find and mark pending subscription invoice as paid
  select * into v_inv from public.invoices
  where client_id = p_client_id
    and status = 'pending'
    and notes ilike '%subscription%'
  order by created_at desc
  limit 1;

  if found then
    update public.invoices
    set status = 'paid',
        paid_at = now(),
        payoneer_checkout_url = coalesce(p_payment_link, payoneer_checkout_url)
    where id = v_inv.id;
  end if;

  -- 4. Upgrade client tier (never downgrade)
  select tier into v_client_tier from public.clients where id = p_client_id;

  case v_sub.plan
    when 'pro_max'  then v_new_tier := 'vip'::public.client_tier;
    when 'pro'      then v_new_tier := 'vip'::public.client_tier;
    when 'business' then v_new_tier := 'active'::public.client_tier;
    when 'starter'  then v_new_tier := 'new'::public.client_tier;
    else                 v_new_tier := 'new'::public.client_tier;
  end case;

  v_tier_rank_new := case v_new_tier::text
    when 'vip' then 2 when 'active' then 1 else 0 end;
  v_tier_rank_current := case v_client_tier::text
    when 'vip' then 2 when 'active' then 1 else 0 end;

  if v_tier_rank_new >= v_tier_rank_current then
    update public.clients set tier = v_new_tier where id = p_client_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'plan', v_sub.plan,
    'designs_total', v_sub.designs_total
  );
end;
$body$;
begin
  -- Exact OID lookup, not a proname match: a proname match would silently grab
  -- the wrong overload if one is ever added.
  select pg_get_function_arguments(p.oid) into v_args
  from pg_proc p
  where p.oid = to_regprocedure('public.approve_subscription(uuid, uuid, text)');

  if v_args is null then
    raise notice 'SKIP: approve_subscription not found';
    return;
  end if;

  raise notice 'approve_subscription rebuilt with args: %', v_args;
  execute format(
    'create or replace function public.approve_subscription(%s) '
    'returns jsonb language plpgsql security definer set search_path = %L as %L',
    v_args, '', v_body
  );
exception when others then
  raise notice 'approve_subscription rebuild FAILED: %', sqlerrm;
end $do$;

-- ============================================================
-- 4. decrement_credit_balance -- bare `clients`
-- ============================================================
-- Same treatment: not defined in any migration here, so the deployed signature
-- is unknown and is rebuilt from the catalog for the same reason.
do $do$
declare
  v_args text;
  v_body text := $body$
begin
  update public.clients set credit_balance = credit_balance - p_amount
  where id = p_client_id and credit_balance >= p_amount;
  return found;
end;
$body$;
begin
  select pg_get_function_arguments(p.oid) into v_args
  from pg_proc p
  where p.oid = to_regprocedure('public.decrement_credit_balance(uuid, integer)');

  if v_args is null then
    raise notice 'SKIP: decrement_credit_balance not found';
    return;
  end if;

  raise notice 'decrement_credit_balance rebuilt with args: %', v_args;
  execute format(
    'create or replace function public.decrement_credit_balance(%s) '
    'returns boolean language plpgsql security definer set search_path = %L as %L',
    v_args, '', v_body
  );
exception when others then
  raise notice 'decrement_credit_balance rebuild FAILED: %', sqlerrm;
end $do$;

-- ============================================================
-- 5. Pin search_path = '' on the functions that were only pinned
--    to a path -- they are already clean, so this makes it permanent
--    without touching their bodies.
-- ============================================================
-- These eight already use qualified names or only pg_catalog built-ins, which
-- is why they survived the original breakage. Setting '' is now a no-op in
-- behaviour and makes their intent explicit.
do $$
declare
  fn  text;
  fns text[] := array[
    'public.my_role()',
    'public.my_client_id()',
    'public.my_designer_id()',
    'public.touch_updated_at()',
    'public.update_coupon_updated_at()',
    'public.update_updated_at()',
    'public.get_subscription_designs_remaining(uuid)',
    'public.increment_sub_usage(uuid)',
    'public.increment_sub_usage(uuid, integer)',
    'public.decrement_sub_usage(uuid)',
    'public.decrement_sub_usage(uuid, integer)',
    'public.increment_coupon_counter(uuid)'
  ];
begin
  foreach fn in array fns loop
    if to_regprocedure(fn) is null then
      raise notice 'SKIP (absent): %', fn;
      continue;
    end if;
    -- ALTER requires OWNERSHIP, not just existence -- to_regprocedure cannot
    -- tell us that. This is the only object-DDL statement in the file not
    -- otherwise guarded, and an unhandled `must be owner of function` here
    -- would roll back every CREATE OR REPLACE above it. That is exactly how
    -- migration 034 died silently. Isolated per function so at worst one
    -- function keeps its old search_path.
    begin
      execute format('alter function %s set search_path = %L', fn, '');
    exception when others then
      raise notice 'ALTER FAILED (not owner?) %: %', fn, sqlerrm;
    end;
  end loop;
end $$;

-- ============================================================
-- 6. Grant repair
-- ============================================================
-- CREATE OR REPLACE preserves OID and therefore existing grants, so 042's
-- grants survive. This is belt-and-braces in case anything was revoked between
-- then and now, wrapped so an ownership failure cannot abort the file.
do $$
declare fn text;
begin
  -- Browser-called (see the header of 042) -- must stay reachable.
  foreach fn in array array[
    'public.approve_subscription(uuid, uuid, text)',
    'public.increment_sub_usage(uuid)',
    'public.increment_sub_usage(uuid, integer)',
    'public.decrement_sub_usage(uuid)',
    'public.decrement_sub_usage(uuid, integer)',
    'public.decrement_credit_balance(uuid, integer)'
  ] loop
    if to_regprocedure(fn) is null then continue; end if;
    begin
      execute format('revoke execute on function %s from public, anon', fn);
      execute format('grant execute on function %s to authenticated', fn);
    exception when others then
      raise notice 'grant repair FAILED (not owner?) %: %', fn, sqlerrm;
    end;
  end loop;

  begin
    execute 'revoke execute on function public.handle_new_user() from public, anon, authenticated';
    execute 'grant execute on function public.handle_new_user() to supabase_auth_admin';
  exception when others then
    raise notice 'handle_new_user grant repair FAILED: %', sqlerrm;
  end;
end $$;

-- The inline helper functions are only ever called by triggers, but pin them to
-- service-safe grants so anon cannot reach them via /rest/v1/rpc/.
do $$
declare fn text;
begin
  foreach fn in array array[
    'public.sync_order_stats()', 'public.touch_updated_at()',
    'public.update_coupon_updated_at()', 'public.update_updated_at()'
  ] loop
    if to_regprocedure(fn) is null then continue; end if;
    begin
      execute format('revoke execute on function %s from public, anon, authenticated', fn);
    exception when others then
      raise notice 'revoke FAILED for %: %', fn, sqlerrm;
    end;
  end loop;
end $$;

notify pgrst, 'reload schema';

-- Execution marker. A migration is one transaction: if this row is present the
-- WHOLE file committed; if absent, nothing did and you are looking at another
-- silent rollback. Same pattern as 042.
create table if not exists public.zz_migration_probe (
  id         int primary key,
  label      text,
  applied_at timestamptz not null default now()
);
insert into public.zz_migration_probe (id, label)
values (1, '044_qualify_function_bodies')
on conflict (id) do update set label = excluded.label, applied_at = now();

-- ============================================================
-- VERIFY
-- ============================================================
-- Every listed function should show search_path="" (or search_path=pg_catalog),
-- and handle_new_user must keep its grant to supabase_auth_admin.
select
  p.oid::regprocedure::text                            as function,
  coalesce(array_to_string(p.proconfig, ', '), '(none)') as config,
  has_function_privilege('anon',         p.oid, 'EXECUTE') as anon_can,
  has_function_privilege('authenticated',p.oid, 'EXECUTE') as authd_can,
  has_function_privilege('supabase_auth_admin', p.oid, 'EXECUTE') as authadmin_can
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'handle_new_user', 'sync_order_stats', 'approve_subscription',
    'decrement_credit_balance', 'increment_sub_usage', 'decrement_sub_usage',
    'increment_coupon_counter', 'get_subscription_designs_remaining',
    'touch_updated_at', 'update_coupon_updated_at', 'update_updated_at',
    'my_role', 'my_client_id', 'my_designer_id'
  )
order by p.proname;
