-- Migration 053: record every AI draft.
--
-- The drafting route logged token counts to the console and nothing else, so a
-- suggestion that lost a customer was unreproducible: no record of what was
-- proposed, to whom, by which staff member, or what the model was told.
--
-- Human approval stays mandatory — nothing here sends anything. This table is
-- the audit trail that makes a move toward automation safe to evaluate later:
-- you cannot judge whether drafts are good without being able to read them.
--
-- Append-only in practice. `outcome` is the one mutable field: it records what
-- the person did with the draft, which is the signal that matters.
--
-- Idempotent: safe to re-run.

create table if not exists public.ai_drafts (
  id          uuid        primary key default gen_random_uuid(),

  -- The lead this was written for. SET NULL rather than CASCADE: deleting a
  -- lead must not erase the record that we generated a reply to it.
  lead_id     uuid        references public.crm_leads(id) on delete set null,
  -- Kept separately because clientEmail drafts have no lead at all.
  lead_email  text,

  -- Who asked for it. NULL if the account is later removed.
  created_by  uuid        references public.users(id) on delete set null,

  draft       text        not null,
  instruction text,

  -- The model's own signal that this needs a human rather than a send.
  escalated   boolean     not null default false,

  -- What was actually sent to the model. Kept so a bad draft can be explained
  -- rather than guessed at. Contains customer text — treat as confidential, and
  -- it is why this table is admin/crm only.
  briefing    text,

  model       text,
  input_tokens  int,
  output_tokens int,
  cache_read_tokens     int,
  cache_creation_tokens int,

  -- What the human did. 'pending' until someone acts; the route never sets
  -- anything else, because a draft only becomes sent/discarded by a person.
  outcome     text not null default 'pending'
    check (outcome in ('pending', 'sent', 'edited_sent', 'discarded')),

  created_at  timestamptz not null default now()
);

comment on table public.ai_drafts is
  'Audit trail of AI-drafted replies. Human approval is mandatory; nothing here is sent automatically.';
comment on column public.ai_drafts.briefing is
  'Exact model input, including customer text. Confidential — admin/crm only.';
comment on column public.ai_drafts.outcome is
  'Set by a human. The route only ever inserts pending.';

create index if not exists idx_ai_drafts_lead on public.ai_drafts(lead_id, created_at desc);
create index if not exists idx_ai_drafts_created on public.ai_drafts(created_at desc);

alter table public.ai_drafts enable row level security;

-- Same audience as crm_leads: this is internal sales material. No client or
-- anonymous policy — a customer must never read the drafts written about them.
drop policy if exists ai_drafts_staff_select on public.ai_drafts;
create policy ai_drafts_staff_select on public.ai_drafts
  for select to authenticated
  using (public.my_role() in ('admin', 'crm'));

drop policy if exists ai_drafts_staff_insert on public.ai_drafts;
create policy ai_drafts_staff_insert on public.ai_drafts
  for insert to authenticated
  with check (
    public.my_role() in ('admin', 'crm')
    and (created_by is null or created_by = auth.uid())
  );

-- Update is allowed only to record an outcome, and only on a row the caller
-- raised. Server routes use the service-role key and bypass this.
drop policy if exists ai_drafts_staff_update on public.ai_drafts;
create policy ai_drafts_staff_update on public.ai_drafts
  for update to authenticated
  using (
    public.my_role() in ('admin', 'crm')
    and (created_by is null or created_by = auth.uid())
  )
  with check (public.my_role() in ('admin', 'crm'));

-- No DELETE policy: the point of an audit trail is that it is not removable
-- through a client key.
