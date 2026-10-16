-- ============================================================
-- Migration 061 — scope storage reads to the owning customer
-- ============================================================
-- STATUS: drafted, NOT APPLIED. Review before running.
--
-- THE HOLE
-- --------
-- Migration 001 created three storage SELECT policies that check only the
-- caller's ROLE, never ownership:
--
--   artwork_read  using (bucket_id = 'artwork'  and my_role() in ('admin','designer','client'))
--   outputs_read  using (bucket_id = 'outputs'  and my_role() in ('admin','client','designer'))
--   invoices_read using (bucket_id = 'invoices' and my_role() in ('admin','client'))
--
-- `my_role()` (001:443) is `select role from public.users where id = auth.uid()`
-- — it answers "what are you", not "is this yours". So the predicate reads as
-- "any user whose role is client may read EVERY object in the bucket".
--
-- Registration is open and assigns role 'client' (app/(auth)/register/page.tsx),
-- and the anon key ships in the page bundle. An unauthenticated caller is
-- correctly refused (verified: listing all three buckets with the anon key
-- returns 200 with zero objects), but anyone who registers gets role 'client'.
--
-- No later migration touches these three policies — 008 rewrote outputs_upload,
-- 045 dropped the free-designs policies, and grep across all 60 migrations finds
-- artwork_read/outputs_read/invoices_read only in 001.
--
-- WHAT THE BUCKETS ACTUALLY CONTAIN
-- ---------------------------------
-- Established by listing the live buckets, NOT inferred from the upload code.
-- An earlier draft of this migration assumed an `orders/<id>/artwork/...` shape
-- taken from the path-building lines in app/api/upload/*, which is wrong — the
-- order id is the FIRST segment with no prefix:
--
--   artwork/<orderId>/<timestamp>.png          one customer's uploaded artwork
--   artwork/contact-uploads/<ts>-<name>        public contact-form uploads
--   artwork/email-attachments/<ts>-<uuid>.jpg  internal admin email attachments
--   outputs/<orderId>/<uuid>                   finished deliverables
--   outputs/chat/<uuid>                        chat attachments
--   outputs/guest-uploads/<ts>-<n>-<name>      uploads made before an order exists
--   invoices/invoices/<invoiceId>.pdf          invoice PDFs
--
-- So the current policies expose more than customer artwork: every customer's
-- uploads AND deliverables, other people's contact-form uploads, internal email
-- attachments, chat attachments and guest uploads — to any registered account.
--
-- WHY TIGHTENING SELECT IS SAFE
-- -----------------------------
-- Every legitimate read is server-side. `signFileUrl` in lib/supabase/
-- client-queries.ts and admin-queries.ts calls `signStorageUrl` →
-- lib/storage.ts:83 `createSignedUrl` on the SERVICE-ROLE client, which bypasses
-- RLS entirely. The only browser-side storage call in the codebase is an UPLOAD
-- (components/chat/ChatProvider.tsx:333), which a SELECT policy does not govern.
-- This is why tightening cannot remove access the app relies on.
--
-- DELIBERATELY UNCHANGED
-- ----------------------
-- Admin and designer keep unrestricted read. Narrowing a designer to their
-- assigned orders would be more correct, but it risks breaking the designer
-- portal and is a separate change from closing a hole reachable by the public.
--
-- Paths with no owner in the path itself — contact-uploads/, email-attachments/,
-- chat/, guest-uploads/ — become staff-only. A client's own chat attachment is
-- still served to them, because the app signs it server-side.
--
-- Idempotent: each policy is dropped and recreated.

-- ── artwork ─────────────────────────────────────────────────
-- Owned paths are `artwork/<orderId>/...`. The EXISTS does the real work: a
-- folder that is not an order id simply matches no row, so contact-uploads/,
-- email-attachments/ and any future unowned prefix are denied by construction
-- rather than by an ever-growing deny-list.
drop policy if exists "artwork_read" on storage.objects;

create policy "artwork_read" on storage.objects
  for select
  using (
    bucket_id = 'artwork'
    and (
      public.my_role() in ('admin', 'designer')
      or (
        public.my_role() = 'client'
        and exists (
          select 1
          from public.orders o
          where o.id::text = (storage.foldername(name))[1]
            and o.client_id = public.my_client_id()
        )
      )
    )
  );

-- ── outputs ─────────────────────────────────────────────────
-- Owned paths are `outputs/<orderId>/...`. chat/ and guest-uploads/ are
-- first-segment names, not order ids, so they fall out for the same reason.
drop policy if exists "outputs_read" on storage.objects;

create policy "outputs_read" on storage.objects
  for select
  using (
    bucket_id = 'outputs'
    and (
      public.my_role() in ('admin', 'designer')
      or (
        public.my_role() = 'client'
        and exists (
          select 1
          from public.orders o
          where o.id::text = (storage.foldername(name))[1]
            and o.client_id = public.my_client_id()
        )
      )
    )
  );

-- ── invoices ────────────────────────────────────────────────
-- Path is invoices/<invoiceId>.pdf inside the invoices bucket, so the id is the
-- FILENAME, not a folder — `storage.filename`, with the extension stripped.
drop policy if exists "invoices_read" on storage.objects;

create policy "invoices_read" on storage.objects
  for select
  using (
    bucket_id = 'invoices'
    and (
      public.my_role() = 'admin'
      or (
        public.my_role() = 'client'
        and exists (
          select 1
          from public.invoices i
          where i.id::text = replace(storage.filename(name), '.pdf', '')
            and i.client_id = public.my_client_id()
        )
      )
    )
  );

-- ── avatars upload had no role check at all ─────────────────
-- `avatars_upload` was `with check (bucket_id = 'avatars')` with no role
-- predicate, on a bucket that is public = true — so anonymous writes were
-- possible. Uploads actually go through the server route app/api/client/avatar
-- using the service role, so requiring an authenticated caller costs nothing.
drop policy if exists "avatars_upload" on storage.objects;

create policy "avatars_upload" on storage.objects
  for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);

-- ============================================================
-- VERIFY BEFORE APPLYING
-- ============================================================
-- 1. Confirm the policies are live as written in 001:
--
--   select tablename, policyname, cmd, qual
--   from pg_policies
--   where schemaname = 'storage'
--   order by tablename, policyname;
--
-- 2. Confirm the path assumption still holds — the first segment must be an
--    order id. If new prefixes have appeared under artwork/ or outputs/, they
--    become staff-only under this policy and may need their own predicate:
--
--   select distinct split_part(name, '/', 1) as first_segment
--   from storage.objects
--   where bucket_id in ('artwork','outputs');
--
-- ============================================================
-- VERIFY AFTER APPLYING
-- ============================================================
-- 3. Staff can still open files: sign in as admin, open /admin/orders/<id>,
--    confirm artwork and outputs render.
-- 4. A client sees only their own: sign in as a client with one order, confirm
--    their artwork loads. Then, as that client, list the bucket through the
--    anon-key client and expect zero rows for another order's folder.
-- 5. Customer-facing flows still work: an order confirmation email's signed
--    links, and the client dashboard's file list.
