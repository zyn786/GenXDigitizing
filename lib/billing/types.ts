export type CurrencyCode =
  | "USD"
  | "GBP"
  | "EUR"
  | "CAD"
  | "AUD"
  | (string & {});

export type BillingStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type InvoiceStatus = BillingStatus;

export type InvoiceLineItemRecord = {
  id: string;
  label: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  position: number;
};

export type InvoiceDiscountRecord = {
  id: string;
  label: string;
  source: string;
  percentage: number;
  appliedAmount: number;
  approvalNote?: string | null;
};

export type PaymentRecord = {
  id: string;
  receiptNumber: string;
  amount: number;
  currency: CurrencyCode;
  method: string;
  reference?: string | null;
  clientEmail: string;
  backupEmail?: string | null;
  receiptSentAt?: string | null;
  receivedAt: string;
  note?: string | null;
};

export type InvoicePayment = PaymentRecord;

export type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  orderId: string;
  clientName: string;
  clientEmail: string;
  backupEmail?: string | null;
  currency: CurrencyCode;
  status: InvoiceStatus;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  sentAt?: string | null;
  notes?: string | null;
  lineItems?: InvoiceLineItemRecord[];
  discountLines?: InvoiceDiscountRecord[];
  payments?: PaymentRecord[];
};

export type InvoiceDetailRecord = InvoiceRecord & {
  lineItems: InvoiceLineItemRecord[];
  discountLines: InvoiceDiscountRecord[];
  payments: PaymentRecord[];
};