-- Migration 057: one customer, several channels.
--
-- The website form, the chat widget and email all write to different places
-- today, and nothing links them. A customer who emails us on Monday and
-- messages on WhatsApp on Wednesday is two strangers, and whichever one the
-- team fails to notice is the one that goes quiet.
--
-- Three tables, in the order the brief describes them:
--
--   Contact → Conversation → Messages → Lead → Events → Follow-ups
--
--   contact_channels      one row per (channel, external id). This is the
--                         identity map: a phone number, an Instagram scoped id
--                         and an email address can all point at the same lead.
--   conversations         one thread per contact per channel.
--   conversation_messages every inbound and outbound message on that thread.
--
-- Why a new message store rather than the existing `messages` table: that one
-- is user-to-user only (from_user and to_user are NOT NULL foreign keys to
-- users), so a lead who has not signed up cannot be messaged through it at all.
-- A WhatsApp enquiry arrives from someone with no account — that is the whole
-- point of the channel.
--
-- Nothing here sends anything. Inbound only, until a provider is configured and
-- someone decides what the business is allowed to say back.
--
-- Idempotent: safe to re-run.

-- ============================================================
-- 1. contact_channels — the identity map
-- ============================================================
create table if not exists public.contact_channels (
  id           uuid        primary key default gen_random_uuid(),

  -- whatsapp | instagram | facebook | email | website
  channel      text        not null
    check (channel in ('whatsapp', 'instagram', 'facebook', 'email', 'website')),

  -- The identifier that channel uses: an E.164 phone number, a Meta scoped id,
  -- a lowercased email address. Stored normalised by lib/channels, never as the
  -- provider sent it — see the note on normalisation in that file.
  external_id  text        not null,

  display_name text,
  -- Kept separately so a contact can be matched by email even when the channel
  -- gives us no email (WhatsApp does not).
  email        text,

  -- The lead this identity belongs to. ON DELETE SET NULL rather than CASCADE:
  -- deleting a lead should not orphan the identity map, because the next
  -- message from that phone number must still find whoever it was.
  lead_id      uuid        references public.crm_leads(id) on delete set null,

  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),

  -- One external id maps to exactly one contact, per channel. Replaces the
  -- read-then-write that would otherwise race two simultaneous inbound messages.
  unique (channel, external_id)
);

comment on table public.contact_channels is
  'Maps a channel-specific identifier (phone, IG scoped id, email) to one lead, so a customer who writes on three channels is one customer.';

create index if not exists idx_contact_channels_lead on public.contact_channels(lead_id);
create index if not exists idx_contact_channels_email on public.contact_channels(lower(email));

-- ============================================================
-- 2. conversations — one thread per contact per channel
-- ============================================================
create table if not exists public.conversations (
  id              uuid        primary key default gen_random_uuid(),
  contact_id      uuid        not null references public.contact_channels(id) on delete cascade,

  -- Denormalised from the contact so a query can filter by channel without a
  -- join; kept in step by the application, never edited directly.
  channel         text        not null,

  subject         text,
  status          text        not null default 'open'
    check (status in ('open', 'snoozed', 'closed')),

  -- Denormalised counters so the staff inbox renders without counting rows per
  -- thread on every page load.
  last_message_at timestamptz,
  unread_count    int         not null default 0,

  created_at      timestamptz not null default now()
);

comment on table public.conversations is
  'One thread per contact per channel. The unified inbox reads this table.';

create index if not exists idx_conversations_contact on public.conversations(contact_id);
create index if not exists idx_conversations_recent on public.conversations(last_message_at desc nulls last);
create index if not exists idx_conversations_open on public.conversations(status, unread_count);

-- ============================================================
-- 3. conversation_messages — channel-agnostic
-- ============================================================
create table if not exists public.conversation_messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,

  direction       text        not null check (direction in ('inbound', 'outbound')),

  body            text,
  -- Provider-specific payload: media urls, attachment metadata, reaction. Kept
  -- whole so nothing is lost that we did not think to model.
  attachments     jsonb,

  -- The provider's own message id. UNIQUE per conversation, because webhooks are
  -- delivered at least once and Meta retries on any non-2xx — without this a
  -- retried delivery shows the customer's message to staff twice.
  external_id     text,
  provider        text,

  -- NULL for inbound. Set when a person replies from the portal.
  sent_by         uuid        references public.users(id) on delete set null,

  created_at      timestamptz not null default now()
);

comment on table public.conversation_messages is
  'Every inbound and outbound message on a conversation. external_id is UNIQUE where present so a retried webhook is a no-op.';

create index if not exists idx_conversation_messages_thread
  on public.conversation_messages(conversation_id, created_at);
create unique index if not exists uq_conversation_messages_external
  on public.conversation_messages(conversation_id, external_id)
  where external_id is not null;

-- ============================================================
-- 4. RLS — internal only
-- ============================================================
-- A customer must never read the internal thread about themselves, and these
-- tables hold names, phone numbers and message bodies. Same audience as
-- crm_leads: admin and crm.
alter table public.contact_channels      enable row level security;
alter table public.conversations         enable row level security;
alter table public.conversation_messages enable row level security;

do $$
declare t text;
begin
  foreach t in array array['contact_channels', 'conversations', 'conversation_messages']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_staff_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (public.my_role() in (''admin'', ''crm''))
         with check (public.my_role() in (''admin'', ''crm''))',
      t || '_staff_all', t
    );
  end loop;
end $$;
