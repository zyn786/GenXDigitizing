export type ManualPaymentAccountType =
  | "BANK_ACCOUNT"
  | "CASH_APP"
  | "PAYPAL"
  | "VENMO"
  | "WISE"
  | "ZELLE"
  | "OTHER";

export type PaymentProofStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ManualPaymentAccountRecord = {
  id: string;
  type: ManualPaymentAccountType;
  displayName: string;
  accountName: string;
  accountId: string;
  instructions: string | null;
  paymentLink: string | null;
  currency: string;
  isActive: boolean;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PaymentProofRecord = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  orderNumber: string;
  clientUserId: string;
  clientName: string;
  clientEmail: string;
  paymentAccountId: string | null;
  paymentAccountName: string | null;
  status: PaymentProofStatus;
  proofImageKey: string;
  proofImageBucket: string;
  amountClaimed: number;
  clientNotes: string | null;
  rejectionReason: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  submittedAt: string;
};

export type OrderFileRecord = {
  id: string;
  orderId: string;
  fileName: string;
  objectKey: string;
  bucket: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string | null;
  createdAt: string;
};
