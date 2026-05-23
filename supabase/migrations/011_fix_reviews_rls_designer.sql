-- Allow designers to read reviews for their own orders.
-- Previously, designers were blocked by the reviews_read_all policy
-- which only allows is_published=true OR admin/crm roles.
-- This caused getDesignerCompletedOrders to fail when embedding reviews.

create policy "reviews_designer_read" on public.reviews for select
  using (public.my_role() = 'designer' and order_id in (
    select id from public.orders where designer_id = public.my_designer_id()
  ));
