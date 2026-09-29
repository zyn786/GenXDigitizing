-- ============================================================
-- Migration 048: Realtime for the admin email inbox
-- ============================================================
--
-- The admin email page had no live updates: new mail only appeared after
-- pressing "Sync from Resend", and the sync button was the only thing that
-- could tell you something had arrived. Every other portal surface
-- (orders, invoices, notifications) refreshes on realtime; the inbox did not.
--
-- `postgres_changes` only fires for tables that are members of the
-- `supabase_realtime` publication, so both base tables need adding.
--
-- The inbox list itself renders from the `email_thread_summary` view, but
-- realtime does not work on views — subscribing to the underlying tables is
-- what makes the view re-render.
--
-- Guarded with duplicate_object so re-running is safe: `ALTER PUBLICATION ...
-- ADD TABLE` raises 42710 if the table is already a member.

do $$ begin
  alter publication supabase_realtime add table public.received_emails;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.sent_emails;
exception when duplicate_object then null; end $$;

-- REPLICA IDENTITY FULL so UPDATE/DELETE events carry the full old row —
-- needed to re-read state correctly (matches 004 for the portal tables).
alter table public.received_emails replica identity full;
alter table public.sent_emails     replica identity full;
