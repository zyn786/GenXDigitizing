-- ============================================================
-- Migration 062 — publish conversations to realtime
-- ============================================================
-- STATUS: additive and safe. Not yet applied.
--
-- WHY
-- ---
-- The unified inbox shows an unread badge in the sidebar. BadgeProvider
-- subscribes to postgres_changes for orders, messages, invoices and
-- notifications (all added to the supabase_realtime publication by migrations
-- 004, 012 and 023) — but `conversations`, created later in 057, was never
-- added. A subscription to an unpublished table does not error; it simply never
-- fires. The badge would look wired up and stay stale.
--
-- Until this runs the badge still works: BadgeProvider fetches counts on mount
-- and again whenever the tab regains focus, and the inbox itself polls every
-- 30 seconds. This migration makes the badge live rather than merely current.
--
-- REPLICA IDENTITY
-- ----------------
-- The existing realtime migrations set REPLICA IDENTITY FULL so UPDATE and
-- DELETE payloads carry the old row. The unread badge needs UPDATE events (a
-- thread's unread_count goes to zero when staff open it), so FULL applies here
-- for the same reason.
--
-- Idempotent: ADD TABLE errors if already a member, so it is guarded.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;

alter table public.conversations replica identity full;

-- ============================================================
-- VERIFY AFTER APPLYING
-- ============================================================
--   select tablename
--   from pg_publication_tables
--   where pubname = 'supabase_realtime'
--     and schemaname = 'public'
--   order by tablename;
--   -- conversations must appear
--
-- Then, in a signed-in admin or crm browser session, mark a thread unread in
-- the database and confirm the sidebar badge changes without a reload.
