-- ============================================================
-- Migration 046: Email failure log + delivery event tables
-- ============================================================
--
-- Two gaps closed here.
--
-- 1. Failed sends left no record. `sent_emails` is written ONLY on success (the
--    insert sits after the early return on error), so a bounced order
--    confirmation was indistinguishable from a delivered one and the in-app
--    record showed no trace of it. `email_failures` captures the failures.
--
-- 2. `app/api/webhooks/resend/route.ts` has been inserting into `email_events`,
--    `email_bounces` and `email_complaints` since it was written — but none of
--    those tables was ever created by a migration. PostgREST returns insert
--    failures in the resolved value rather than throwing, so the `.catch()`
--    handlers in that route never fired and every delivery/bounce/complaint
--    event was discarded in silence.

-- ── Failed outbound sends ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_failures (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email    TEXT        NOT NULL,
  from_email  TEXT        NOT NULL,
  subject     TEXT        NOT NULL DEFAULT '',
  error       TEXT        NOT NULL DEFAULT '',
  attempts    INT         NOT NULL DEFAULT 1,
  resolved    BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.email_failures IS
  'Outbound emails that failed to send. Successes live in sent_emails.';

CREATE INDEX IF NOT EXISTS idx_email_failures_created
  ON public.email_failures (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_failures_unresolved
  ON public.email_failures (created_at DESC) WHERE resolved = false;

ALTER TABLE public.email_failures ENABLE ROW LEVEL SECURITY;

-- Admins only — this is internal operational data, never public.
DO $$ BEGIN
  CREATE POLICY "Admin read email failures" ON public.email_failures
    FOR SELECT USING (public.my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin manage email failures" ON public.email_failures
    FOR ALL USING (public.my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Resend delivery events ──────────────────────────────────
-- Column names match what app/api/webhooks/resend/route.ts actually writes —
-- that route has been inserting into these tables since it was written, so the
-- shapes are taken from the code rather than invented here. Admin-only: they
-- carry recipient addresses.

CREATE TABLE IF NOT EXISTS public.email_events (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type  TEXT        NOT NULL,
  email_id    TEXT,
  from_email  TEXT,
  to_email    TEXT,
  subject     TEXT,
  payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.email_events IS
  'Resend delivery events (delivered, opened, clicked, bounced, complained).';

CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON public.email_events (email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_created  ON public.email_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_type     ON public.email_events (event_type);

-- The webhook upserts on `email`, so it must be unique — one row per address,
-- refreshed on each bounce rather than accumulating duplicates.
CREATE TABLE IF NOT EXISTS public.email_bounces (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT        NOT NULL UNIQUE,
  reason      TEXT,
  bounced_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.email_bounces IS 'Hard and soft bounces reported by Resend, deduped per address.';

CREATE INDEX IF NOT EXISTS idx_email_bounces_bounced ON public.email_bounces (bounced_at DESC);

CREATE TABLE IF NOT EXISTS public.email_complaints (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT        NOT NULL,
  complained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.email_complaints IS 'Spam complaints reported by Resend.';

CREATE INDEX IF NOT EXISTS idx_email_complaints_created ON public.email_complaints (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_complaints_email   ON public.email_complaints (email);

-- RLS: admin-only read. Inserts come from the webhook via the service-role key,
-- which bypasses RLS, so no insert policy is needed.
ALTER TABLE public.email_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_bounces    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_complaints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admin read email events" ON public.email_events
    FOR SELECT USING (public.my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin read email bounces" ON public.email_bounces
    FOR SELECT USING (public.my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin read email complaints" ON public.email_complaints
    FOR SELECT USING (public.my_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
