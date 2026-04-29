export type WorkflowStatus =
  | "NEW"
  | "QUOTED"
  | "SUBMITTED"
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
};
