-- ============================================================
-- Migration 039: split conversations into Inbox vs Replies
-- ============================================================
-- The inbox mixes two very different things: mail that arrived on its own
-- (newsletters, DMARC reports, Etsy notifications) and conversations where
-- somebody answered an email we sent. The second group is the one that needs
-- a person, so it gets its own tab.
--
-- These flags let the split happen in SQL, which keeps the conversation list
-- paginatable — filtering in JS would only ever cover the current page.

create or replace view public.email_thread_summary as
select
  t.thread_id,
  max(t.last_at)                                              as last_at,
  min(t.first_at)                                             as first_at,
  count(*)                                                    as message_count,
  count(*) filter (where t.direction = 'in' and not t.is_read) as unread_count,
  bool_or(t.direction = 'out')                                as has_outbound,
  bool_or(t.direction = 'in')                                 as has_inbound
from (
  select thread_id, received_at as last_at, received_at as first_at, 'in' as direction, is_read
    from public.received_emails
   where thread_id is not null
  union all
  select thread_id, sent_at as last_at, sent_at as first_at, 'out' as direction, true
    from public.sent_emails
   where thread_id is not null
) t
group by t.thread_id;

-- Reads go through the service-role client from the admin page, which is
-- itself role-gated. This view aggregates every conversation, so it must never
-- be reachable with an anon/authenticated key.
revoke all on public.email_thread_summary from anon, authenticated;

-- PostgREST caches the shape of every view. Without this, queries selecting
-- the new columns keep failing with `column ... does not exist` (42703) even
-- though the view was replaced successfully.
notify pgrst, 'reload schema';
