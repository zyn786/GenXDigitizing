-- Phase C -- Create 14 new tables for workflow, portfolio, marketing, billing, and pricing
--
-- Table creation order respects FK dependencies:
--   1. ServiceCategory (no FK deps)
--   2. ServiceTier -> ServiceCategory
--   3. ServiceAddon (no FK deps)
--   4. DeliveryOption (no FK deps)
--   5. ManualPaymentAccount (no FK deps)
--   6. DesignerCommission -> User, StaffProfile, WorkflowOrder
--   7. OrderFile -> WorkflowOrder, User
--   8. ClientReferenceFile -> WorkflowOrder, User
--   9. OrderRevision -> WorkflowOrder, User
--  10. PaymentProofSubmission -> Invoice, User, ManualPaymentAccount
--  11. PortfolioItem -> User
--  12. ActivityLog -> User
--  13. Coupon -> User
--  14. MarketingCampaign -> User

-- ============================================================
-- Table 1: ServiceCategory
-- ============================================================
CREATE TABLE "ServiceCategory" (
    "id"          TEXT        NOT NULL,
    "key"         TEXT        NOT NULL,
    "label"       TEXT        NOT NULL,
    "emoji"       TEXT,
    "description" TEXT,
    "isActive"    BOOLEAN     NOT NULL DEFAULT true,
    "sortOrder"   INTEGER     NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceCategory_key_key" ON "ServiceCategory"("key");
CREATE INDEX "ServiceCategory_isActive_sortOrder_idx" ON "ServiceCategory"("isActive", "sortOrder");

-- ============================================================
-- Table 2: ServiceTier
-- ============================================================
CREATE TABLE "ServiceTier" (
    "id"         TEXT        NOT NULL,
    "categoryId" TEXT        NOT NULL,
    "key"        TEXT        NOT NULL,
    "label"      TEXT        NOT NULL,
    "basePrice"  DECIMAL(10,2) NOT NULL,
    "isActive"   BOOLEAN     NOT NULL DEFAULT true,
    "sortOrder"  INTEGER     NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceTier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceTier_categoryId_key_key" ON "ServiceTier"("categoryId", "key");
CREATE INDEX "ServiceTier_categoryId_isActive_idx" ON "ServiceTier"("categoryId", "isActive");

ALTER TABLE "ServiceTier"
  ADD CONSTRAINT "ServiceTier_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- Table 3: ServiceAddon
-- ============================================================
CREATE TABLE "ServiceAddon" (
    "id"        TEXT        NOT NULL,
    "key"       TEXT        NOT NULL,
    "label"     TEXT        NOT NULL,
    "price"     DECIMAL(10,2) NOT NULL,
    "isActive"  BOOLEAN     NOT NULL DEFAULT true,
    "sortOrder" INTEGER     NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceAddon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceAddon_key_key" ON "ServiceAddon"("key");

-- ============================================================
-- Table 4: DeliveryOption
-- ============================================================
CREATE TABLE "DeliveryOption" (
    "id"         TEXT        NOT NULL,
    "key"        TEXT        NOT NULL,
    "label"      TEXT        NOT NULL,
    "subLabel"   TEXT,
    "extraPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive"   BOOLEAN     NOT NULL DEFAULT true,
    "sortOrder"  INTEGER     NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliveryOption_key_key" ON "DeliveryOption"("key");

-- ============================================================
-- Table 5: ManualPaymentAccount
-- ============================================================
CREATE TABLE "ManualPaymentAccount" (
    "id"           TEXT        NOT NULL,
    "type"         "ManualPaymentAccountType" NOT NULL,
    "displayName"  TEXT        NOT NULL,
    "accountName"  TEXT        NOT NULL,
    "accountId"    TEXT        NOT NULL,
    "instructions" TEXT,
    "paymentLink"  TEXT,
    "currency"     TEXT        NOT NULL DEFAULT 'USD',
    "isActive"     BOOLEAN     NOT NULL DEFAULT true,
    "notes"        TEXT,
    "sortOrder"    INTEGER     NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualPaymentAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ManualPaymentAccount_isActive_sortOrder_idx" ON "ManualPaymentAccount"("isActive", "sortOrder");

-- ============================================================
-- Table 6: DesignerCommission
-- ============================================================
CREATE TABLE "DesignerCommission" (
    "id"            TEXT        NOT NULL,
    "designerId"    TEXT        NOT NULL,
    "staffProfileId" TEXT,
    "orderId"       TEXT        NOT NULL,
    "amount"        DECIMAL(10,2) NOT NULL,
    "rate"          DECIMAL(6,2) NOT NULL,
    "type"          "CommissionType" NOT NULL,
    "status"        "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt"        TIMESTAMP(3),
    "notes"         TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignerCommission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DesignerCommission_orderId_key" ON "DesignerCommission"("orderId");
CREATE INDEX "DesignerCommission_designerId_idx" ON "DesignerCommission"("designerId");
CREATE INDEX "DesignerCommission_status_idx" ON "DesignerCommission"("status");

ALTER TABLE "DesignerCommission"
  ADD CONSTRAINT "DesignerCommission_designerId_fkey"
    FOREIGN KEY ("designerId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DesignerCommission"
  ADD CONSTRAINT "DesignerCommission_staffProfileId_fkey"
    FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DesignerCommission"
  ADD CONSTRAINT "DesignerCommission_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "WorkflowOrder"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- Table 7: OrderFile
-- ============================================================
CREATE TABLE "OrderFile" (
    "id"               TEXT        NOT NULL,
    "orderId"          TEXT        NOT NULL,
    "uploadedByUserId" TEXT,
    "fileName"         TEXT        NOT NULL,
    "objectKey"        TEXT        NOT NULL,
    "bucket"           TEXT        NOT NULL,
    "mimeType"         TEXT        NOT NULL,
    "sizeBytes"        INTEGER     NOT NULL,
    "fileType"         "OrderFileType" NOT NULL DEFAULT 'FINAL_FILE',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderFile_objectKey_key" ON "OrderFile"("objectKey");
CREATE INDEX "OrderFile_orderId_idx" ON "OrderFile"("orderId");
CREATE INDEX "OrderFile_uploadedByUserId_idx" ON "OrderFile"("uploadedByUserId");

ALTER TABLE "OrderFile"
  ADD CONSTRAINT "OrderFile_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "WorkflowOrder"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderFile"
  ADD CONSTRAINT "OrderFile_uploadedByUserId_fkey"
    FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Table 8: ClientReferenceFile
-- ============================================================
CREATE TABLE "ClientReferenceFile" (
    "id"             TEXT        NOT NULL,
    "orderId"        TEXT        NOT NULL,
    "uploaderUserId" TEXT,
    "uploaderEmail"  TEXT,
    "fileName"       TEXT        NOT NULL,
    "objectKey"      TEXT        NOT NULL,
    "bucket"         TEXT        NOT NULL,
    "mimeType"       TEXT        NOT NULL,
    "sizeBytes"      INTEGER     NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientReferenceFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientReferenceFile_objectKey_key" ON "ClientReferenceFile"("objectKey");
CREATE INDEX "ClientReferenceFile_orderId_idx" ON "ClientReferenceFile"("orderId");
CREATE INDEX "ClientReferenceFile_uploaderUserId_idx" ON "ClientReferenceFile"("uploaderUserId");

ALTER TABLE "ClientReferenceFile"
  ADD CONSTRAINT "ClientReferenceFile_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "WorkflowOrder"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientReferenceFile"
  ADD CONSTRAINT "ClientReferenceFile_uploaderUserId_fkey"
    FOREIGN KEY ("uploaderUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Table 9: OrderRevision
-- ============================================================
CREATE TABLE "OrderRevision" (
    "id"                TEXT        NOT NULL,
    "orderId"           TEXT        NOT NULL,
    "status"            "OrderRevisionStatus" NOT NULL DEFAULT 'REQUESTED_BY_CLIENT',
    "requestedByUserId" TEXT,
    "assignedToUserId"  TEXT,
    "assignedByUserId"  TEXT,
    "clientNotes"       TEXT,
    "adminNotes"        TEXT,
    "versionLabel"      TEXT,
    "assignedAt"        TIMESTAMP(3),
    "completedAt"       TIMESTAMP(3),
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderRevision_orderId_idx" ON "OrderRevision"("orderId");
CREATE INDEX "OrderRevision_assignedToUserId_idx" ON "OrderRevision"("assignedToUserId");
CREATE INDEX "OrderRevision_status_idx" ON "OrderRevision"("status");

ALTER TABLE "OrderRevision"
  ADD CONSTRAINT "OrderRevision_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "WorkflowOrder"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderRevision"
  ADD CONSTRAINT "OrderRevision_requestedByUserId_fkey"
    FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderRevision"
  ADD CONSTRAINT "OrderRevision_assignedToUserId_fkey"
    FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Table 10: PaymentProofSubmission
-- ============================================================
CREATE TABLE "PaymentProofSubmission" (
    "id"               TEXT        NOT NULL,
    "invoiceId"        TEXT        NOT NULL,
    "clientUserId"     TEXT        NOT NULL,
    "paymentAccountId" TEXT,
    "status"           "PaymentProofStatus" NOT NULL DEFAULT 'PENDING',
    "proofImageKey"    TEXT        NOT NULL,
    "proofImageBucket" TEXT        NOT NULL,
    "amountClaimed"    DECIMAL(12,2) NOT NULL,
    "clientNotes"      TEXT,
    "rejectionReason"  TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt"       TIMESTAMP(3),
    "submittedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentProofSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentProofSubmission_invoiceId_idx" ON "PaymentProofSubmission"("invoiceId");
CREATE INDEX "PaymentProofSubmission_clientUserId_idx" ON "PaymentProofSubmission"("clientUserId");
CREATE INDEX "PaymentProofSubmission_status_idx" ON "PaymentProofSubmission"("status");
CREATE INDEX "PaymentProofSubmission_paymentAccountId_idx" ON "PaymentProofSubmission"("paymentAccountId");
CREATE INDEX "PaymentProofSubmission_reviewedByUserId_idx" ON "PaymentProofSubmission"("reviewedByUserId");

ALTER TABLE "PaymentProofSubmission"
  ADD CONSTRAINT "PaymentProofSubmission_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentProofSubmission"
  ADD CONSTRAINT "PaymentProofSubmission_clientUserId_fkey"
    FOREIGN KEY ("clientUserId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentProofSubmission"
  ADD CONSTRAINT "PaymentProofSubmission_paymentAccountId_fkey"
    FOREIGN KEY ("paymentAccountId") REFERENCES "ManualPaymentAccount"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentProofSubmission"
  ADD CONSTRAINT "PaymentProofSubmission_reviewedByUserId_fkey"
    FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Table 11: PortfolioItem
-- ============================================================
CREATE TABLE "PortfolioItem" (
    "id"               TEXT        NOT NULL,
    "title"            TEXT        NOT NULL,
    "serviceKey"       TEXT        NOT NULL,
    "nicheSlug"        TEXT,
    "description"      TEXT,
    "beforeImageKey"   TEXT,
    "afterImageKey"    TEXT,
    "tags"             TEXT[]      DEFAULT ARRAY[]::TEXT[],
    "isFeatured"       BOOLEAN     NOT NULL DEFAULT false,
    "isVisible"        BOOLEAN     NOT NULL DEFAULT true,
    "sortOrder"        INTEGER     NOT NULL DEFAULT 0,
    "seoTitle"         TEXT,
    "seoDescription"   TEXT,
    "createdByUserId"  TEXT,
    "approvalStatus"   "PortfolioApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "approvedByUserId" TEXT,
    "approvedAt"       TIMESTAMP(3),
    "declineReason"    TEXT,
    "declinedAt"       TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PortfolioItem_serviceKey_isVisible_idx" ON "PortfolioItem"("serviceKey", "isVisible");
CREATE INDEX "PortfolioItem_isVisible_sortOrder_idx" ON "PortfolioItem"("isVisible", "sortOrder");
CREATE INDEX "PortfolioItem_approvalStatus_isVisible_idx" ON "PortfolioItem"("approvalStatus", "isVisible");

ALTER TABLE "PortfolioItem"
  ADD CONSTRAINT "PortfolioItem_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PortfolioItem"
  ADD CONSTRAINT "PortfolioItem_approvedByUserId_fkey"
    FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Table 12: ActivityLog
-- ============================================================
CREATE TABLE "ActivityLog" (
    "id"          TEXT        NOT NULL,
    "actorUserId" TEXT,
    "actorEmail"  TEXT,
    "actorRole"   "Role",
    "action"      TEXT        NOT NULL,
    "entityType"  TEXT        NOT NULL,
    "entityId"    TEXT,
    "metadata"    JSONB,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityLog_actorUserId_idx" ON "ActivityLog"("actorUserId");
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

ALTER TABLE "ActivityLog"
  ADD CONSTRAINT "ActivityLog_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Table 13: Coupon
-- ============================================================
CREATE TABLE "Coupon" (
    "id"               TEXT        NOT NULL,
    "code"             TEXT        NOT NULL,
    "discountType"     "CouponDiscountType" NOT NULL,
    "discountValue"    DECIMAL(10,2) NOT NULL,
    "maxUses"          INTEGER,
    "usedCount"        INTEGER     NOT NULL DEFAULT 0,
    "expiresAt"        TIMESTAMP(3),
    "isActive"         BOOLEAN     NOT NULL DEFAULT false,
    "description"      TEXT,
    "approvedAt"       TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "createdByUserId"  TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_isActive_idx" ON "Coupon"("isActive");
CREATE INDEX "Coupon_createdByUserId_idx" ON "Coupon"("createdByUserId");

ALTER TABLE "Coupon"
  ADD CONSTRAINT "Coupon_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Coupon"
  ADD CONSTRAINT "Coupon_approvedByUserId_fkey"
    FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Table 14: MarketingCampaign
-- ============================================================
CREATE TABLE "MarketingCampaign" (
    "id"               TEXT        NOT NULL,
    "title"            TEXT        NOT NULL,
    "description"      TEXT,
    "type"             "CampaignType" NOT NULL,
    "status"           "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "targetAudience"   TEXT,
    "discountValue"    DECIMAL(10,2),
    "discountType"     "CouponDiscountType",
    "startDate"        TIMESTAMP(3),
    "endDate"          TIMESTAMP(3),
    "notes"            TEXT,
    "rejectionReason"  TEXT,
    "createdByUserId"  TEXT,
    "approvedByUserId" TEXT,
    "approvedAt"       TIMESTAMP(3),
    "rejectedAt"       TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketingCampaign_status_idx" ON "MarketingCampaign"("status");
CREATE INDEX "MarketingCampaign_createdByUserId_idx" ON "MarketingCampaign"("createdByUserId");

ALTER TABLE "MarketingCampaign"
  ADD CONSTRAINT "MarketingCampaign_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MarketingCampaign"
  ADD CONSTRAINT "MarketingCampaign_approvedByUserId_fkey"
    FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
