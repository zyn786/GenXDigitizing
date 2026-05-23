-- ============================================================
-- Portfolio Management System
-- ============================================================

-- ── Categories ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL UNIQUE,
  slug        TEXT        NOT NULL UNIQUE,
  emoji       TEXT        NOT NULL DEFAULT '✦',
  color       TEXT        NOT NULL DEFAULT '#A855F7',
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Portfolio project categories';

-- ── Portfolio Projects ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portfolios (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT        NOT NULL,
  slug          TEXT        NOT NULL UNIQUE,
  description   TEXT        NOT NULL DEFAULT '',
  client_name   TEXT,
  category_id   UUID        NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  stitches      INT,
  colors        INT         NOT NULL DEFAULT 1,
  output_format TEXT        NOT NULL DEFAULT 'DST',
  turnaround    TEXT        NOT NULL DEFAULT 'Standard',
  design_size   TEXT        NOT NULL DEFAULT '',
  accent        TEXT        NOT NULL DEFAULT '#A855F7',
  featured      BOOLEAN     NOT NULL DEFAULT false,
  visible       BOOLEAN     NOT NULL DEFAULT true,
  tags          TEXT[]      NOT NULL DEFAULT '{}',
  sort_order    INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.portfolios IS 'Portfolio showcase projects';
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON public.portfolios(category_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_featured ON public.portfolios(featured);
CREATE INDEX IF NOT EXISTS idx_portfolios_visible ON public.portfolios(visible);
CREATE INDEX IF NOT EXISTS idx_portfolios_sort ON public.portfolios(sort_order);

-- ── Portfolio Images ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portfolio_images (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id  UUID        NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  url           TEXT        NOT NULL,
  thumbnail_url TEXT,
  blurhash      TEXT,
  alt           TEXT,
  width         INT,
  height        INT,
  sort_order    INT         NOT NULL DEFAULT 0,
  is_before     BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.portfolio_images IS 'Images attached to portfolio projects';
CREATE INDEX IF NOT EXISTS idx_portfolio_images_portfolio ON public.portfolio_images(portfolio_id);

-- ── RLS: Enable ─────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;

-- ── RLS: Public read ────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "Public can read categories" ON public.categories
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can read visible portfolios" ON public.portfolios
    FOR SELECT USING (visible = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can read portfolio images" ON public.portfolio_images
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── RLS: Admin full access ──────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "Admin full access categories" ON public.categories
    FOR ALL USING (EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin full access portfolios" ON public.portfolios
    FOR ALL USING (EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin full access portfolio_images" ON public.portfolio_images
    FOR ALL USING (EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Seed default categories ─────────────────────────────────
INSERT INTO public.categories (name, slug, emoji, color, sort_order) VALUES
  ('Embroidery Digitizing', 'digitizing', '🧵', '#2FA4D7', 1),
  ('Vector Art',            'vector',     '✏️', '#E76F2E', 2),
  ('Patch Design',          'patches',    '🏷️', '#10B981', 3)
ON CONFLICT (slug) DO NOTHING;

-- ── Trigger: update updated_at ──────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_categories
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_portfolios
    BEFORE UPDATE ON public.portfolios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
