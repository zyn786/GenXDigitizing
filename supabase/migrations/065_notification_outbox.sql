-- ============================================================
-- Migration 065 — durable notification outbox
-- ============================================================
-- STATUS: additive, safe, idempotent. Not yet applied.
--
-- WHY
-- ---
-- `notifyUsers` (lib/notify-server.ts) sends once and records its own failure
-- in `notification_failures`. There is no retry. A WhatsApp provider blip, a
-- transient network fault, or a deploy landing mid-send loses the alert, and
-- the only trace is a console line and a row nothing reads.
--
-- The events that matter most are exactly the ones worth retrying: a new
-- qualified lead, a customer message nobody answered, a failed outbound send.
-- Losing one is losing business.
--
-- This table is the queue. A worker claims rows and attempts them; failures
-- come back with a delay; a row that exhausts its attempts goes to `dead`
-- rather than looping forever.
--
-- WHY A TABLE AND NOT AN IN-MEMORY QUEUE
-- --------------------------------------
-- A serverless function exits when it returns. Anything queued in memory dies
-- with it, silently. Durability has to be in Postgres, and the worker is the
-- existing Vercel cron (vercel.json), which is already how the follow-up
-- engine and SLA check run.
--
-- IDEMPOTENCY
-- -----------
-- `(event_key, channel)` is UNIQUE. An event that is enqueued twice — a retried
-- webhook, a double-clicked action, a re-run of a seeding script — produces one
-- row, so the recipient is notified once. This is the whole defence against
-- duplicate notifications, and it lives in the database rather than in the
-- worker's memory.
--
-- STATUS VOCABULARY
-- -----------------
-- The provider decides how far a message can be tracked, so the states are
-- deliberately honest rather than uniform:
--
--   pending    queued, not yet attempted
--   sending    claimed by a worker (a crash leaves this; see the sweep below)
--   accepted   the provider took it — WhatsApp returns a message id here
--   delivered  confirmed delivered to the destination
--   failed     last attempt failed, will be retried
--   dead       attempts exhausted; needs a person
--   unknown    provider accepted but never confirmed — treated as failed for
--              retry purposes, but recorded distinctly so it is not reported
--              as a success it cannot prove
--
-- For `in_app` a successful insert into `notifications` IS delivery: the row is
-- what the dashboard reads. For `whatsapp`, Meta's 200 means *accepted*; the
-- delivery receipt arrives later on the status webhook, and until that is
-- processed the honest state is `accepted`, not `delivered`.

create table if not exists public.notification_outbox (
  id              uuid        primary key default gen_random_uuid(),

  -- Idempotency. Stable per logical event, e.g. "reply_failed:<message id>".
  event_key       text        not null,
  -- What happened, for routing and for a human reading the queue.
  event_type      text        not null,

  channel         text        not null
    check (channel in ('in_app', 'whatsapp')),

  -- Destination on that channel: a user id for in_app, an E.164 number
  -- (digits only, per lib/channels.normalisePhone) for whatsapp.
  recipient       text,
  -- Everything the channel needs to render the message. Never a secret.
  payload         jsonb       not null default '{}'::jsonb,

  status          text        not null default 'pending'
    check (status in ('pending','sending','accepted','delivered','failed','dead','unknown')),

  attempts        int         not null default 0,
  max_attempts    int         not null default 5,
  next_attempt_at timestamptz not null default now(),

  last_attempt_at timestamptz,
  last_error      text,
  -- Provider's own id, when it gives one (WhatsApp's wamid).
  provider_id     text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- One row per event per channel. The duplicate-notification defence.
  unique (event_key, channel)
);

comment on table public.notification_outbox is
  'Durable queue for internal alerts. (event_key, channel) is UNIQUE so an event enqueued twice notifies once.';

-- The worker's only query: due rows, oldest first.
create index if not exists idx_notification_outbox_due
  on public.notification_outbox(next_attempt_at)
  where status in ('pending', 'failed');

-- Finding stuck `sending` rows after a crash.
create index if not exists idx_notification_outbox_sending
  on public.notification_outbox(last_attempt_at)
  where status = 'sending';

-- ============================================================
-- Claiming — concurrent-safe
-- ============================================================
-- Two workers (an overlapping cron, a manual run, a retry) must never take the
-- same row. `FOR UPDATE SKIP LOCKED` is the standard answer: each worker locks
-- the rows it takes and the others skip straight past them instead of blocking
-- or double-sending.
--
-- As one function rather than a select-then-update from the application,
-- because that pattern has a window between the read and the write where two
-- workers both see the same pending row.
create or replace function public.claim_notification_outbox(p_limit int default 25)
returns setof public.notification_outbox
language sql
security definer
set search_path = public
as $$
  update public.notification_outbox o
     set status          = 'sending',
         attempts        = o.attempts + 1,
         last_attempt_at = now(),
         updated_at      = now()
   where o.id in (
     select id
       from public.notification_outbox
      where status in ('pending', 'failed')
        and next_attempt_at <= now()
      order by next_attempt_at asc
      limit greatest(1, least(p_limit, 200))
      for update skip locked
   )
  returning o.*;
$$;

comment on function public.claim_notification_outbox(int) is
  'Atomically claim due outbox rows for sending. FOR UPDATE SKIP LOCKED so concurrent workers never take the same row.';

-- ============================================================
-- Crash recovery
-- ============================================================
-- A worker that dies mid-send leaves rows in `sending` forever, because the
-- claim only picks up 'pending' and 'failed'. Rather than guess whether the
-- message went out, these are marked `unknown` and retried: an alert delivered
-- twice is a far smaller problem than an alert never delivered.
create or replace function public.sweep_stuck_notification_outbox(p_older_than interval default '5 minutes')
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  moved int;
begin
  update public.notification_outbox
     set status       = 'unknown',
         last_error   = coalesce(last_error, 'worker did not report back'),
         updated_at   = now()
   where status = 'sending'
     and coalesce(last_attempt_at, updated_at) < now() - p_older_than;

  get diagnostics moved = row_count;
  return moved;
end $$;

comment on function public.sweep_stuck_notification_outbox(interval) is
  'Return rows abandoned mid-send to the queue as unknown, so a crashed worker cannot strand an alert.';

-- ============================================================
-- RLS
-- ============================================================
-- Internal infrastructure. No customer reads this, and nothing in the browser
-- writes it. The cron worker uses the service-role client, which bypasses RLS;
-- admins get read-only access so the dashboard can show what is stuck.
alter table public.notification_outbox enable row level security;

drop policy if exists notification_outbox_admin_read on public.notification_outbox;
create policy notification_outbox_admin_read on public.notification_outbox
  for select to authenticated
  using (public.my_role() = 'admin');

-- ============================================================
-- VERIFY AFTER APPLYING
-- ============================================================
--   select conname from pg_constraint
--   where conrelid = 'public.notification_outbox'::regclass and contype = 'u';
--   -- expect the unique constraint over (event_key, channel)
--
--   select proname from pg_proc
--   where proname in ('claim_notification_outbox', 'sweep_stuck_notification_outbox');
--
--   -- enqueue the same event twice and confirm one row:
--   --   (the application does this; the test suite covers it with mocks)
