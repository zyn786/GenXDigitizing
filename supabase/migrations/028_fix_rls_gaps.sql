-- Fix RLS gaps: scope client invoice insert, subscription update, notification insert
DROP POLICY IF EXISTS invoices_client_insert ON invoices;

DROP POLICY IF EXISTS sub_client_update ON client_subscriptions;
CREATE POLICY sub_client_update ON client_subscriptions FOR UPDATE
  USING (client_id = my_client_id())
  WITH CHECK (status IN ('cancellation_requested', 'active') AND client_id = my_client_id());

DROP POLICY IF EXISTS notifs_insert_any ON notifications;
CREATE POLICY notifs_insert_any ON notifications FOR INSERT
  WITH CHECK (user_id = auth.uid() OR my_role() = 'admin'::user_role);
