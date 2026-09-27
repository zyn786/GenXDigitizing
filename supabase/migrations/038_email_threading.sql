-- ============================================================
-- Migration 038: Gmail-style conversation threading
-- ============================================================
-- Groups inbound and outbound mail into conversations, so the admin inbox
-- shows one row per exchange instead of one row per message.
--
-- This migration is a SUPERSET of 037 and repeats its columns defensively, so
-- it is safe to run whether or not 037 was ever applied. Everything is
-- `if not exists`, so running it twice is harmless.
--
--   thread_id    — conversation key; set by lib/email-threads.ts
--   message_id   — RFC Message-ID, matched against a reply's References
--   in_reply_to  — the immediate parent, for display/debugging
--   references   — full ancestor chain as sent
--
-- sent_emails.message_id holds the id we stamp on outgoing mail, which is what
-- lets a recipient's reply find its way back into the right conversation.

-- ── received_emails ─────────────────────────────────────────
alter table public.received_emails
  add column if not exists is_read     boolean not null default false,
  add column if not exists sender_name text,
  add column if not exists message_id  text,
  add column if not exists thread_id   text,
  add column if not exists in_reply_to text,
  add column if not exists "references" text;

create unique index if not exists received_emails_resend_id_key
  on public.received_emails (resend_id);
create index if not exists received_emails_received_at_idx
  on public.received_emails (received_at desc);
create index if not exists received_emails_unread_idx
  on public.received_emails (received_at desc)
  where is_read = false;
create index if not exists received_emails_thread_idx
  on public.received_emails (thread_id);
create index if not exists received_emails_message_id_idx
  on public.received_emails (message_id);

-- ── sent_emails ─────────────────────────────────────────────
alter table public.sent_emails
  add column if not exists attachments_meta text,
  add column if not exists message_id       text,
  add column if not exists thread_id        text,
  add column if not exists in_reply_to      text,
  add column if not exists "references"     text;

create index if not exists sent_emails_thread_idx
  on public.sent_emails (thread_id);
create index if not exists sent_emails_message_id_idx
  on public.sent_emails (message_id);

-- ── Conversation summary ────────────────────────────────────
-- Aggregating in SQL keeps the conversation list paginatable: the page orders
-- by last_at and limits, instead of loading every message and grouping in JS.
create or replace view public.email_thread_summary as
select
  t.thread_id,
  max(t.last_at)                                              as last_at,
  min(t.first_at)                                             as first_at,
  count(*)                                                    as message_count,
  count(*) filter (where t.direction = 'in' and not t.is_read) as unread_count
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

-- The view is read through the service-role client from the admin page, which
-- bypasses RLS. Grant select explicitly so the anon/authenticated roles can
-- never read every conversation through it.
revoke all on public.email_thread_summary from anon, authenticated;
