-- ============================================================
-- STITCHPRO SETUP — STEP 4 of 5
-- Paste this in Supabase SQL Editor and click RUN
-- Run AFTER Step 3
-- ============================================================

-- Auto updated_at function
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- Apply updated_at to all tables that have it
drop trigger if exists trg_users_upd        on public.users;
drop trigger if exists trg_clients_upd      on public.clients;
drop trigger if exists trg_designers_upd    on public.designers;
drop trigger if exists trg_orders_upd       on public.orders;
drop trigger if exists trg_invoices_upd     on public.invoices;
drop trigger if exists trg_crm_leads_upd    on public.crm_leads;
drop trigger if exists trg_svc_tiers_upd    on public.service_tiers;

create trigger trg_users_upd     before update on public.users        for each row execute function public.touch_updated_at();
create trigger trg_clients_upd   before update on public.clients      for each row execute function public.touch_updated_at();
create trigger trg_designers_upd before update on public.designers    for each row execute function public.touch_updated_at();
create trigger trg_orders_upd    before update on public.orders       for each row execute function public.touch_updated_at();
create trigger trg_invoices_upd  before update on public.invoices     for each row execute function public.touch_updated_at();
create trigger trg_crm_leads_upd before update on public.crm_leads   for each row execute function public.touch_updated_at();
create trigger trg_svc_tiers_upd before update on public.service_tiers for each row execute function public.touch_updated_at();

-- Auto-create user profile when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role user_role := 'client';
begin
  begin
    v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'client');
  exception when others then
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper functions for RLS
create or replace function public.my_role()
returns user_role language sql security definer stable as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.my_client_id()
returns uuid language sql security definer stable as $$
  select id from public.clients where user_id = auth.uid()
$$;

create or replace function public.my_designer_id()
returns uuid language sql security definer stable as $$
  select id from public.designers where user_id = auth.uid()
$$;

select 'Step 4 done ✓ — triggers and functions created' as status;
