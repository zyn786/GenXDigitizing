-- ============================================================
-- GenXdigitizing — Auth Fix Script
-- Run this in Supabase SQL Editor if users can't log in.
-- ============================================================

-- ── Step 1: Check if migration ran ───────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Should show: audit_logs, clients, crm_leads, designers,
--              invoices, messages, notifications, order_files,
--              orders, reviews, service_tiers, users

-- ── Step 2: Sync ALL existing auth users into public.users ───
-- (Fixes cases where trigger didn't fire or migration ran after signup)
INSERT INTO public.users (id, email, full_name, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'client')
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;  -- only insert if missing

-- ── Step 3: Sync client records ──────────────────────────────
INSERT INTO public.clients (user_id, company_name, country)
SELECT
  u.id,
  COALESCE(au.raw_user_meta_data->>'company_name', ''),
  COALESCE(au.raw_user_meta_data->>'country', '')
FROM public.users u
JOIN auth.users au ON au.id = u.id
LEFT JOIN public.clients c ON c.user_id = u.id
WHERE u.role = 'client' AND c.id IS NULL;

-- ── Step 4: Sync designer records ────────────────────────────
INSERT INTO public.designers (user_id)
SELECT u.id
FROM public.users u
LEFT JOIN public.designers d ON d.user_id = u.id
WHERE u.role = 'designer' AND d.id IS NULL;

-- ── Step 5: Promote yourself to admin ────────────────────────
-- Uncomment and run with your email:
-- UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';

-- ── Step 6: Verify ───────────────────────────────────────────
SELECT
  u.email,
  u.role,
  u.is_active,
  CASE WHEN c.id IS NOT NULL THEN 'yes' ELSE 'no' END as has_client_record,
  CASE WHEN d.id IS NOT NULL THEN 'yes' ELSE 'no' END as has_designer_record
FROM public.users u
LEFT JOIN public.clients c  ON c.user_id = u.id
LEFT JOIN public.designers d ON d.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 20;
