-- ============================================================
-- Migration 050: Notification failure log
-- ============================================================
--
-- SAFE TO APPLY ANY TIME — purely additive, and the code degrades without it.
--
-- The notification layer had no failure record. `notifyUsers` wrapped the
-- in-app insert and the push call in a try/catch that only called
-- console.error, and `sendPushToUsers` returned early with a console.warn when
-- VAPID keys were missing. So a deployment with no push credentials was
-- indistinguishable from one where nobody had subscribed, and a lost alert was
-- indistinguishable from a delivered one.
--
-- This is the record that makes those distinguishable. It answers "did that
-- notification actually go out, and if not, why?".
--
-- Failures are kept separate from `notifications` so the in-app inbox keeps
-- showing only real notifications.

CREATE TABLE IF NOT EXISTS public.notification_failures (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel         TEXT        NOT NULL CHECK (channel IN ('in_app','push','email')),
  reason          TEXT        NOT NULL DEFAULT '',
  title           TEXT        NOT NULL DEFAULT '',
  recipient_count INT         NOT NULL DEFAULT 0,
  resolved        BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notification_failures IS
  'Notifications that could not be delivered. Successful ones live in notifications.';

CREATE INDEX IF NOT EXISTS idx_notification_failures_created
  ON public.notification_failures (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_failures_unresolved
  ON public.notification_failures (created_at DESC) WHERE resolved = false;

ALTER TABLE public.notification_failures ENABLE ROW LEVEL SECURITY;

-- Admins only — internal operational data.
DO $$ BEGIN
  CREATE POLICY "Admin read notification failures" ON public.notification_failures
    FOR SELECT USING (public.my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin manage notification failures" ON public.notification_failures
    FOR ALL USING (public.my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Verification after applying: confirm push is not silently disabled.
--   select channel, count(*) from notification_failures
--   where resolved = false group by channel;
