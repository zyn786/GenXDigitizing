-- Migration 054: the follow-up log.
--
-- `crm_leads.follow_up_at` has existed since the first migration and has never
-- been written by any code, so nothing on a schedule has ever looked at a lead.
-- This table is the record of what the engine actually sent, which is what
-- makes the rest of the requirements possible:
--
--   logged       — one row per attempt, with the outcome
--   idempotent   — UNIQUE(dedupe_key); a retried or doubled cron is a no-op
--   cancelable   — a cancelled row is written, not deleted, and the engine
--                  re-checks the lead's stage before every send
--   retryable    — failed attempts keep their error and can be retried
--   visible      — admin/crm can read it; the lead timeline links to it
--
-- Nothing is ever deleted from here. "Why did we email this customer three
-- times?" has to be answerable.
--
-- Idempotent: safe to re-run.

create table if not exists public.lead_follow_ups (
  id           uuid        primary key default gen_random_uuid(),
  lead_id      uuid        not null references public.crm_leads(id) on delete cascade,

  -- Which follow-up in the sequence this is (1 = first nudge). The engine stops
  -- after MAX_AUTOMATED_FOLLOW_UPS.
  sequence     int         not null,

  -- "lead:<uuid>:<n>". UNIQUE below — this is the idempotency guarantee.
  dedupe_key   text        not null unique,

  channel      text        not null default 'email'
    check (channel in ('email', 'whatsapp', 'manual')),

  status       text        not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'skipped', 'cancelled')),

  -- Which stage the lead was in when this went out, so the effect of chasing a
  -- quote versus chasing a cold enquiry can be compared later.
  stage_at_send text,

  to_email     text,
  subject      text,
  error        text,
  attempts     int         not null default 0,

  -- NULL means the system sent it. Set when a person did.
  sent_by      uuid        references public.users(id) on delete set null,

  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);

comment on table public.lead_follow_ups is
  'Every automated follow-up attempt. Append-only; nothing is deleted, so "why did we email them again" is answerable.';
comment on column public.lead_follow_ups.dedupe_key is
  'lead_id:sequence. UNIQUE — how a doubled cron or a retry becomes a no-op instead of a second email.';

create index if not exists idx_lead_follow_ups_lead
  on public.lead_follow_ups(lead_id, sequence);
create index if not exists idx_lead_follow_ups_status
  on public.lead_follow_ups(status, created_at desc);

alter table public.lead_follow_ups enable row level security;

drop policy if exists lead_follow_ups_staff_select on public.lead_follow_ups;
create policy lead_follow_ups_staff_select on public.lead_follow_ups
  for select to authenticated
  using (public.my_role() in ('admin', 'crm'));

drop policy if exists lead_follow_ups_staff_insert on public.lead_follow_ups;
create policy lead_follow_ups_staff_insert on public.lead_follow_ups
  for insert to authenticated
  with check (
    public.my_role() in ('admin', 'crm')
    and (sent_by is null or sent_by = auth.uid())
  );

-- Staff may cancel a pending follow-up (and correct a failed one's notes), but
-- there is no DELETE policy: the record of an email having been sent is exactly
-- what must not be removable by a client key.
drop policy if exists lead_follow_ups_staff_update on public.lead_follow_ups;
create policy lead_follow_ups_staff_update on public.lead_follow_ups
  for update to authenticated
  using (public.my_role() in ('admin', 'crm'))
  with check (public.my_role() in ('admin', 'crm'));
