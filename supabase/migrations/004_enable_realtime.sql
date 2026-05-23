-- Enable realtime for tables used in realtime subscriptions.
-- Adds tables to supabase_realtime publication and sets REPLICA IDENTITY FULL
-- so that UPDATE/DELETE events include the full row (old record).

-- Add tables to publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

-- REPLICA IDENTITY FULL needed for UPDATE/DELETE to include old row data
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER TABLE public.order_files REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
