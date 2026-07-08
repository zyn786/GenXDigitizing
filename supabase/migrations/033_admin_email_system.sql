-- Migration 033: Admin email system — sent + received email tracking
-- Supports the admin /email page: compose, sent history, and inbound inbox.

-- ============================================================
-- 1. Sent emails log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sent_emails (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email    text        NOT NULL,
  from_email  text        NOT NULL DEFAULT '',
  subject     text        NOT NULL DEFAULT '',
  body        text        NOT NULL DEFAULT '',
  sent_by     uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  resend_id   text,
  sent_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sent_emails IS 'Log of all emails sent from admin email composer';

-- ============================================================
-- 2. Received / inbound emails
-- ============================================================
CREATE TABLE IF NOT EXISTS public.received_emails (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_email    text        NOT NULL,
  to_email      text        NOT NULL,
  subject       text        NOT NULL DEFAULT '',
  body_html     text,
  body_text     text,
  resend_id     text,
  received_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.received_emails IS 'Inbound emails received via Resend webhook';

-- ============================================================
-- 3. RLS — admin only
-- ============================================================
ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.received_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY sent_emails_admin_all ON public.sent_emails FOR ALL TO authenticated
  USING (public.my_role() = 'admin');

CREATE POLICY received_emails_admin_all ON public.received_emails FOR ALL TO authenticated
  USING (public.my_role() = 'admin');

-- Allow anon to insert received emails (webhook is unauthenticated)
CREATE POLICY received_emails_anon_insert ON public.received_emails FOR INSERT TO anon
  WITH CHECK (true);
