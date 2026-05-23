-- ============================================================
-- STITCHPRO SETUP — STEP 6 of 6
-- Paste this in Supabase SQL Editor and click RUN
-- Run AFTER Step 5
-- ============================================================
--
-- COMPATIBILITY NOTE — order_files.file_url storage formats
-- Existing rows may store full public URLs (https://.../object/public/{bucket}/...)
-- or signed URLs (https://.../object/sign/{bucket}/...). New rows store raw storage
-- paths (e.g. userId/timestamp.ext). The getOrderDetail / getClientOrderById /
-- getAdminOrderById query functions handle all three formats:
--   1. Full public URL  → parses path after /object/public/{bucket}/
--   2. Full signed URL  → parses path after /object/sign/{bucket}/
--   3. Plain path       → uses the value directly
-- Falls back to original file_url value if parsing fails. No migration needed.
-- ============================================================

-- TABLE: order_edit_log
CREATE TABLE IF NOT EXISTS public.order_edit_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  changed_by        uuid NOT NULL REFERENCES public.users(id),
  field_name        text NOT NULL,
  old_value         text,
  new_value         text,
  reviewed_by_admin boolean NOT NULL DEFAULT false,
  reviewed_by       uuid REFERENCES public.users(id),
  reviewed_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.order_edit_log(order_id);
CREATE INDEX ON public.order_edit_log(reviewed_by_admin) WHERE reviewed_by_admin = false;

ALTER TABLE public.order_edit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_all_edit_log"    ON public.order_edit_log FOR ALL    USING (public.my_role() IN ('admin','crm'));
CREATE POLICY "client_own_edit_log"    ON public.order_edit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o JOIN public.clients c ON o.client_id = c.id WHERE o.id = order_id AND c.user_id = auth.uid())
);
CREATE POLICY "client_insert_edit_log" ON public.order_edit_log FOR INSERT WITH CHECK (changed_by = auth.uid());

select 'Step 6 done ✓ — order_edit_log table created' as status;
