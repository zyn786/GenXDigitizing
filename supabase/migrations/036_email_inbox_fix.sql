-- ============================================================
-- Fix admin email inbox — missing columns on received_emails
-- ============================================================
-- The inbound webhook (app/api/admin/email-inbound) inserts
-- cc_emails / headers / attachments_meta, and the admin /email
-- page selects cc_emails / attachments_meta — but migration 033
-- never created those columns. Every webhook insert and the
-- inbox query failed with "Could not find the 'cc_emails'
-- column of 'received_emails'".

alter table public.received_emails
  add column if not exists cc_emails        text,
  add column if not exists headers          text,
  add column if not exists attachments_meta text;
