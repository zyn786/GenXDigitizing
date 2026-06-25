-- Migration 032: Enable RLS on all remaining core tables
-- Tables with existing policies — just ENABLE RLS (policies kick in):
--   orders, order_files, invoices, reviews, clients, notifications

-- ============================================================
-- 1. Enable RLS on tables that already have policies
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Enable RLS + create policies for tables without any
-- ============================================================

-- users: everyone can read profiles (needed for UI), only admins can write
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_read_all ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY users_admin_write ON public.users FOR ALL TO authenticated USING (public.my_role() = 'admin');

-- service_tiers: public read, admin write
ALTER TABLE public.service_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tiers_read_all ON public.service_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY tiers_admin_write ON public.service_tiers FOR ALL TO authenticated USING (public.my_role() = 'admin');

-- designers: admins manage, designers read own
ALTER TABLE public.designers ENABLE ROW LEVEL SECURITY;
CREATE POLICY designers_admin_all ON public.designers FOR ALL TO authenticated USING (public.my_role() = 'admin');
CREATE POLICY designers_read_own ON public.designers FOR SELECT TO authenticated USING (user_id = auth.uid());

-- messages: participants can read/write their own messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_admin_all ON public.messages FOR ALL TO authenticated USING (public.my_role() = 'admin');
CREATE POLICY messages_participant_read ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY messages_participant_insert ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- crm_leads: admins and CRM manage
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_admin_crm_all ON public.crm_leads FOR ALL TO authenticated USING (public.my_role() IN ('admin', 'crm'));

-- audit_logs: admins and CRM read only
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_admin_read ON public.audit_logs FOR SELECT TO authenticated USING (public.my_role() IN ('admin', 'crm'));
CREATE POLICY audit_logs_admin_insert ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.my_role() IN ('admin', 'crm'));

-- subscribers: admin manage, public can insert (for subscribe form)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscribers_admin_all ON public.subscribers FOR ALL TO authenticated USING (public.my_role() = 'admin');
CREATE POLICY subscribers_anon_insert ON public.subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
