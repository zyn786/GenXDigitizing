-- Allow clients to upload to outputs bucket (chat attachments, etc.)
drop policy if exists "outputs_upload" on storage.objects;
create policy "outputs_upload" on storage.objects for insert
  with check (bucket_id = 'outputs' and public.my_role() in ('designer','admin','client'));
