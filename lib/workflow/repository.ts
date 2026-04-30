import { prisma } from "@/lib/db";
import type { WorkflowOrder, WorkflowStatus, WorkflowPriority } from "@/lib/workflow/types";
import { getWorkflowProgress } from "@/lib/workflow/status";

const SERVICE_LABELS: Record<string, string> = {
  EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
  VECTOR_REDRAW: "Vector Redraw",
  COLOR_SEPARATION: "Color Separation",
  DTF_SCREEN_PRINT: "DTF / Screen Print",
};

const PLACEMENT_LABELS: Record<string, string> = {
  LEFT_CHEST: "Left Chest",
  RIGHT_CHEST: "Right Chest",
  HAT_FRONT: "Hat Front",
  HAT_SIDE: "Hat Side",
  HAT_BACK: "Hat Back",
  LARGE_DESIGN: "Large Design",
  JACKET_BACK: "Jacket Back",
  JACKET_CHEST: "Jacket Chest",
  SLEEVE_LEFT: "Left Sleeve",
  SLEEVE_RIGHT: "Right Sleeve",
  FULL_BACK: "Full Back",
  FULL_FRONT: "Full Front",
  POCKET: "Pocket",
  LEG: "Leg",
  PUFF_LEFT_CHEST: "3D Puff Left Chest",
  PUFF_HAT: "3D Puff Hat",
  PUFF_JACKET_BACK: "3D Puff Jacket Back",
  OTHER: "Other",
};

export function mapDbStatus(s: string): WorkflowStatus {
  return mapStatus(s);
}

function mapStatus(s: string): WorkflowStatus {
  if (s === "SUBMITTED") return "SUBMITTED";
  if (s === "IN_PROGRESS") return "IN_PROGRESS";
  if (s === "PROOF_READY") return "PROOF_READY";
  if (s === "REVISION_REQUESTED") return "REVISION_REQUESTED";
  if (s === "PAYMENT_PENDING") return "PAYMENT_PENDING";
  if (s === "APPROVED_WAITING_PAYMENT") return "APPROVED_WAITING_PAYMENT";
  if (s === "APPROVED") return "APPROVED";
  if (s === "DELIVERED") return "DELIVERED";
  if (s === "CLOSED") return "CLOSED";
  if (s === "CANCELLED") return "CANCELLED";
  return "SUBMITTED";
}

function mapPriority(speed?: string | null): WorkflowPriority {
  if (speed === "RUSH_12_HOUR") return "SAME_DAY";
  if (speed === "RUSH_SAME_DAY") return "URGENT";
  return "STANDARD";
}

