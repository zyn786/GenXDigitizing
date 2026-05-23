-- Add notifications table to supabase_realtime publication.
-- This fixes realtime subscriptions silently failing for notifications.
-- Without this, browser popup notifications and live badge counts never fire.

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
