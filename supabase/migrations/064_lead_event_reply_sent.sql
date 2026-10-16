-- ============================================================
-- Migration 064 — 'reply_sent' on the lead timeline
-- ============================================================
-- STATUS: additive, safe, idempotent. Not yet applied.
--
-- WHY
-- ---
-- Migration 052 gave lead_events a closed vocabulary, mirrored in
-- lib/lead-events.ts. `chat_reply` records a message FROM the customer, and the
-- inbound pipeline writes one for every message it stores. Nothing recorded a
-- reply the business sent back — so a lead's timeline showed the customer
-- asking questions and never being answered, which is worse than showing
-- nothing at all: it reads as an unanswered enquiry.
--
-- The inbox reply path (WhatsApp) now records this event when a message
-- actually leaves. It is the mirror of `chat_reply`, deliberately a separate
-- word rather than a reused one, because "who spoke" is the single most
-- important thing on a timeline and a shared value would blur it.
--
-- WHY THE CONSTRAINT IS REBUILT RATHER THAN ALTERED
-- -------------------------------------------------
-- Postgres cannot add a value to an existing CHECK; the constraint has to be
-- dropped and re-added. 052 declared it inline on the column, so its name is
-- whatever Postgres generated — the DO block below finds it by its definition
-- rather than assuming a name.
--
-- Re-adding VALIDATES every existing row. That is safe here and not merely
-- assumed: the new list is the old list plus one value, so no stored row can
-- fail it.

do $$
declare
  cname text;
begin
  select con.conname into cname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'lead_events'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%chat_reply%'
  limit 1;

  if cname is not null then
    execute format('alter table public.lead_events drop constraint %I', cname);
  end if;
end $$;

-- Belt and braces: if a previous run of THIS migration got as far as adding the
-- named constraint, drop it so the add below cannot collide.
alter table public.lead_events
  drop constraint if exists lead_events_type_check;

alter table public.lead_events
  add constraint lead_events_type_check
  check (type in (
    'created', 'stage_change', 'assigned', 'email_sent',
    'email_failed', 'chat_reply', 'order_created', 'note',
    'reply_sent'
  ));

-- ============================================================
-- VERIFY AFTER APPLYING
-- ============================================================
--   select pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'public.lead_events'::regclass and contype = 'c';
--   -- expect one constraint listing all nine values, 'reply_sent' last
--
--   -- and that nothing was lost:
--   select type, count(*) from public.lead_events group by type order by type;
--
-- The vocabulary is mirrored in lib/lead-events.ts, and
-- lib/lead-events.test.ts fails if the two drift apart.
