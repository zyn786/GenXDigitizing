-- ============================================================
-- GenXdigitizing — Complete Database Schema v1
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
do $$ begin
  create type user_role      as enum ('admin','crm','client','designer');
  create type order_status   as enum ('submitted','assigned','in_progress','review','delivered','revision','refunded','cancelled');
  create type service_cat    as enum ('digitizing','vector','sewout');
  create type output_fmt     as enum ('DST','PES','EMB','JEF','XXX','VIP','HUS','EXP','VP3','SEW','AI','SVG','EPS','PDF');
  create type client_tier    as enum ('new','active','vip');
  create type priority_lvl   as enum ('low','medium','high');
  create type pay_status     as enum ('pending','paid','refunded','failed');
  create type lead_stage     as enum ('lead','contacted','quote_sent','negotiation','won','lost');
  create type notif_type     as enum ('order_update','message','payment','system','sla_warning','review');
  create type file_type      as enum ('artwork','output','revision');
  create type turnaround_opt as enum ('standard','rush','urgent');
exception when duplicate_object then null;
end $$;

-- ============================================================
-- TABLE 1: users  (mirrors auth.users)
-- ============================================================
create table if not exists public.users (
  id           uuid        primary key references auth.users(id) on delete cascade,
  email        text        not null unique,
  full_name    text        not null default '',
  avatar_url   text,
  role         user_role   not null default 'client',
  is_active    boolean     not null default true,
  last_sign_in timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.users is 'Platform user profiles — mirrors auth.users with role assignments';

-- ============================================================
-- TABLE 2: service_tiers  (pricing — admin-editable)
-- ============================================================
create table if not exists public.service_tiers (
  id            text        primary key, -- e.g. 'digitizing_standard'
  category      service_cat not null,
  label         text        not null,
  size_desc     text        not null,    -- e.g. '4″–8″'
  price         numeric(8,2) not null,
  est_hours     text        not null,    -- e.g. '12–24h'
  is_big_design boolean     not null default false,
  is_active     boolean     not null default true,
  sort_order    int         not null default 0,
  updated_at    timestamptz not null default now()
);
comment on table public.service_tiers is 'Service tiers with admin-adjustable pricing';

-- Seed default pricing
insert into public.service_tiers (id, category, label, size_desc, price, est_hours, is_big_design, sort_order)
values
  ('digitizing_standard', 'digitizing', 'Standard Design',       '4″–8″',        7,  '12–24h', false, 1),
  ('digitizing_large',    'digitizing', 'Large Design',          '8″–12″',       18, '12–24h', false, 2),
  ('digitizing_jumbo',    'digitizing', 'Jumbo / Full Back',     '12″+',         25, '~12h',   true,  3),
  ('vector_basic',        'vector',     'Basic Logo',            'Up to 2 colors', 8, '12–24h', false, 4),
  ('vector_standard',     'vector',     'Standard',              'Up to 5 colors',15, '12–24h', false, 5),
  ('vector_complex',      'vector',     'Complex Illustration',  'Multi-color',  30, '~12h',   true,  6),
  ('sewout_standard',     'sewout',     'Standard Design',       '4″–8″',         5, '12–24h', false, 7),
  ('sewout_large',        'sewout',     'Large Design',          '8″–12″',        10, '12–24h', false, 8),
  ('sewout_jumbo',        'sewout',     'Jumbo / Full Back',     '12″+',          15, '~12h',   true,  9)
on conflict (id) do nothing;

-- ============================================================
-- TABLE 3: clients
-- ============================================================
create table if not exists public.clients (
  id             uuid          primary key default uuid_generate_v4(),
  user_id        uuid          not null unique references public.users(id) on delete cascade,
  company_name   text          not null default '',
  country        text          not null default '',
  phone          text,
  address        text,
  tier           client_tier   not null default 'new',
  ltv            numeric(12,2) not null default 0,
  credit_balance numeric(12,2) not null default 0,
  notes          text,
  joined_at      timestamptz   not null default now(),
  updated_at     timestamptz   not null default now()
);
comment on table public.clients is 'Extended client profiles with LTV and tier tracking';

-- ============================================================
-- TABLE 4: designers
-- ============================================================
create table if not exists public.designers (
  id               uuid          primary key default uuid_generate_v4(),
  user_id          uuid          not null unique references public.users(id) on delete cascade,
  avg_turnaround_h numeric(6,2)  not null default 0,
  avg_rating       numeric(3,2)  not null default 5.0,
  revision_rate    numeric(5,2)  not null default 0,
  total_orders     int           not null default 0,
  completed_orders int           not null default 0,
  specialties      text[],
  updated_at       timestamptz   not null default now()
);
comment on table public.designers is 'Designer profiles with auto-calculated performance stats';

-- ============================================================
-- TABLE 5: orders
-- ============================================================
create sequence if not exists order_number_seq start 1000;

create table if not exists public.orders (
  id                 uuid           primary key default uuid_generate_v4(),
  order_number       text           not null unique default ('ORD-' || lpad(nextval('order_number_seq')::text, 4, '0')),
  client_id          uuid           not null references public.clients(id) on delete restrict,
  designer_id        uuid           references public.designers(id) on delete set null,
  service_tier_id    text           not null references public.service_tiers(id),
  output_format      output_fmt     not null default 'DST',
  additional_formats output_fmt[],
  turnaround         turnaround_opt not null default 'standard',
  status             order_status   not null default 'submitted',
  priority           priority_lvl   not null default 'medium',
  width_inches       numeric(6,2),
  height_inches      numeric(6,2),
  stitch_count       int,
  color_count        int,
  placement_notes    text,
  admin_notes        text,
  price              numeric(10,2)  not null,
  currency           text           not null default 'USD',
  sla_deadline       timestamptz,
  assigned_at        timestamptz,
  in_progress_at     timestamptz,
  completed_at       timestamptz,
  delivered_at       timestamptz,
  created_at         timestamptz    not null default now(),
  updated_at         timestamptz    not null default now()
);
comment on table public.orders is 'Central order table — every digitizing job';

-- ============================================================
-- TABLE 6: order_files
-- ============================================================
create table if not exists public.order_files (
  id           uuid        primary key default uuid_generate_v4(),
  order_id     uuid        not null references public.orders(id) on delete cascade,
  file_url     text        not null,
  file_name    text        not null,
  file_type    file_type   not null,
  format       output_fmt,
  stitch_count int,
  file_size_kb int,
  version      int         not null default 1,
  uploaded_by  uuid        not null references public.users(id),
  notes        text,
  created_at   timestamptz not null default now()
);
comment on table public.order_files is 'Versioned artwork and output files per order';

-- ============================================================
-- TABLE 7: invoices
-- ============================================================
create sequence if not exists invoice_number_seq start 1000;

create table if not exists public.invoices (
  id                    uuid       primary key default uuid_generate_v4(),
  invoice_number        text       not null unique default ('INV-' || lpad(nextval('invoice_number_seq')::text, 4, '0')),
  order_id              uuid       not null unique references public.orders(id) on delete restrict,
  client_id             uuid       not null references public.clients(id) on delete restrict,
  amount                numeric(10,2) not null,
  currency              text       not null default 'USD',
  status                pay_status not null default 'pending',
  payoneer_ref          text,
  payoneer_checkout_url text,
  pdf_url               text,
  paid_at               timestamptz,
  due_at                timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table public.invoices is 'Payoneer payment records — one per order';

-- ============================================================
-- TABLE 8: messages
-- ============================================================
create table if not exists public.messages (
  id         uuid        primary key default uuid_generate_v4(),
  from_user  uuid        not null references public.users(id) on delete cascade,
  to_user    uuid        not null references public.users(id) on delete cascade,
  order_id   uuid        references public.orders(id) on delete set null,
  subject    text,
  body       text        not null,
  file_url   text,
  is_read    boolean     not null default false,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.messages is 'Client-CRM threaded messaging';

-- ============================================================
-- TABLE 9: reviews
-- ============================================================
create table if not exists public.reviews (
  id           uuid        primary key default uuid_generate_v4(),
  order_id     uuid        not null unique references public.orders(id) on delete cascade,
  client_id    uuid        not null references public.clients(id) on delete cascade,
  stars        smallint    not null check (stars between 1 and 5),
  text         text,
  is_published boolean     not null default true,
  created_at   timestamptz not null default now()
);
comment on table public.reviews is 'Client reviews — one per delivered order';

-- ============================================================
-- TABLE 10: crm_leads
-- ============================================================
create table if not exists public.crm_leads (
  id            uuid       primary key default uuid_generate_v4(),
  contact_name  text       not null,
  email         text       not null,
  company       text,
  phone         text,
  country       text,
  stage         lead_stage not null default 'lead',
  deal_value    numeric(10,2),
  assigned_to   uuid       references public.users(id) on delete set null,
  follow_up_at  timestamptz,
  lost_reason   text,
  notes         text,
  source        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.crm_leads is 'Sales pipeline leads';

-- ============================================================
-- TABLE 11: notifications
-- ============================================================
create table if not exists public.notifications (
  id         uuid       primary key default uuid_generate_v4(),
  user_id    uuid       not null references public.users(id) on delete cascade,
  type       notif_type not null default 'system',
  title      text       not null,
  body       text       not null,
  action_url text,
  is_read    boolean    not null default false,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.notifications is 'In-app notifications — realtime via Supabase';

-- ============================================================
-- TABLE 12: audit_logs
-- ============================================================
create table if not exists public.audit_logs (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        references public.users(id) on delete set null,
  action     text        not null,
  entity     text        not null,
  entity_id  uuid,
  old_data   jsonb,
  new_data   jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
comment on table public.audit_logs is 'Immutable admin audit trail';

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_orders_client       on public.orders(client_id);
create index if not exists idx_orders_designer     on public.orders(designer_id);
create index if not exists idx_orders_status       on public.orders(status);
create index if not exists idx_orders_created      on public.orders(created_at desc);
create index if not exists idx_orders_sla          on public.orders(sla_deadline) where status not in ('delivered','cancelled','refunded');
create index if not exists idx_files_order         on public.order_files(order_id);
create index if not exists idx_invoices_client     on public.invoices(client_id);
create index if not exists idx_invoices_status     on public.invoices(status);
create index if not exists idx_messages_from       on public.messages(from_user);
create index if not exists idx_messages_to         on public.messages(to_user, is_read);
create index if not exists idx_notifs_user         on public.notifications(user_id, is_read);
create index if not exists idx_notifs_created      on public.notifications(created_at desc);
create index if not exists idx_reviews_client      on public.reviews(client_id);
create index if not exists idx_leads_stage         on public.crm_leads(stage);
create index if not exists idx_leads_assigned      on public.crm_leads(assigned_to);
create index if not exists idx_audit_entity        on public.audit_logs(entity, entity_id);
create index if not exists idx_audit_user          on public.audit_logs(user_id);

-- ============================================================
-- TRIGGERS: auto updated_at
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

do $$ declare t text;
begin
  foreach t in array array['users','clients','designers','orders','invoices','crm_leads','service_tiers']
  loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ============================================================
-- TRIGGER: auto-create user profile + client record on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role user_role;
begin
  -- Extract role from metadata (defaults to 'client')
  begin
    v_role := coalesce(
      (new.raw_user_meta_data->>'role')::user_role,
      'client'
    );
  exception when invalid_text_representation then
    v_role := 'client';
  end;

  -- Insert user profile
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_role
  )
  on conflict (id) do nothing;

  -- Auto-create client profile
  if v_role = 'client' then
    insert into public.clients (user_id, company_name, country)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'company_name', ''),
      coalesce(new.raw_user_meta_data->>'country', '')
    )
    on conflict (user_id) do nothing;
  end if;

  -- Auto-create designer profile
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

-- ============================================================
-- TRIGGER: sync designer stats on order status change
-- ============================================================
create or replace function public.sync_order_stats()
returns trigger language plpgsql security definer as $$
begin
  -- When delivered: update client LTV + designer completed_orders
  if new.status = 'delivered' and (old.status is null or old.status <> 'delivered') then
    -- Update LTV and tier
    update public.clients
    set
      ltv  = ltv + new.price,
      tier = case
               when ltv + new.price >= 500 then 'vip'::client_tier
               when ltv + new.price >= 50  then 'active'::client_tier
               else tier
             end,
      updated_at = now()
    where id = new.client_id;

    -- Update designer completed count
    if new.designer_id is not null then
      update public.designers
      set completed_orders = completed_orders + 1, updated_at = now()
      where id = new.designer_id;
    end if;

    -- Set delivered timestamp
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

drop trigger if exists trg_sync_order_stats on public.orders;
create trigger trg_sync_order_stats
  before update on public.orders
  for each row execute function public.sync_order_stats();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.users           enable row level security;
alter table public.service_tiers   enable row level security;
alter table public.clients         enable row level security;
alter table public.designers       enable row level security;
alter table public.orders          enable row level security;
alter table public.order_files     enable row level security;
alter table public.invoices        enable row level security;
alter table public.messages        enable row level security;
alter table public.reviews         enable row level security;
alter table public.crm_leads       enable row level security;
alter table public.notifications   enable row level security;
alter table public.audit_logs      enable row level security;

-- Drop all existing policies (idempotent re-run)
do $$ declare r record; begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ── Helper functions ──────────────────────────────────────────
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

-- ── service_tiers (public read, admin write) ──────────────────
create policy "tiers_read_all"   on public.service_tiers for select using (true);
create policy "tiers_admin_write" on public.service_tiers for all using (public.my_role() = 'admin');

-- ── users ─────────────────────────────────────────────────────
create policy "users_read"   on public.users for select using (id = auth.uid() or public.my_role() in ('admin','crm'));
create policy "users_insert" on public.users for insert with check (id = auth.uid() or public.my_role() = 'admin');
create policy "users_update" on public.users for update using (id = auth.uid() or public.my_role() = 'admin');
create policy "users_delete" on public.users for delete using (public.my_role() = 'admin');

-- ── clients ───────────────────────────────────────────────────
create policy "clients_read"   on public.clients for select using (user_id = auth.uid() or public.my_role() in ('admin','crm'));
create policy "clients_insert" on public.clients for insert with check (user_id = auth.uid() or public.my_role() = 'admin');
create policy "clients_update" on public.clients for update using (user_id = auth.uid() or public.my_role() in ('admin','crm'));
create policy "clients_delete" on public.clients for delete using (public.my_role() = 'admin');

-- ── designers ─────────────────────────────────────────────────
create policy "designers_read"   on public.designers for select using (user_id = auth.uid() or public.my_role() = 'admin');
create policy "designers_insert" on public.designers for insert with check (user_id = auth.uid() or public.my_role() = 'admin');
create policy "designers_update" on public.designers for update using (user_id = auth.uid() or public.my_role() = 'admin');

-- ── orders ────────────────────────────────────────────────────
create policy "orders_admin_all"      on public.orders for all  using (public.my_role() = 'admin');
create policy "orders_crm_read"       on public.orders for select using (public.my_role() = 'crm');
create policy "orders_client_read"    on public.orders for select using (public.my_role() = 'client' and client_id = public.my_client_id());
create policy "orders_client_insert"  on public.orders for insert with check (public.my_role() = 'client' and client_id = public.my_client_id());
create policy "orders_designer_read"  on public.orders for select using (public.my_role() = 'designer' and designer_id = public.my_designer_id());
create policy "orders_designer_upd"   on public.orders for update using (public.my_role() = 'designer' and designer_id = public.my_designer_id()) with check (status in ('in_progress','review'));

-- ── order_files ───────────────────────────────────────────────
create policy "files_admin"          on public.order_files for all    using (public.my_role() = 'admin');
create policy "files_client_read"    on public.order_files for select using (public.my_role() = 'client' and order_id in (select id from public.orders where client_id = public.my_client_id()));
create policy "files_designer_all"   on public.order_files for all    using (public.my_role() = 'designer' and order_id in (select id from public.orders where designer_id = public.my_designer_id()));
create policy "files_crm_read"       on public.order_files for select using (public.my_role() = 'crm');

-- ── invoices ──────────────────────────────────────────────────
create policy "invoices_admin"       on public.invoices for all    using (public.my_role() = 'admin');
create policy "invoices_client_read" on public.invoices for select using (public.my_role() = 'client' and client_id = public.my_client_id());
create policy "invoices_client_ins"  on public.invoices for insert with check (public.my_role() = 'client' and client_id = public.my_client_id());
create policy "invoices_crm_read"    on public.invoices for select using (public.my_role() = 'crm');

-- ── messages ──────────────────────────────────────────────────
create policy "messages_all" on public.messages for all using (from_user = auth.uid() or to_user = auth.uid() or public.my_role() in ('admin','crm'));

-- ── reviews ───────────────────────────────────────────────────
create policy "reviews_read_all"    on public.reviews for select using (is_published = true or public.my_role() in ('admin','crm'));
create policy "reviews_client_ins"  on public.reviews for insert with check (public.my_role() = 'client' and client_id = public.my_client_id());
create policy "reviews_admin_all"   on public.reviews for all    using (public.my_role() = 'admin');

-- ── crm_leads ─────────────────────────────────────────────────
create policy "leads_crm_admin" on public.crm_leads for all using (public.my_role() in ('admin','crm'));

-- ── notifications ─────────────────────────────────────────────
create policy "notifs_own"   on public.notifications for all using (user_id = auth.uid() or public.my_role() = 'admin');

-- ── audit_logs ────────────────────────────────────────────────
create policy "audit_admin"  on public.audit_logs for select using (public.my_role() = 'admin');
create policy "audit_insert" on public.audit_logs for insert with check (true); -- any authenticated user can write

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('artwork',  'artwork',  false, 52428800, array['image/png','image/jpeg','image/webp','application/pdf','application/postscript','image/svg+xml']),
  ('outputs',  'outputs',  false, 20971520, null),
  ('invoices', 'invoices', false, 5242880,  array['application/pdf']),
  ('avatars',  'avatars',  true,  2097152,  array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- Storage policies
create policy "artwork_upload"  on storage.objects for insert with check (bucket_id = 'artwork'  and public.my_role() in ('client','admin'));
create policy "artwork_read"    on storage.objects for select using  (bucket_id = 'artwork'  and public.my_role() in ('admin','designer','client'));
create policy "outputs_upload"  on storage.objects for insert with check (bucket_id = 'outputs'  and public.my_role() in ('designer','admin'));
create policy "outputs_read"    on storage.objects for select using  (bucket_id = 'outputs'  and public.my_role() in ('admin','client','designer'));
create policy "invoices_read"   on storage.objects for select using  (bucket_id = 'invoices' and public.my_role() in ('admin','client'));
create policy "avatars_public"  on storage.objects for select using  (bucket_id = 'avatars');
create policy "avatars_upload"  on storage.objects for insert with check (bucket_id = 'avatars');

-- ============================================================
-- DONE — Run seeds next (002_seed.sql)
-- ============================================================
