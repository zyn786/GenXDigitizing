export type ProofStatus =
  | "NOT_UPLOADED"
  | "UPLOADED"
  | "INTERNAL_REVIEW"
  | "SENT_TO_CLIENT"
  | "CLIENT_REVIEWING"
  | "CLIENT_APPROVED"
  | "REVISION_REQUESTED";

export type DesignProof = {
  id: string;
  versionNumber: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string | null;
  uploadedAt: string;
  sentAt: string | null;
  approvedByClientAt: string | null;
  revisionNote: string | null;
};

export type QuoteStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "PRICE_SENT"
  | "CLIENT_ACCEPTED"
  | "CLIENT_REJECTED"
  | "CONVERTED_TO_ORDER"
  | "CANCELLED";

export type WorkflowStatus =
  | "NEW"
  | "QUOTED"
  | "SUBMITTED"
  | "IN_PROGRESS"
  | "PROOF_READY"
  | "REVISION_REQUESTED"
  | "PAYMENT_PENDING"
  | "APPROVED_WAITING_PAYMENT"
  | "APPROVED"
  | "DELIVERED"
  | "CLOSED"
  | "CANCELLED";

export type WorkflowPriority = "STANDARD" | "URGENT" | "SAME_DAY";
export type RevisionStatus =
  | "REQUESTED_BY_CLIENT"
  | "CREATED_BY_ADMIN"
  | "UNDER_ADMIN_REVIEW"
  | "ASSIGNED_TO_DESIGNER"
  | "IN_PROGRESS"
  | "REVISED_PROOF_UPLOADED"
  | "SENT_TO_CLIENT"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";
export type DeliveryAssetKind = "PROOF" | "FINAL";

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
  revisionNumber: number;
  title: string;
  body: string;
  status: RevisionStatus;
  attachmentUrls: string[];
  adminNotes: string | null;
  designerNotes: string | null;
  assignedDesignerName: string | null;
  createdAt: string;
  requestedAt: string;
  assignedAt: string | null;
  completedAt: string | null;
  approvedAt: string | null;
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
  priority: WorkflowPriority;
  dueLabel: string;
  progressPercent: number;
  assignedTo?: string | null;
  revisionCount: number;
  proofVersions: ProofVersion[];
  revisions: RevisionRequest[];
  events: OrderEvent[];
  files: DeliveryAsset[];
  production: OrderProduction;
  orderFiles: OrderFile[];
  filesUnlocked: boolean;
  proofStatus: ProofStatus | null;
  designProofs: DesignProof[];
  proofFileUrl: string | null;
  proofFileName: string | null;
  proofUploadedById: string | null;
  proofUploadedAt: string | null;
  proofSentById: string | null;
  proofSentAt: string | null;
  proofApprovedByClientAt: string | null;
  clientProofApprovedAt: string | null;
  clientProofApprovedById: string | null;
  approvedQuoteAmount: number | null;
  paymentRequired: boolean;
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID";
  invoiceId: string | null;
};