function parseDueLabel(dueAt: Date | null): string {
  if (!dueAt) return "No due date";
  const now = Date.now();
  const diff = dueAt.getTime() - now;
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 0) return "Overdue";
  if (hours < 24) return `Due in ${hours}h`;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function parseNotes(notes: string | null): { deliverySpeed?: string } {
  if (!notes) return {};
  try {
    return JSON.parse(notes) as { deliverySpeed?: string };
  } catch {
    return {};
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DB_INCLUDE = {
  clientUser: {
    select: {
      name: true,
      clientProfile: { select: { companyName: true } },
    },
  },
  assignedTo: { select: { name: true } },
  designProofs: {
    include: {
      uploadedBy: { select: { name: true } },
    },
    orderBy: { versionNumber: "asc" as const },
  },
  revisions: {
    include: {
      assignedDesigner: { select: { name: true } },
    },
    orderBy: { revisionNumber: "asc" as const },
  },
  orderFiles: {
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  invoice: {
    select: { id: true, filesUnlocked: true, status: true },
  },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDbOrder(o: any): WorkflowOrder {
  const meta = parseNotes(o.notes as string | null);
  const status = mapStatus(o.status as string);

  return {
    id: o.id as string,
    reference: o.orderNumber as string,
    title: o.title as string,
    serviceLabel: SERVICE_LABELS[o.serviceType as string] ?? (o.serviceType as string).replaceAll("_", " "),
    clientName: (o.clientUser?.name as string | null) ?? "Client",
    companyName: (o.clientUser?.clientProfile?.companyName as string | null) ?? null,
    status,
    priority: mapPriority(meta.deliverySpeed),
    dueLabel: parseDueLabel(o.dueAt as Date | null),
    progressPercent: (o.progressPercent as number) || getWorkflowProgress(status),
    assignedTo: (o.assignedTo?.name as string | null) ?? null,
    revisionCount: o.revisionCount as number,
    proofVersions: ((o.designProofs ?? []) as Array<{
      id: string;
      versionNumber: number;
      fileName: string;
      revisionNote: string | null;
      uploadedAt: Date;
    }>).map((p) => ({
      id: p.id,
      versionLabel: `Version ${p.versionNumber}`,
      note: p.revisionNote ?? p.fileName,
      createdAt: p.uploadedAt.toISOString(),
    })),
    revisions: ((o.revisions ?? []) as Array<{
      id: string;
      revisionNumber: number;
      revisionInstructions: string;
      status: string;
      attachmentUrls: string[];
      adminNotes: string | null;
      designerNotes: string | null;
      assignedDesigner: { name: string | null } | null;
      createdAt: Date;
      requestedAt: Date;
      assignedAt: Date | null;
      completedAt: Date | null;
      approvedAt: Date | null;
    }>).map((r) => ({
      id: r.id,
      revisionNumber: r.revisionNumber,
      title: `Revision #${r.revisionNumber}`,
      body: r.revisionInstructions,
      status: r.status as WorkflowOrder["revisions"][number]["status"],
      attachmentUrls: r.attachmentUrls ?? [],
      adminNotes: r.adminNotes ?? null,
      designerNotes: r.designerNotes ?? null,
      assignedDesignerName: r.assignedDesigner?.name ?? null,
      createdAt: r.createdAt.toISOString(),
      requestedAt: r.requestedAt.toISOString(),
      assignedAt: r.assignedAt?.toISOString() ?? null,
      completedAt: r.completedAt?.toISOString() ?? null,
      approvedAt: r.approvedAt?.toISOString() ?? null,
    })),
    events: [],
    files: [],
    production: {
      placement: o.placement ? (PLACEMENT_LABELS[o.placement as string] ?? o.placement as string) : null,
      designHeightIn: o.designHeightIn != null ? Number(o.designHeightIn) : null,
      designWidthIn: o.designWidthIn != null ? Number(o.designWidthIn) : null,
      fabricType: (o.fabricType as string | null) ?? null,
      is3dPuffJacketBack: (o.is3dPuffJacketBack as boolean) ?? false,
      trims: (o.trims as string | null) ?? null,
      threadBrand: (o.threadBrand as string | null) ?? null,
      colorDetails: (o.colorDetails as string | null) ?? null,
      colorQuantity: (o.colorQuantity as number | null) ?? null,
      fileFormats: (o.fileFormats as string[]) ?? [],
      stitchCount: (o.stitchCount as number | null) ?? null,
      specialInstructions: (o.specialInstructions as string | null) ?? null,
      isFreeDesign: (o.isFreeDesign as boolean) ?? false,
      estimatedPrice: o.estimatedPrice != null ? Number(o.estimatedPrice) : null,
      quantity: (o.quantity as number) ?? 1,
      leadSource: (o.leadSource as string | null) ?? null,
    },
    orderFiles: ((o.orderFiles ?? []) as Array<{
      id: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      uploadedBy: { name: string | null } | null;
      createdAt: Date;
    }>).map((f) => ({
      id: f.id,
      fileName: f.fileName,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      uploadedByName: f.uploadedBy?.name ?? null,
      createdAt: f.createdAt.toISOString(),
    })),
    filesUnlocked: (o.invoice?.filesUnlocked as boolean) ?? false,
    proofStatus: (o.proofStatus as WorkflowOrder["proofStatus"]) ?? null,
    designProofs: ((o.designProofs ?? []) as Array<{
      id: string;
      versionNumber: number;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      uploadedBy: { name: string | null } | null;
      uploadedAt: Date;
      sentAt: Date | null;
      approvedByClientAt: Date | null;
      revisionNote: string | null;
    }>).map((p) => ({
      id: p.id,
      versionNumber: p.versionNumber,
      fileName: p.fileName,
      mimeType: p.mimeType,
      sizeBytes: p.sizeBytes,
      uploadedByName: p.uploadedBy?.name ?? null,
      uploadedAt: p.uploadedAt.toISOString(),
      sentAt: p.sentAt?.toISOString() ?? null,
      approvedByClientAt: p.approvedByClientAt?.toISOString() ?? null,
      revisionNote: p.revisionNote ?? null,
    })),
    proofFileUrl: (o.proofFileUrl as string | null) ?? null,
    proofFileName: (o.proofFileName as string | null) ?? null,
    proofUploadedById: (o.proofUploadedById as string | null) ?? null,
    proofUploadedAt: (o.proofUploadedAt as Date | null)?.toISOString() ?? null,
    proofSentById: (o.proofSentById as string | null) ?? null,
    proofSentAt: (o.proofSentAt as Date | null)?.toISOString() ?? null,
    proofApprovedByClientAt: (o.proofApprovedByClientAt as Date | null)?.toISOString() ?? null,
    clientProofApprovedAt: (o.clientProofApprovedAt as Date | null)?.toISOString() ?? null,
    clientProofApprovedById: (o.clientProofApprovedById as string | null) ?? null,
    approvedQuoteAmount: o.approvedQuoteAmount != null ? Number(o.approvedQuoteAmount) : null,
    paymentRequired: (o.paymentRequired as boolean) ?? false,
    paymentStatus: (o.paymentStatus as WorkflowOrder["paymentStatus"]) ?? "NOT_REQUIRED",
    invoiceId: (o.invoice?.id as string | null) ?? null,
  };
}

export async function getClientOrders(userId: string): Promise<WorkflowOrder[]> {
  const rows = await prisma.workflowOrder.findMany({
    where: {
      clientUserId: userId,
      status: { notIn: ["DRAFT"] },
    },
    include: DB_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(normalizeDbOrder);
}

export async function getClientOrder(
  orderId: string,
  userId: string
): Promise<WorkflowOrder | null> {
  const row = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: userId },
    include: DB_INCLUDE,
  });
  return row ? normalizeDbOrder(row) : null;
}

export async function getAdminOrders(): Promise<WorkflowOrder[]> {
  const rows = await prisma.workflowOrder.findMany({
    where: { status: { notIn: ["DRAFT"] } },
    include: DB_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(normalizeDbOrder);
}

export async function getAdminOrder(orderId: string): Promise<WorkflowOrder | null> {
  const row = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    include: DB_INCLUDE,
  });
  return row ? normalizeDbOrder(row) : null;
}

export async function getClientFiles(): Promise<[]> {
  return [];
}

export async function getOpenRevisions(): Promise<[]> {
  return [];
}
