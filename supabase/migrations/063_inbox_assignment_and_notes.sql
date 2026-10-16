-- ============================================================
-- Migration 063 — inbox assignment and internal notes
-- ============================================================
-- STATUS: additive and safe. Not yet applied.
--
-- WHY A SEPARATE NOTES TABLE
-- --------------------------
-- Internal notes could have been `conversation_messages` rows with a new
-- `direction = 'note'`, but that means dropping and recreating the existing
-- CHECK constraint, and it puts a note in the same table as the customer's
-- words. A note is not a message: it is never sent, never counted, and has an
-- author rather than a direction. Its own table says that plainly and leaves
-- the messages constraint alone.
--
-- Both additions are also PROBEABLE. The application ships before this
-- migration is applied, so it asks "does assigned_to exist?" and "does
-- conversation_notes exist?" and hides the controls when the answer is no,
-- rather than issuing a query that errors and takes the whole inbox down with
-- it.

-- ── Assignment ──────────────────────────────────────────────
alter table public.conversations
  add column if not exists assigned_to uuid references public.users(id) on delete set null;

comment on column public.conversations.assigned_to is
  'Staff member who owns this thread. NULL means nobody has picked it up yet.';

-- Partial: the inbox filters by assignee, but most rows start unassigned and
-- there is no point indexing NULLs.
create index if not exists idx_conversations_assigned
  on public.conversations(assigned_to)
  where assigned_to is not null;

-- ── Internal notes ──────────────────────────────────────────
create table if not exists public.conversation_notes (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  author_id       uuid        references public.users(id) on delete set null,
  body            text        not null,
  created_at      timestamptz not null default now(),
  constraint conversation_notes_body_not_blank check (length(btrim(body)) > 0)
);

comment on table public.conversation_notes is
  'Staff-only notes on a conversation. Never sent to the customer, never counted as a message.';

create index if not exists idx_conversation_notes_thread
  on public.conversation_notes(conversation_id, created_at);

-- ── RLS: same audience as the thread itself ─────────────────
-- Migration 057 grants conversations, conversation_messages and
-- contact_channels to admin and crm. A note is about a conversation, so it
-- inherits exactly that audience — a customer must never read the internal
-- notes kept about them.
alter table public.conversation_notes enable row level security;

do $$
begin
  execute 'drop policy if exists conversation_notes_staff_all on public.conversation_notes';
  execute 'create policy conversation_notes_staff_all on public.conversation_notes
             for all to authenticated
             using (public.my_role() in (''admin'', ''crm''))
             with check (public.my_role() in (''admin'', ''crm''))';
end $$;

-- ============================================================
-- VERIFY AFTER APPLYING
-- ============================================================
--   select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'conversations'
--     and column_name = 'assigned_to';
--
--   select tablename from pg_tables
--   where schemaname = 'public' and tablename = 'conversation_notes';
--
--   select tablename, policyname, roles, cmd from pg_policies
--   where schemaname = 'public' and tablename = 'conversation_notes';
--
-- Then confirm the inbox shows the assign control and the note composer, and
-- that a signed-in client cannot read the notes table (expect zero rows, not
-- an error).
