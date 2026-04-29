-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE', 'REFERRAL', 'WHATSAPP', 'DIRECT_VISIT', 'CAMPAIGN', 'MANUAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DesignPlacement" AS ENUM ('LEFT_CHEST', 'RIGHT_CHEST', 'HAT_FRONT', 'HAT_SIDE', 'HAT_BACK', 'LARGE_DESIGN', 'JACKET_BACK', 'JACKET_CHEST', 'SLEEVE_LEFT', 'SLEEVE_RIGHT', 'FULL_BACK', 'FULL_FRONT', 'POCKET', 'LEG', 'PUFF_LEFT_CHEST', 'PUFF_HAT', 'PUFF_JACKET_BACK', 'OTHER');

-- AlterTable: ClientProfile — add leadSource and counters
ALTER TABLE "ClientProfile"
  ADD COLUMN "leadSource" "LeadSource" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "freeDesignUsed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "totalOrderCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: WorkflowOrder — add production fields
ALTER TABLE "WorkflowOrder"
  ADD COLUMN "leadSource"          "LeadSource",
  ADD COLUMN "placement"           "DesignPlacement",
  ADD COLUMN "designHeightIn"      DECIMAL(6,2),
  ADD COLUMN "designWidthIn"       DECIMAL(6,2),
  ADD COLUMN "fabricType"          TEXT,
  ADD COLUMN "is3dPuffJacketBack"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "trims"               TEXT,
  ADD COLUMN "threadBrand"         TEXT,
  ADD COLUMN "colorDetails"        TEXT,
  ADD COLUMN "colorQuantity"       INTEGER,
  ADD COLUMN "fileFormats"         TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "stitchCount"         INTEGER,
  ADD COLUMN "specialInstructions" TEXT,
  ADD COLUMN "isFreeDesign"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "estimatedPrice"      DECIMAL(12,2),
  ADD COLUMN "quantity"            INTEGER NOT NULL DEFAULT 1;

-- CreateTable: PricingConfig
CREATE TABLE "PricingConfig" (
    "id"              TEXT NOT NULL,
    "key"             TEXT NOT NULL,
    "value"           TEXT NOT NULL,
    "label"           TEXT,
    "description"     TEXT,
    "updatedByUserId" TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PricingConfig_key_key" ON "PricingConfig"("key");

-- CreateTable: BulkDiscountRule
CREATE TABLE "BulkDiscountRule" (
    "id"              TEXT NOT NULL,
    "minQty"          INTEGER NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "label"           TEXT,
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "sortOrder"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkDiscountRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BulkDiscountRule_isActive_minQty_idx" ON "BulkDiscountRule"("isActive", "minQty");

-- Seed default bulk discount rules
INSERT INTO "BulkDiscountRule" ("id", "minQty", "discountPercent", "label", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 5,  5,  'Small batch',    true, 5,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 10, 10, 'Medium batch',   true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 25, 15, 'Large batch',    true, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 50, 20, 'Production run', true, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed default pricing config
INSERT INTO "PricingConfig" ("id", "key", "value", "label", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'stitch_rate_per_1000',       '1.00',  'Stitch rate per 1,000 stitches ($)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'stitch_pricing_enabled',     'true',  'Enable stitch-count pricing',        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'free_first_design_enabled',  'true',  'Free first design for new clients',  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'puff_jacket_back_base_price','35.00', '3D Puff Jacket Back base price ($)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
