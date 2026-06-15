-- ============================================================
-- STITCHPRO SETUP — STEP 2 of 5
-- Paste this in Supabase SQL Editor and click RUN
-- Run AFTER Step 1
-- ============================================================

-- TABLE: users
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

-- TABLE: service_tiers (admin-adjustable pricing)
create table if not exists public.service_tiers (
  id            text         primary key,
  category      service_cat  not null,
  label         text         not null,
  size_desc     text         not null,
  price         numeric(8,2) not null,
  est_hours     text         not null,
  is_big_design boolean      not null default false,
  is_active     boolean      not null default true,
  sort_order    int          not null default 0,
  updated_at    timestamptz  not null default now()
);

-- Seed default pricing
insert into public.service_tiers (id, category, label, size_desc, price, est_hours, is_big_design, sort_order)
values
  ('digitizing_standard', 'digitizing', 'Standard Design',      '4"-8"',         7,  '12-24h', false, 1),
  ('digitizing_large',    'digitizing', 'Large Design',         '8"-12"',        18, '12-24h', false, 2),
  ('digitizing_jumbo',    'digitizing', 'Jumbo / Full Back',    '12"+',          25, '~12h',   true,  3),
  ('vector_basic',        'vector',     'Basic Logo',           'Up to 2 colors', 8, '12-24h', false, 4),
  ('vector_standard',     'vector',     'Standard',             'Up to 5 colors',15, '12-24h', false, 5),
  ('vector_complex',      'vector',     'Complex Illustration', 'Multi-color',   30, '~12h',   true,  6),
  ('sewout_standard',     'sewout',     'Standard Design',      '4"-8"',          5, '12-24h', false, 7),
  ('sewout_large',        'sewout',     'Large Design',         '8"-12"',        10, '12-24h', false, 8),
  ('sewout_jumbo',        'sewout',     'Jumbo / Full Back',    '12"+',          15, '~12h',   true,  9)
on conflict (id) do nothing;

-- TABLE: clients
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

-- TABLE: designers
create table if not exists public.designers (
  id               uuid         primary key default uuid_generate_v4(),
  user_id          uuid         not null unique references public.users(id) on delete cascade,
  avg_turnaround_h numeric(6,2) not null default 0,
  avg_rating       numeric(3,2) not null default 5.0,
  revision_rate    numeric(5,2) not null default 0,
  total_orders     int          not null default 0,
  completed_orders int          not null default 0,
  specialties      text[],
  updated_at       timestamptz  not null default now()
);

-- TABLE: orders
create sequence if not exists order_number_seq start 1000;

create table if not exists public.orders (
  id                 uuid           primary key default uuid_generate_v4(),
  order_number       text           not null unique default ('OD-GX' || lpad(nextval('order_number_seq')::text, 5, '0')),
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

select 'Step 2 done ✓ — core tables created' as status;
