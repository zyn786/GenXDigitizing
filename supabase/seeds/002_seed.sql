-- ============================================================
-- GenXdigitizing — Seed Data
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- STEP 1: Create your admin account
-- ============================================================
-- 1. Go to https://your-project.supabase.co/auth/users
-- 2. Click "Invite user" → enter your email
-- 3. Accept the invite and set your password
-- 4. Then run the query below to promote to admin:

-- UPDATE public.users
-- SET role = 'admin', full_name = 'Your Name'
-- WHERE email = 'your@email.com';

-- ============================================================
-- STEP 2 (optional): Create test accounts for development
-- ============================================================
-- Run this ONLY in development — never in production

/*
-- Test client
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  uuid_generate_v4(),
  'client@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"full_name": "Test Client", "company_name": "Test Company", "country": "USA", "role": "client"}'::jsonb
);

-- Test designer
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  uuid_generate_v4(),
  'designer@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"full_name": "Test Designer", "role": "designer"}'::jsonb
);

-- Test CRM user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  uuid_generate_v4(),
  'crm@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"full_name": "Test CRM", "role": "crm"}'::jsonb
);
*/

-- ============================================================
-- VERIFY: Check everything is set up correctly
-- ============================================================
select
  t.tablename,
  count(p.policyname) as rls_policies
from
  information_schema.tables t
  left join pg_policies p on p.tablename = t.table_name and p.schemaname = 'public'
where
  t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
group by t.tablename
order by t.tablename;
