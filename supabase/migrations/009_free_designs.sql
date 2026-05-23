-- ============================================================
-- Free Designs System
-- ============================================================

-- ── Free Designs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.free_designs (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT        NOT NULL,
  slug            TEXT        NOT NULL UNIQUE,
  description     TEXT        NOT NULL DEFAULT '',
  stitch_count    INT         NOT NULL DEFAULT 0,
  colors          INT         NOT NULL DEFAULT 1,
  design_size     TEXT        NOT NULL DEFAULT '',
  formats         TEXT[]      NOT NULL DEFAULT '{}',
  machines        TEXT[]      NOT NULL DEFAULT '{}',
  download_url    TEXT,
  download_count  INT         NOT NULL DEFAULT 0,
  featured        BOOLEAN     NOT NULL DEFAULT false,
  visible         BOOLEAN     NOT NULL DEFAULT true,
  sort_order      INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.free_designs IS 'Free downloadable embroidery design samples';

CREATE INDEX IF NOT EXISTS idx_free_designs_featured ON public.free_designs(featured);
CREATE INDEX IF NOT EXISTS idx_free_designs_visible  ON public.free_designs(visible);
CREATE INDEX IF NOT EXISTS idx_free_designs_sort     ON public.free_designs(sort_order);

-- ── Free Design Preview Images ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.free_design_images (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id       UUID        NOT NULL REFERENCES public.free_designs(id) ON DELETE CASCADE,
  url             TEXT        NOT NULL,
  thumbnail_url   TEXT,
  blurhash        TEXT,
  alt             TEXT,
  width           INT,
  height          INT,
  sort_order      INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.free_design_images IS 'Preview images for free designs';
CREATE INDEX IF NOT EXISTS idx_free_design_images_design ON public.free_design_images(design_id);

-- ── RLS: Enable ─────────────────────────────────────────────
ALTER TABLE public.free_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_design_images ENABLE ROW LEVEL SECURITY;

-- ── RLS: Public read ────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "Public can read visible free designs" ON public.free_designs
    FOR SELECT USING (visible = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can read free design images" ON public.free_design_images
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── RLS: Admin full access ──────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "Admin full access free designs" ON public.free_designs
    FOR ALL USING (EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin full access free design images" ON public.free_design_images
    FOR ALL USING (EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Trigger: update updated_at ──────────────────────────────
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_free_designs
    BEFORE UPDATE ON public.free_designs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
