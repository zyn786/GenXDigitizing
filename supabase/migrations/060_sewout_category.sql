-- ============================================================
-- Portfolio: "Sew-out Samples" category
-- A fourth portfolio category alongside digitizing / vector / patches.
-- Note: the legacy `sewout` slug used by service_tiers is Patch Design —
-- this portfolio category is deliberately `sewouts` to stay unambiguous.
-- ============================================================

INSERT INTO public.categories (name, slug, emoji, color, sort_order) VALUES
  ('Sew-out Samples', 'sewouts', '🪡', '#7C3AED', 4)
ON CONFLICT (slug) DO NOTHING;
