-- ============================================================
-- Migration 037: Admin email inbox — read state + sync support
-- ============================================================
-- The inbound pipeline was never storing anything (every Resend webhook was
-- rejected by a broken signature check), so the inbox was always empty and
-- there was no read/unread state to show. This adds the columns the inbox
-- needs once mail actually flows:
--
--   is_read      — drives the unread dot and the sidebar badge
--   sender_name  — display name from the message's From header
--   message_id   — RFC message id, from Resend's received-email payload
--   unique index on resend_id — makes webhook + sync imports idempotent
--                               via upsert(onConflict: "resend_id")
--
-- Also records attachment names on sent mail — the composer has always tried
-- to render `attachments` on sent items, but migration 033 never created a
-- column for it, so it was silently always blank.

alter table public.received_emails
  add column if not exists is_read     boolean not null default false,
  add column if not exists sender_name text,
  add column if not exists message_id  text;

-- Postgres allows many NULLs in a unique index, so rows imported without a
-- resend_id are unaffected. The table is empty as of this migration, so this
-- cannot fail on pre-existing duplicates.
create unique index if not exists received_emails_resend_id_key
  on public.received_emails (resend_id);

-- Inbox pagination orders by received_at desc.
create index if not exists received_emails_received_at_idx
  on public.received_emails (received_at desc);

-- Partial index for the unread count shown in the sidebar.
create index if not exists received_emails_unread_idx
  on public.received_emails (received_at desc)
  where is_read = false;

alter table public.sent_emails
  add column if not exists attachments_meta text;
