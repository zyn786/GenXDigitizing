-- Phase A.1 -- Create 13 new enum types for the workflow, marketing, and commission systems

-- CreateEnum: OrderFileType
CREATE TYPE "OrderFileType" AS ENUM ('PROOF_PREVIEW', 'FINAL_FILE');

-- CreateEnum: QuoteStatus
CREATE TYPE "QuoteStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'PRICE_SENT', 'CLIENT_ACCEPTED', 'CLIENT_REJECTED', 'CONVERTED_TO_ORDER', 'CANCELLED');

-- CreateEnum: ProofStatus
CREATE TYPE "ProofStatus" AS ENUM ('NOT_UPLOADED', 'UPLOADED', 'INTERNAL_REVIEW', 'PENDING_ADMIN_PROOF_REVIEW', 'PROOF_APPROVED_BY_ADMIN', 'PROOF_REJECTED_BY_ADMIN', 'SENT_TO_CLIENT', 'CLIENT_REVIEWING', 'CLIENT_APPROVED', 'REVISION_REQUESTED');

-- CreateEnum: OrderRevisionStatus
CREATE TYPE "OrderRevisionStatus" AS ENUM ('REQUESTED_BY_CLIENT', 'CREATED_BY_ADMIN', 'UNDER_ADMIN_REVIEW', 'ASSIGNED_TO_DESIGNER', 'IN_PROGRESS', 'REVISED_PROOF_UPLOADED', 'COMPLETED', 'CANCELLED');

-- CreateEnum: OrderPaymentStatus
CREATE TYPE "OrderPaymentStatus" AS ENUM ('NOT_REQUIRED', 'PAYMENT_PENDING', 'PAYMENT_SUBMITTED', 'PAYMENT_UNDER_REVIEW', 'PAID', 'PARTIALLY_PAID', 'REJECTED', 'REFUNDED');

-- CreateEnum: PortfolioApprovalStatus
CREATE TYPE "PortfolioApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'DECLINED', 'DRAFT', 'ARCHIVED');

-- CreateEnum: CouponDiscountType
CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum: CampaignType
CREATE TYPE "CampaignType" AS ENUM ('DISCOUNT', 'REFERRAL', 'FOLLOW_UP', 'SEASONAL');

-- CreateEnum: CampaignStatus
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'REJECTED', 'COMPLETED');

-- CreateEnum: ManualPaymentAccountType
CREATE TYPE "ManualPaymentAccountType" AS ENUM ('BANK_ACCOUNT', 'CASH_APP', 'PAYPAL', 'VENMO', 'WISE', 'ZELLE', 'OTHER');

-- CreateEnum: PaymentProofStatus
CREATE TYPE "PaymentProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum: CommissionType
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FLAT_RATE');

-- CreateEnum: CommissionStatus
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
