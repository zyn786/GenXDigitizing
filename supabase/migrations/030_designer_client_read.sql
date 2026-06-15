-- Allow designers to read client company names for assigned orders
CREATE POLICY clients_designer_read ON clients FOR SELECT
  USING (my_role() = 'designer'::user_role);
