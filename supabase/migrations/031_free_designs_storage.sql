-- ============================================================
-- Free Designs Storage Bucket
-- ============================================================

-- ── Bucket ─────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('free-designs', 'free-designs', true, 52428800, null)
on conflict (id) do nothing;

-- ── Policies ───────────────────────────────────────────────────
-- Admin can upload design files
drop policy if exists "free_designs_upload" on storage.objects;
create policy "free_designs_upload" on storage.objects for insert
  with check (bucket_id = 'free-designs' and public.my_role() = 'admin');

-- Public can download (free designs are publicly accessible)
drop policy if exists "free_designs_read" on storage.objects;
create policy "free_designs_read" on storage.objects for select
  using (bucket_id = 'free-designs');

-- Admin can delete/update
drop policy if exists "free_designs_admin" on storage.objects;
create policy "free_designs_admin" on storage.objects for update
  using (bucket_id = 'free-designs' and public.my_role() = 'admin')
  with check (bucket_id = 'free-designs' and public.my_role() = 'admin');

drop policy if exists "free_designs_delete" on storage.objects;
create policy "free_designs_delete" on storage.objects for delete
  using (bucket_id = 'free-designs' and public.my_role() = 'admin');
