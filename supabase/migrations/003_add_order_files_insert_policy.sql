-- Allow clients to insert rows into order_files after uploading to storage
-- Previously only SELECT was allowed, so file records were silently dropped
create policy "files_client_insert" on public.order_files for insert
  with check (public.my_role() = 'client'
    and order_id in (select id from public.orders where client_id = public.my_client_id()));
