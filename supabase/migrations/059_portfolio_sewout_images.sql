-- ============================================================
-- Portfolio Sewout Images
-- Marks a portfolio image as a real stitched sew-out sample
-- (production proof) rather than a digitized file preview.
-- ============================================================

ALTER TABLE public.portfolio_images
  ADD COLUMN IF NOT EXISTS is_sewout BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.portfolio_images.is_sewout IS
  'True when the image is a real stitched sew-out sample of the design';

CREATE INDEX IF NOT EXISTS idx_portfolio_images_sewout
  ON public.portfolio_images(is_sewout)
  WHERE is_sewout = true;
