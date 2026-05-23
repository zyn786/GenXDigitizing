-- Fix payment gating bypass: clients could query order_files directly via browser Supabase
-- to get output file URLs before paying. Now: output files only readable when invoice is paid.

-- Drop the old permissive client read policy
drop policy if exists "files_client_read" on public.order_files;

-- Artwork files: always readable by owning client
create policy "files_client_read_artwork" on public.order_files for select using (
  public.my_role() = 'client'
  and file_type = 'artwork'
  and order_id in (select id from public.orders where client_id = public.my_client_id())
);

-- Output files: only readable when invoice is paid
create policy "files_client_read_output" on public.order_files for select using (
  public.my_role() = 'client'
  and file_type = 'output'
  and order_id in (
    select o.id from public.orders o
    join public.invoices i on i.order_id = o.id
    where o.client_id = public.my_client_id() and i.status = 'paid'
  )
);
