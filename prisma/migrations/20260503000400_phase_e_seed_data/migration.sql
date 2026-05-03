-- Phase E -- Seed data for service catalog, delivery options, and manual payment accounts
--
-- These inserts are idempotent: they use ON CONFLICT DO NOTHING so they can be
-- re-run safely during development.

-- ============================================================
-- Service Categories & Tiers (matches lib/quote-order/catalog.ts)
-- ============================================================

INSERT INTO "ServiceCategory" ("id", "key", "label", "emoji", "description", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'EMBROIDERY_DIGITIZING', 'Embroidery Digitizing',  '🧵', 'Professional embroidery digitizing for all garment types and placements.', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'VECTOR_ART',             'Vector Art Conversion',  '🎨', 'High-quality vector art conversion from raster images and logos.',        true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'COLOR_SEPARATION_DTF',   'Color Separation / DTF', '🖨️', 'Color separation and DTF screen setup for print production.',             true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CUSTOM_PATCHES',         'Custom Patches',         '🪡', 'Custom embroidered, woven, PVC, chenille, and leather patches.',          true, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- Insert tiers for EMBROIDERY_DIGITIZING
DO $$
DECLARE
  cat_id TEXT;
BEGIN
  SELECT "id" INTO cat_id FROM "ServiceCategory" WHERE "key" = 'EMBROIDERY_DIGITIZING';
  IF cat_id IS NOT NULL THEN
    INSERT INTO "ServiceTier" ("id", "categoryId", "key", "label", "basePrice", "isActive", "sortOrder", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid()::text, cat_id, 'cap',          'Cap / Hat',          12.00, true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, cat_id, 'left-chest',   'Left Chest',         12.00, true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, cat_id, 'standard-4-6', 'Standard (4" - 6")', 12.00, true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, cat_id, 'jacket-back',  'Jacket Back',        18.00, true, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, cat_id, 'large-8-12',   'Large (8" - 12")',   20.00, true, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("categoryId", "key") DO NOTHING;
  END IF;
END $$;

-- Insert tiers for VECTOR_ART
DO $$
DECLARE
  cat_id TEXT;
BEGIN
  SELECT "id" INTO cat_id FROM "ServiceCategory" WHERE "key" = 'VECTOR_ART';
  IF cat_id IS NOT NULL THEN
    INSERT INTO "ServiceTier" ("id", "categoryId", "key", "label", "basePrice", "isActive", "sortOrder", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid()::text, cat_id, 'jpg-to-vector',       'JPG to Vector',       18.00, true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, cat_id, 'print-ready-artwork', 'Print-Ready Artwork', 22.00, true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, cat_id, 'logo-redraw',         'Logo Redraw',         25.00, true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("categoryId", "key") DO NOTHING;
  END IF;
END $$;

-- Insert tiers for COLOR_SEPARATION_DTF
DO $$
DECLARE
  cat_id TEXT;
BEGIN
  SELECT "id" INTO cat_id FROM "ServiceCategory" WHERE "key" = 'COLOR_SEPARATION_DTF';
  IF cat_id IS NOT NULL THEN
    INSERT INTO "ServiceTier" ("id", "categoryId", "key", "label", "basePrice", "isActive", "sortOrder", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid()::text, cat_id, 'color-separation', 'Color Separation',   15.00, true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, cat_id, 'dtf-screen-setup', 'DTF Screen Setup',   18.00, true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("categoryId", "key") DO NOTHING;
  END IF;
END $$;

-- Insert tiers for CUSTOM_PATCHES
DO $$
DECLARE
  cat_id TEXT;
BEGIN
  SELECT "id" INTO cat_id FROM "ServiceCategory" WHERE "key" = 'CUSTOM_PATCHES';
  IF cat_id IS NOT NULL THEN
    INSERT INTO "ServiceTier" ("id", "categoryId", "key", "label", "basePrice", "isActive", "sortOrder", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid()::text, cat_id, 'embroidered-patches', 'Embroidered Patches', 24.00, true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, cat_id, 'chenille-patches',    'Chenille Patches',    30.00, true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, cat_id, 'pvc-patches',         'PVC Patches',         28.00, true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, cat_id, 'woven-patches',       'Woven Patches',       26.00, true, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, cat_id, 'leather-patches',     'Leather Patches',     32.00, true, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("categoryId", "key") DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- Service Addons
-- ============================================================
INSERT INTO "ServiceAddon" ("id", "key", "label", "price", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'rush-service',       'Rush Service (24h)',            8.00,  true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, '3d-puff-addon',      '3D Puff Add-on',                5.00,  true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'extra-format',       'Extra File Format',             2.00,  true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'mockup-preview',     'Mockup Preview Image',          3.00,  true, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'digitizing-review',  'Digitizing Review (re-edit)',   5.00,  true, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- ============================================================
-- Delivery Options
-- ============================================================
INSERT INTO "DeliveryOption" ("id", "key", "label", "subLabel", "extraPrice", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'standard',  'Standard',  '3-5 business days',  0.00, true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'express',   'Express',   '1-2 business days',  8.00, true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'rush',      'Rush',      'Same / next day',   15.00, true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- ============================================================
-- Manual Payment Accounts (displayed to clients for bank/payment info)
-- ============================================================
INSERT INTO "ManualPaymentAccount" ("id", "type", "displayName", "accountName", "accountId", "instructions", "paymentLink", "currency", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'BANK_ACCOUNT', 'Business Checking (Chase)',   'GenX Digitizing LLC', '****1234', 'Use order number as reference.', NULL, 'USD', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'PAYPAL',       'PayPal Business',             'GenX Digitizing LLC', 'paypal@genxdigitizing.com', 'Send via Friends & Family or Goods & Services.', 'https://paypal.me/genxdigitizing', 'USD', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CASH_APP',     'Cash App',                    'GenX Digitizing LLC', '$GenXDigitizing', 'Include order number in memo.', NULL, 'USD', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ZELLE',        'Zelle',                       'GenX Digitizing LLC', 'payments@genxdigitizing.com', 'Use order number as reference. No fee.', NULL, 'USD', true, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
