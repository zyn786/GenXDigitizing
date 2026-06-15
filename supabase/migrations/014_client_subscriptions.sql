-- Client subscription plans
CREATE TABLE IF NOT EXISTS public.client_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'starter',
  designs_total INT NOT NULL DEFAULT 10,
  designs_used INT NOT NULL DEFAULT 0,
  designs_rolled_over INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','paused','cancelled','expired')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_subscriptions_client ON public.client_subscriptions (client_id);

ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sub_client_read ON public.client_subscriptions FOR SELECT TO authenticated USING (client_id = public.my_client_id());
CREATE POLICY sub_admin_all ON public.client_subscriptions FOR ALL TO authenticated USING (public.my_role() = 'admin');
