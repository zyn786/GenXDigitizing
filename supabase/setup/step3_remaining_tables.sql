-- ============================================================
-- STITCHPRO SETUP — STEP 3 of 5
-- Paste this in Supabase SQL Editor and click RUN
-- Run AFTER Step 2
-- ============================================================

-- TABLE: order_files
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

-- TABLE: invoices
create sequence if not exists invoice_number_seq start 1000;

create table if not exists public.invoices (
  id                    uuid       primary key default uuid_generate_v4(),
  invoice_number        text       not null unique default ('INV-GX' || lpad(nextval('invoice_number_seq')::text, 5, '0')),
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

-- TABLE: messages
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

-- TABLE: reviews
create table if not exists public.reviews (
  id           uuid        primary key default uuid_generate_v4(),
  order_id     uuid        not null unique references public.orders(id) on delete cascade,
  client_id    uuid        not null references public.clients(id) on delete cascade,
  stars        smallint    not null check (stars between 1 and 5),
  text         text,
  is_published boolean     not null default true,
  created_at   timestamptz not null default now()
);

-- TABLE: crm_leads
create sequence if not exists quote_number_seq start 1000;
create table if not exists public.crm_leads (
  id            uuid       primary key default uuid_generate_v4(),
  quote_number  text       unique default ('QT-GX' || lpad(nextval('quote_number_seq')::text, 5, '0')),
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

-- TABLE: notifications
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

-- TABLE: audit_logs
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

-- Indexes
create index if not exists idx_orders_client    on public.orders(client_id);
create index if not exists idx_orders_designer  on public.orders(designer_id);
create index if not exists idx_orders_status    on public.orders(status);
create index if not exists idx_orders_created   on public.orders(created_at desc);
create index if not exists idx_notifs_user      on public.notifications(user_id, is_read);
create index if not exists idx_messages_to      on public.messages(to_user, is_read);

select 'Step 3 done ✓ — all 12 tables created' as status;
