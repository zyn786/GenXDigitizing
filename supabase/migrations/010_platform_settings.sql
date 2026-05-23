-- Platform Settings (key-value store)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
DO $$ BEGIN
  CREATE POLICY "Admin manage platform settings" ON public.platform_settings
    FOR ALL USING (EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public can read
DO $$ BEGIN
  CREATE POLICY "Public read platform settings" ON public.platform_settings
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
