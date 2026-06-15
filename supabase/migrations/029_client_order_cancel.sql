-- Allow clients to cancel their own orders (ghost cleanup on upload failure)
CREATE POLICY orders_client_cancel ON orders FOR UPDATE
  USING (my_role() = 'client'::user_role AND client_id = my_client_id())
  WITH CHECK (status = 'cancelled');
