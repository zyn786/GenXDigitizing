-- Migration 023: Add client_subscriptions to realtime publication
-- Enables real-time sync between client and admin for subscription events

ALTER PUBLICATION supabase_realtime ADD TABLE public.client_subscriptions;
ALTER TABLE public.client_subscriptions REPLICA IDENTITY FULL;
