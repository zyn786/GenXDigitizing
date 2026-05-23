-- ============================================================
-- STITCHPRO SETUP — STEP 5 of 5
-- Paste this in Supabase SQL Editor and click RUN
-- Run AFTER Step 4
-- ============================================================

-- Enable RLS on all tables
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

-- Drop any old policies first
do $$ declare r record; begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- service_tiers: everyone can read, only admin can write
create policy "tiers_read"  on public.service_tiers for select using (true);
create policy "tiers_write" on public.service_tiers for all    using (public.my_role() = 'admin');

-- users
create policy "users_read"   on public.users for select using (id = auth.uid() or public.my_role() in ('admin','crm'));
create policy "users_insert" on public.users for insert with check (id = auth.uid() or public.my_role() = 'admin');
create policy "users_update" on public.users for update using (id = auth.uid() or public.my_role() = 'admin');
create policy "users_delete" on public.users for delete using (public.my_role() = 'admin');

-- clients
create policy "clients_read"   on public.clients for select using (user_id = auth.uid() or public.my_role() in ('admin','crm'));
create policy "clients_insert" on public.clients for insert with check (user_id = auth.uid() or public.my_role() = 'admin');
create policy "clients_update" on public.clients for update using (user_id = auth.uid() or public.my_role() in ('admin','crm'));
create policy "clients_delete" on public.clients for delete using (public.my_role() = 'admin');

-- designers
create policy "designers_read"   on public.designers for select using (user_id = auth.uid() or public.my_role() = 'admin');
create policy "designers_insert" on public.designers for insert with check (user_id = auth.uid() or public.my_role() = 'admin');
create policy "designers_update" on public.designers for update using (user_id = auth.uid() or public.my_role() = 'admin');

-- orders
create policy "orders_admin"          on public.orders for all    using (public.my_role() = 'admin');
create policy "orders_crm_read"       on public.orders for select using (public.my_role() = 'crm');
create policy "orders_client_read"    on public.orders for select using (public.my_role() = 'client' and client_id = public.my_client_id());
create policy "orders_client_insert"  on public.orders for insert with check (public.my_role() = 'client' and client_id = public.my_client_id());
create policy "orders_designer_read"  on public.orders for select using (public.my_role() = 'designer' and designer_id = public.my_designer_id());
create policy "orders_designer_upd"   on public.orders for update using (public.my_role() = 'designer' and designer_id = public.my_designer_id()) with check (status in ('in_progress','review'));

-- order_files
create policy "files_admin"       on public.order_files for all    using (public.my_role() = 'admin');
create policy "files_client_read"   on public.order_files for select using (public.my_role() = 'client' and order_id in (select id from public.orders where client_id = public.my_client_id()));
create policy "files_client_insert" on public.order_files for insert with check (public.my_role() = 'client' and order_id in (select id from public.orders where client_id = public.my_client_id()));
create policy "files_designer"    on public.order_files for all    using (public.my_role() = 'designer' and order_id in (select id from public.orders where designer_id = public.my_designer_id()));
create policy "files_crm_read"    on public.order_files for select using (public.my_role() = 'crm');

-- invoices
create policy "invoices_admin"        on public.invoices for all    using (public.my_role() = 'admin');
create policy "invoices_client_read"  on public.invoices for select using (public.my_role() = 'client' and client_id = public.my_client_id());
create policy "invoices_client_ins"   on public.invoices for insert with check (public.my_role() = 'client' and client_id = public.my_client_id());
create policy "invoices_crm_read"     on public.invoices for select using (public.my_role() = 'crm');

-- messages
create policy "messages_all" on public.messages for all using (from_user = auth.uid() or to_user = auth.uid() or public.my_role() in ('admin','crm'));

-- reviews
create policy "reviews_read"        on public.reviews for select using (is_published = true or public.my_role() in ('admin','crm'));
create policy "reviews_designer_read" on public.reviews for select using (public.my_role() = 'designer' and order_id in (select id from public.orders where designer_id = public.my_designer_id()));
create policy "reviews_client_ins"  on public.reviews for insert with check (public.my_role() = 'client' and client_id = public.my_client_id());
create policy "reviews_admin"       on public.reviews for all    using (public.my_role() = 'admin');

-- crm_leads
create policy "leads_crm_admin" on public.crm_leads for all using (public.my_role() in ('admin','crm'));

-- notifications
create policy "notifs_own" on public.notifications for all using (user_id = auth.uid() or public.my_role() = 'admin');

-- audit_logs
create policy "audit_admin"  on public.audit_logs for select using (public.my_role() = 'admin');
create policy "audit_insert" on public.audit_logs for insert with check (true);

-- ============================================================
-- Storage buckets
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('artwork',  'artwork',  false, 52428800),
  ('outputs',  'outputs',  false, 20971520),
  ('invoices', 'invoices', false, 5242880),
  ('avatars',  'avatars',  true,  2097152)
on conflict (id) do nothing;

-- Storage policies (if not already exist)
do $$ begin
  create policy "artwork_upload"  on storage.objects for insert with check (bucket_id = 'artwork'  and public.my_role() in ('client','admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "artwork_read"    on storage.objects for select using  (bucket_id = 'artwork'  and public.my_role() in ('admin','designer','client'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "outputs_upload"  on storage.objects for insert with check (bucket_id = 'outputs'  and public.my_role() in ('designer','admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "outputs_read"    on storage.objects for select using  (bucket_id = 'outputs'  and public.my_role() in ('admin','client','designer'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "invoices_read"   on storage.objects for select using  (bucket_id = 'invoices' and public.my_role() in ('admin','client'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "avatars_all"     on storage.objects for all using (bucket_id = 'avatars');
exception when duplicate_object then null; end $$;

-- ============================================================
-- FIX YOUR EXISTING ACCOUNT (zainjafri35@gmail.com)
-- ============================================================

-- Create user profile (you signed up before tables existed)
insert into public.users (id, email, full_name, role)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', 'Admin'),
  'admin'
from auth.users
where email = 'zainjafri35@gmail.com'
on conflict (id) do update set role = 'admin', is_active = true;

-- Create client record (required for all users)
insert into public.clients (user_id, company_name, country)
select id, 'GenXdigitizing', 'Pakistan'
from auth.users
where email = 'zainjafri35@gmail.com'
on conflict (user_id) do nothing;

-- ============================================================
-- VERIFY EVERYTHING WORKED
-- ============================================================
select
  'Tables' as check,
  count(*)::text as result
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'

union all

select
  'Your user row' as check,
  coalesce(role::text, 'MISSING') as result
from public.users
where email = 'zainjafri35@gmail.com'

union all

select
  'Service tiers' as check,
  count(*)::text || ' tiers' as result
from public.service_tiers

union all

select
  'RLS policies' as check,
  count(*)::text || ' policies' as result
from pg_policies
where schemaname = 'public';
