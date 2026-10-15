-- Migration 058: a lead can arrive without an email address.
--
-- Migration 001 declared crm_leads.email NOT NULL, which held for every lead
-- source that existed then — the website form and email both collect an address.
--
-- The omnichannel work (057) broke that assumption: a WhatsApp, Instagram or
-- Facebook contact has no email at all, so handleInboundMessage inserts
-- `email = null` and Postgres rejects the row ("null value in column email
-- violates not-null constraint"), the webhook returns 500, and Meta retries the
-- delivery a few times and then drops the customer's message.
--
-- A lead is still reachable without email — contact_channels carries the phone /
-- scoped id — so the column should simply be nullable. The application already
-- handles a null email (the lead-by-email lookup is skipped when there is no
-- address), so relaxing the constraint is the only change required.
--
-- Idempotent: dropping a NOT NULL constraint is a no-op when it is not present.

alter table public.crm_leads alter column email drop not null;
