-- Migration 051: close the RLS gaps and create the two tables the app uses
--                but no migration ever created.
--
-- Every statement here is idempotent and additive. Nothing drops a table,
-- nothing narrows access that the application actually relies on, and every
-- policy is preceded by `drop policy if exists` so the file can be re-run.
--
-- Background, because each block below fixes a specific defect:
--
--   * `subscribers` is written by app/api/subscribe/route.ts and policied by
--     032 — but no file in the repository creates it. It exists in the live
--     database because someone made it by hand, so a fresh environment cannot
--     be built.
--   * `blog_comments` has the same problem; migration 042 says so out loud and
--     works around the missing table rather than creating it.
--   * `user_push_subscriptions` (002) has no RLS at all. Its rows hold the
--     `endpoint`, `p256dh` and `auth` values that authenticate a push
--     subscription — anyone holding all three can push to that device. With no
--     RLS and no policies, anon can read and write every row.
--   * `audit_logs` insert is `with check (true)` (001:515), so any authenticated
--     user can write any audit row. The audit trail is only worth having if it
--     is not writable by the people it records.
--   * `received_emails` grants INSERT to `anon` (033:49). Nothing needs it: the
--     only writer is the inbound-email webhook, which runs with the service-role
--     key and bypasses RLS regardless.
--
-- Note on service-role clients: nearly every server route in this app uses
-- createAdminClient(), which bypasses RLS entirely. Tightening a policy here
-- therefore cannot break those routes; it only closes the door on the anon and
-- authenticated keys, which is where the exposure actually is.

-- ============================================================
-- 1. subscribers — the newsletter list
-- ============================================================
create table if not exists public.subscribers (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null unique,
  source        text        default 'website',
  subscribed_at timestamptz not null default now()
);

comment on table public.subscribers is
  'Newsletter signups. Written by /api/subscribe with the service-role client.';

alter table public.subscribers enable row level security;

-- Admin-only. The public route writes through createAdminClient, so no anon
-- policy is required — and 032's `subscribers_anon_insert ... with check (true)`
-- would have let anyone insert rows directly, which this deliberately omits.
drop policy if exists subscribers_admin_all on public.subscribers;
create policy subscribers_admin_all on public.subscribers
  for all to authenticated
  using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');

-- ============================================================
-- 2. blog_comments — the table 042 documents as missing
-- ============================================================
create table if not exists public.blog_comments (
  id           uuid        primary key default gen_random_uuid(),
  post_id      uuid        not null references public.blog_posts(id) on delete cascade,
  author_name  text        not null,
  author_email text        default '',
  content      text        not null,
  is_approved  boolean     not null default false,
  created_at   timestamptz not null default now()
);

comment on table public.blog_comments is
  'Blog comments, moderated. Both readers use createAdminClient and select an explicit column list — author_email must never be exposed to anon.';

create index if not exists idx_blog_comments_post_id on public.blog_comments(post_id);
create index if not exists idx_blog_comments_approved on public.blog_comments(post_id, is_approved);

alter table public.blog_comments enable row level security;

-- No anon policy, deliberately. Both the public reader and the admin route use
-- the service-role client, so nothing needs one — and granting anon a table
-- read here would publish author_email, which the public route takes care to
-- exclude (app/api/blog/[slug]/comments/route.ts:20-27). 042 already replaced
-- any table-level SELECT with an explicit safe column list; this keeps that
-- posture rather than reopening it.
drop policy if exists blog_comments_admin_all on public.blog_comments;
create policy blog_comments_admin_all on public.blog_comments
  for all to authenticated
  using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');

-- Guard the column grant 042 attempted, in case that migration ran while the
-- table was absent and skipped it.
do $$
begin
  if to_regclass('public.blog_comments') is null then
    raise notice 'SKIP: blog_comments absent';
    return;
  end if;
  begin
    execute 'revoke select on public.blog_comments from anon, authenticated';
    execute 'grant select (id, post_id, author_name, content, is_approved, created_at)
               on public.blog_comments to anon, authenticated';
  exception when others then
    raise notice 'blog_comments column grant skipped: %', sqlerrm;
  end;
end $$;

-- ============================================================
-- 3. user_push_subscriptions — was created with no RLS at all
-- ============================================================
alter table public.user_push_subscriptions enable row level security;

