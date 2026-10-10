-- Migration 052: the lead event log.
--
-- The timeline of a lead used to be a single `crm_leads.notes` text column that
-- six writers appended to with read-modify-write. Two failures followed:
--
--   1. Concurrent writers destroyed each other's entries. The CRM board built
--      its update from the copy loaded at page render, so an event recorded
--      server-side while the board sat open (a client chat reply, a failed
--      email, a converted order) was overwritten by the next stage drag.
--   2. Nothing was queryable. No actor, no from/to stage, no type — so
--      time-to-first-contact, quote-to-order conversion, and time-in-stage
--      could not be measured at all. The board re-parsed the text with a regex
--      at render time.
--
-- This table is append-only: no code updates or deletes a row here. The notes
-- column keeps the structured facts other code reads (artwork lines via
-- lib/lead-artwork, the customer's reference via lib/lead-reference); the
-- timeline moves here.
--
-- Existing leads keep their history in `notes`, and the board still parses that
-- as a fallback, so nothing is lost by not back-filling: a text line cannot be
-- reliably decomposed into actor, from-stage and to-stage, and inventing those
-- fields would put fabricated history in an audit trail.
--
-- Idempotent: safe to re-run.

create table if not exists public.lead_events (
  id          uuid        primary key default gen_random_uuid(),
  lead_id     uuid        not null references public.crm_leads(id) on delete cascade,

  -- Vocabulary is mirrored in lib/lead-events.ts (LEAD_EVENT_TYPES). The CHECK
  -- is deliberate rather than free text: the only writer is recordLeadEvent,
  -- which validates against the same list before inserting, so a violation here
  -- means a call site was added without going through the helper.
  type        text        not null
    check (type in (
      'created', 'stage_change', 'assigned', 'email_sent',
      'email_failed', 'chat_reply', 'order_created', 'note'
    )),

  -- Who caused it. NULL means the system did. ON DELETE SET NULL rather than
  -- CASCADE: removing a staff account must not erase the history of what they
  -- did — actor_label keeps the name readable after the id is gone.
  actor_id    uuid        references public.users(id) on delete set null,
  actor_label text,

  -- Set only on stage_change, so conversion and time-in-stage are queryable.
  from_stage  text,
  to_stage    text,

  -- Human-readable one-liner, rendered directly by the board. Written by
  -- summariseStageChange() for stage moves so the wording cannot drift.
  summary     text        not null,

  metadata    jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.lead_events is
  'Append-only timeline per lead. No code updates or deletes rows. Written by lib/lead-events.recordLeadEvent.';

comment on column public.lead_events.actor_label is
  'Display-name snapshot, kept so a deleted staff account does not blank the timeline.';

-- The board reads one lead's timeline newest-first; the dashboard counts recent
-- activity across all leads.
create index if not exists idx_lead_events_lead
  on public.lead_events(lead_id, created_at desc);
create index if not exists idx_lead_events_created
  on public.lead_events(created_at desc);
create index if not exists idx_lead_events_type
  on public.lead_events(type, created_at desc);

alter table public.lead_events enable row level security;

-- Leads are staff-only data — crm_leads itself is admin/crm (001:508), and the
-- event log must not be more open than the row it describes. There is no client
-- or anonymous policy: a customer must never read the internal notes about
-- their own lead.
drop policy if exists lead_events_staff_select on public.lead_events;
create policy lead_events_staff_select on public.lead_events
  for select to authenticated
  using (public.my_role() in ('admin', 'crm'));

-- Role alone is not enough for an insert: `actor_id` is what makes the timeline
-- say WHO did something, and without the second clause any staff member could
-- write an event attributed to a colleague. A client-key insert must therefore
-- either name itself or name nobody (the system).
--
-- Server routes use the service-role key and bypass RLS entirely, so they can
-- still attribute an action to the staff member who triggered it — which is
-- correct, because they read that identity from the session, not the request
-- body.
drop policy if exists lead_events_staff_insert on public.lead_events;
create policy lead_events_staff_insert on public.lead_events
  for insert to authenticated
  with check (
    public.my_role() in ('admin', 'crm')
    and (actor_id is null or actor_id = auth.uid())
  );

-- No UPDATE or DELETE policy at all, by design. Append-only is enforced by RLS
-- rather than by convention: with RLS on and no policy for those verbs, every
-- update and delete through a client key is refused. Server routes use the
-- service-role key, which bypasses RLS — they are expected to insert and never
-- to rewrite history, and there is no code path that does.
