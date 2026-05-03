export type WorkflowStatus =
  | "DRAFT"
  | "NEW"
  | "QUOTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSIGNED_TO_DESIGNER"
  | "IN_PROGRESS"
  | "PROOF_READY"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "DELIVERED"
  | "CLOSED"
  | "CANCELLED";

export type WorkflowPriority = "STANDARD" | "URGENT" | "SAME_DAY";
export type RevisionStatus = "OPEN" | "IN_REVIEW" | "DONE";
export type DeliveryAssetKind = "PROOF" | "FINAL";

export type QuoteStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "PRICE_SENT"
  | "CLIENT_ACCEPTED"
  | "CLIENT_REJECTED"
  | "CONVERTED_TO_ORDER"
  | "CANCELLED";

export type ProofStatus =
  | "NOT_UPLOADED"
  | "UPLOADED"
  | "INTERNAL_REVIEW"
  | "PENDING_ADMIN_PROOF_REVIEW"
  | "PROOF_APPROVED_BY_ADMIN"
  | "PROOF_REJECTED_BY_ADMIN"
  | "SENT_TO_CLIENT"
  | "CLIENT_REVIEWING"
  | "CLIENT_APPROVED"
  | "REVISION_REQUESTED";

export type OrderRevisionStatus =
  | "REQUESTED_BY_CLIENT"
  | "CREATED_BY_ADMIN"
  | "UNDER_ADMIN_REVIEW"
  | "ASSIGNED_TO_DESIGNER"
  | "IN_PROGRESS"
  | "REVISED_PROOF_UPLOADED"
  | "COMPLETED"
  | "CANCELLED";

export type OrderPaymentStatus =
  | "NOT_REQUIRED"
  | "PAYMENT_PENDING"
  | "PAYMENT_SUBMITTED"
  | "PAYMENT_UNDER_REVIEW"
  | "PAID"
  | "PARTIALLY_PAID"
  | "REJECTED"
  | "REFUNDED";

export type OrderEvent = {
  id: string;
  at: string;
  title: string;
  body: string;
};

export type DeliveryAsset = {
  id: string;
  name: string;
  kind: DeliveryAssetKind;
  sizeLabel: string;
  format: string;
  ready: boolean;
};

export type RevisionRequest = {
  id: string;
  title: string;
  body: string;
  status: RevisionStatus;
  createdAt: string;
};

export type OrderRevision = {
  id: string;
  status: OrderRevisionStatus;
  clientNotes: string | null;
  adminNotes: string | null;
  versionLabel: string | null;
  requestedByName: string | null;
  assignedToName: string | null;
  assignedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type ProofVersion = {
  id: string;
  versionLabel: string;
  note: string;
  createdAt: string;
};

export type OrderFile = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string | null;
  createdAt: string;
};

export type OrderProduction = {
  placement: string | null;
  designHeightIn: number | null;
  designWidthIn: number | null;
  fabricType: string | null;
  is3dPuffJacketBack: boolean;
  trims: string | null;
  threadBrand: string | null;
  colorDetails: string | null;
  colorQuantity: number | null;
  fileFormats: string[];
  stitchCount: number | null;
  specialInstructions: string | null;
  isFreeDesign: boolean;
  estimatedPrice: number | null;
  quantity: number;
  leadSource: string | null;
};

export type WorkflowOrder = {
  id: string;
  reference: string;
  title: string;
  serviceLabel: string;
  clientName: string;
  companyName?: string | null;
  status: WorkflowStatus;
  quoteStatus: QuoteStatus | null;
  proofStatus: ProofStatus;
  paymentStatus: OrderPaymentStatus;
  quotedPrice: number | null;
  priority: WorkflowPriority;
  dueLabel: string;
  progressPercent: number;
  assignedTo?: string | null;
  assignedToName: string | null;
  revisionCount: number;
  proofVersions: ProofVersion[];
  revisions: RevisionRequest[];
  orderRevisions: OrderRevision[];
  events: OrderEvent[];
  files: DeliveryAsset[];
  production: OrderProduction;
  orderFiles: OrderFile[];
  filesUnlocked: boolean;
};
