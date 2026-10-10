-- Migration 032: Enable RLS on all remaining core tables.
--
-- ---------------------------------------------------------------------------
-- THIS FILE PREVIOUSLY COULD NOT RUN. It was rewritten on 2026-10-10; the
-- original is described below so the change is auditable rather than silent.
--
-- The original body created policies that made the whole file abort, and
-- because the Supabase CLI sends a migration as a single implicit transaction,
-- NOTHING in it ever took effect:
--
--   1. `messages_participant_read` / `messages_participant_insert` referenced
--      `messages.sender_id` and `messages.recipient_id`. Those columns do not
--      exist — the real ones are `from_user` and `to_user`
--      (001_initial_schema.sql:190-191). First error: column does not exist.
--   2. `tiers_read_all` and `tiers_admin_write` already exist from
--      001_initial_schema.sql:459-460. Postgres raises duplicate_object.
--   3. `ALTER TABLE public.subscribers` referenced a table no migration
--      created, and no file creates it (that table is now created by 051).
--
-- Two of its policies were also worth not re-creating:
--   * `users_read_all ... TO authenticated USING (true)` would have let every
--     signed-in user read every user row — email, role, last sign-in. 001:463
--     already sets the correct scope (own row, or admin/crm).
--   * The messages and crm_leads policies duplicated 001:500 and 001:508,
--     which already cover participants and admin/crm on the right columns.
--
-- So this file now does only the one thing its name claims and its 001
-- counterpart did not: it ENABLES row level security. Every policy it once
-- carried is either already present in 001 or was superseded. The genuinely
-- missing pieces — the `subscribers` and `blog_comments` tables, RLS on
-- `user_push_subscriptions`, and the over-permissive INSERT policies on
-- `audit_logs` and `received_emails` — are handled in 051.
--
-- Re-running is safe: ENABLE ROW LEVEL SECURITY is idempotent.
-- ---------------------------------------------------------------------------

-- ============================================================
-- 1. Core tables that already carry their policies
-- ============================================================
-- ENABLE is a no-op where it is already on (001 does this for these tables);
-- it is kept so a database that predates 001's RLS block still ends up closed.
alter table public.orders        enable row level security;
alter table public.order_files   enable row level security;
alter table public.invoices      enable row level security;
alter table public.reviews       enable row level security;
alter table public.clients       enable row level security;
alter table public.notifications enable row level security;
alter table public.users         enable row level security;
alter table public.service_tiers enable row level security;
alter table public.designers     enable row level security;
alter table public.messages      enable row level security;
alter table public.crm_leads     enable row level security;
alter table public.audit_logs    enable row level security;

-- No policy creation in this file. The tables the original block targeted —
-- users, service_tiers, designers, messages, crm_leads, audit_logs — all get
-- their policies in 001, and the two it wanted to add for `subscribers` are in
-- 051 alongside the table itself.
