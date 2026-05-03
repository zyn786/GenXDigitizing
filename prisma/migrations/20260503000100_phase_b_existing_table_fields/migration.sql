-- Phase B -- Add fields to existing tables (WorkflowOrder, ClientProfile, StaffProfile, Invoice)

-- WorkflowOrder: add 16 new fields for quote/proof/payment lifecycle
ALTER TABLE "WorkflowOrder"
  ADD COLUMN "cancelledAt"       TIMESTAMP(3),
  ADD COLUMN "cancelReason"      TEXT,
  ADD COLUMN "cancelledByUserId" TEXT,
  ADD COLUMN "quoteStatus"       "QuoteStatus",
  ADD COLUMN "quotedPrice"       DECIMAL(12,2),
  ADD COLUMN "pricedAt"          TIMESTAMP(3),
  ADD COLUMN "pricedByUserId"    TEXT,
  ADD COLUMN "quoteAcceptedAt"   TIMESTAMP(3),
  ADD COLUMN "quoteRejectedAt"   TIMESTAMP(3),
  ADD COLUMN "quoteClientNotes"  TEXT,
  ADD COLUMN "proofStatus"       "ProofStatus" NOT NULL DEFAULT 'NOT_UPLOADED',
  ADD COLUMN "proofSentAt"       TIMESTAMP(3),
  ADD COLUMN "proofSentByUserId" TEXT,
  ADD COLUMN "proofApprovedAt"   TIMESTAMP(3),
  ADD COLUMN "proofReviewNote"   TEXT,
  ADD COLUMN "paymentStatus"     "OrderPaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED';

-- ClientProfile: add address field
ALTER TABLE "ClientProfile"
  ADD COLUMN "address" TEXT;

-- StaffProfile: add commission fields
ALTER TABLE "StaffProfile"
  ADD COLUMN "commissionType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
  ADD COLUMN "commissionRate" DECIMAL(6,2) NOT NULL DEFAULT 0;

-- Invoice: add filesUnlocked field
ALTER TABLE "Invoice"
  ADD COLUMN "filesUnlocked" BOOLEAN NOT NULL DEFAULT false;

-- Foreign key: WorkflowOrder.cancelledByUserId -> User.id
ALTER TABLE "WorkflowOrder"
  ADD CONSTRAINT "WorkflowOrder_cancelledByUserId_fkey"
    FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