-- Owner-only, in both directions. A row belongs to exactly one user, so
-- `user_id = auth.uid()` is the whole rule; there is no admin case that needs
-- row-level access here, because the sender uses the service-role client.
drop policy if exists push_subs_own_select on public.user_push_subscriptions;
create policy push_subs_own_select on public.user_push_subscriptions
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists push_subs_own_insert on public.user_push_subscriptions;
create policy push_subs_own_insert on public.user_push_subscriptions
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists push_subs_own_update on public.user_push_subscriptions;
create policy push_subs_own_update on public.user_push_subscriptions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists push_subs_own_delete on public.user_push_subscriptions;
create policy push_subs_own_delete on public.user_push_subscriptions
  for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- 4. audit_logs — the insert policy made the trail self-certifying
-- ============================================================
-- 001:515 `audit_insert ... with check (true)`. Every real writer is a
-- service-role route (admin/credits, orders/[id]/status, designers/payout,
-- webhooks/payoneer, …), which bypasses RLS, so removing the blanket policy
-- costs the application nothing and stops a client key writing its own history.
--
-- Scoped to admin/crm rather than dropped outright: if any authenticated-key
-- path ever does write here, it should fail closed rather than silently gain a
-- blank cheque.
drop policy if exists audit_insert on public.audit_logs;
drop policy if exists audit_logs_insert_scoped on public.audit_logs;
create policy audit_logs_insert_scoped on public.audit_logs
  for insert to authenticated
  with check (public.my_role() in ('admin', 'crm'));

-- ============================================================
-- 5. received_emails — anon could inject rows into the admin inbox
-- ============================================================
-- 033:49 granted INSERT to anon. The inbound-email webhook uses the
-- service-role client (lib/resend-inbound.ts) and the route is signature
-- verified, so nothing legitimate inserts with the anon key.
drop policy if exists received_emails_anon_insert on public.received_emails;

-- ============================================================
-- 6. order_edit_log — missing from migrations, and its insert policy
--    did not check whose order was being written to
-- ============================================================
-- This table is created only by supabase/setup/step6_order_edit_log.sql, so a
-- database built from migrations alone does not have it — while
-- app/(portals)/client/my-orders/[id]/OrderDetail.tsx and
-- app/api/orders/[id]/edit/route.ts both write to it.
--
-- Its insert policy was `WITH CHECK (changed_by = auth.uid())` and nothing
-- else. A client editing their own order supplies both `changed_by` (their own
-- id, correctly) and `order_id` — so any signed-in client could write change
-- rows against any other customer's order, and staff review those rows in
-- admin/orders. The policy now also requires the order to be theirs, mirroring
-- the SELECT policy alongside it.
create table if not exists public.order_edit_log (
  id                uuid        primary key default gen_random_uuid(),
  order_id          uuid        not null references public.orders(id) on delete cascade,
  changed_by        uuid        not null references public.users(id),
  field_name        text        not null,
  old_value         text,
  new_value         text,
  reviewed_by_admin boolean     not null default false,
  reviewed_by       uuid        references public.users(id),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists idx_order_edit_log_order_id on public.order_edit_log(order_id);
create index if not exists idx_order_edit_log_unreviewed
  on public.order_edit_log(reviewed_by_admin) where reviewed_by_admin = false;

alter table public.order_edit_log enable row level security;

-- Admin/CRM: unchanged from step6, restated with an explicit role.
drop policy if exists admins_all_edit_log on public.order_edit_log;
create policy admins_all_edit_log on public.order_edit_log
  for all to authenticated
  using (public.my_role() in ('admin', 'crm'))
  with check (public.my_role() in ('admin', 'crm'));

-- A client reads the log for their own order only.
drop policy if exists client_own_edit_log on public.order_edit_log;
create policy client_own_edit_log on public.order_edit_log
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      join public.clients c on o.client_id = c.id
      where o.id = order_id and c.user_id = auth.uid()
    )
  );

-- A client writes to their own order only. `changed_by = auth.uid()` alone was
-- not enough: it named the writer but never checked the target.
drop policy if exists client_insert_edit_log on public.order_edit_log;
create policy client_insert_edit_log on public.order_edit_log
  for insert to authenticated
  with check (
    changed_by = auth.uid()
    and exists (
      select 1 from public.orders o
      join public.clients c on o.client_id = c.id
      where o.id = order_id and c.user_id = auth.uid()
    )
  );
