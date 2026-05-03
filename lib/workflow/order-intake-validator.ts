import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { writeNotificationLog } from "@/lib/notifications/email";
import { WorkflowOrderStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderIntakeValidationResult = {
  isComplete: boolean;
  missingFields: string[];
  adminChecklist: { field: string; present: boolean }[];
  clientMessage: string;
  recommendedStatus: WorkflowOrderStatus;
};

// ─── Field definitions ────────────────────────────────────────────────────────

type OrderFieldCheck = {
  field: string;
  check: (order: {
    placement: string | null;
    designHeightIn: number | null;
    designWidthIn: number | null;
    fabricType: string | null;
    is3dPuffJacketBack: boolean;
    trims: string | null;
    colorQuantity: number | null;
    fileFormats: string[];
    specialInstructions: string | null;
    notes: string | null;
  }) => boolean;
};

const FIELD_CHECKS: OrderFieldCheck[] = [
  {
    field: "Reference image",
    check: () => true, // resolved dynamically via ClientReferenceFile count + notes
  },
  {
    field: "Height",
    check: (o) => o.designHeightIn !== null && o.designHeightIn > 0,
  },
  {
    field: "Width",
    check: (o) => o.designWidthIn !== null && o.designWidthIn > 0,
  },
  {
    field: "Placement",
    check: (o) => o.placement !== null && o.placement !== "",
  },
  {
    field: "Fabric type",
    check: (o) => o.fabricType !== null && o.fabricType !== "",
  },
  {
    field: "3D puff",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    check: (_o) => true, // is3dPuffJacketBack has @default(false), always present
  },
  {
    field: "Trims",
    check: (o) => o.trims !== null && o.trims !== "",
  },
  {
    field: "Color quantity",
    check: (o) => o.colorQuantity !== null && o.colorQuantity > 0,
  },
  {
    field: "Output format",
    check: (o) => o.fileFormats.length > 0,
  },
  {
    field: "Special instructions",
    check: (o) => o.specialInstructions !== null && o.specialInstructions !== "",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateClientMessage(missing: string[]): string {
  if (missing.length === 0) {
    return "Your order has all the required details and is ready for our team to review.";
  }
  const list = missing.map((f) => f.toLowerCase()).join(", ");
  return `Your order needs additional details before it can move forward. Please provide the following: ${list}.`;
}

function parseNotesJson(
  notes: string | null
): Record<string, unknown> | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function hasReferenceInNotes(notes: string | null): boolean {
  const parsed = parseNotesJson(notes);
  if (!parsed) return false;
  const refKey = parsed["referenceImageKey"];
  return typeof refKey === "string" && refKey.length > 0;
}

// ─── Core validation ─────────────────────────────────────────────────────────

export async function validateOrderIntake(
  orderId: string
): Promise<OrderIntakeValidationResult> {
  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    select: {
      placement: true,
      designHeightIn: true,
      designWidthIn: true,
      fabricType: true,
      is3dPuffJacketBack: true,
      trims: true,
      colorQuantity: true,
      fileFormats: true,
      specialInstructions: true,
      notes: true,
      _count: {
        select: { clientReferenceFiles: true },
      },
    },
  });

  if (!order) {
    return {
      isComplete: false,
      missingFields: [],
      adminChecklist: [],
      clientMessage: "Order not found.",
      recommendedStatus: "DRAFT",
    };
  }

  const orderData = {
    placement: order.placement as string | null,
    designHeightIn: order.designHeightIn ? Number(order.designHeightIn) : null,
    designWidthIn: order.designWidthIn ? Number(order.designWidthIn) : null,
    fabricType: order.fabricType,
    is3dPuffJacketBack: order.is3dPuffJacketBack,
    trims: order.trims,
    colorQuantity: order.colorQuantity,
    fileFormats: order.fileFormats,
    specialInstructions: order.specialInstructions,
    notes: order.notes,
  };

  const hasReferenceImage =
    order._count.clientReferenceFiles > 0 || hasReferenceInNotes(order.notes);

  const adminChecklist = FIELD_CHECKS.map((fc) => {
    const present = fc.field === "Reference image" ? hasReferenceImage : fc.check(orderData);
    return { field: fc.field, present };
  });

  const missingFields = adminChecklist
    .filter((entry) => !entry.present)
    .map((entry) => entry.field);

  const isComplete = missingFields.length === 0;
  const clientMessage = generateClientMessage(missingFields);
  const recommendedStatus: WorkflowOrderStatus = isComplete ? "SUBMITTED" : "DRAFT";

  return {
    isComplete,
    missingFields,
    adminChecklist,
    clientMessage,
    recommendedStatus,
  };
}

// ─── Apply validation to order ────────────────────────────────────────────────

export async function applyOrderIntakeValidation(params: {
  orderId: string;
  /** Optional actor for activity log. If omitted, system-level log is written. */
  actor?: { id: string; email?: string; role?: string } | null;
}): Promise<OrderIntakeValidationResult> {
  const { orderId, actor } = params;

  const validation = await validateOrderIntake(orderId);

  // Fetch current status
  const current = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    select: { status: true, notes: true, orderNumber: true },
  });

  if (!current) return validation;

  const needsStatusUpdate = current.status !== validation.recommendedStatus;
  if (needsStatusUpdate) {
    await prisma.workflowOrder.update({
      where: { id: orderId },
      data: {
        status: validation.recommendedStatus,
        progressPercent: validation.recommendedStatus === "DRAFT" ? 0 : 15,
      },
    });
  }

  // Store intake validation data into the notes JSON field when compatible
  const existingNotes = parseNotesJson(current.notes);
  if (existingNotes !== null || current.notes === null) {
    const base = existingNotes ?? {};
    const intakeNote = {
      intakeValidation: {
        validatedAt: new Date().toISOString(),
        isComplete: validation.isComplete,
        missingFields: validation.missingFields,
      },
    };

    const mergedNotes =
      current.notes === null
        ? JSON.stringify(intakeNote)
        : JSON.stringify({ ...base, ...intakeNote });

    await prisma.workflowOrder.update({
      where: { id: orderId },
      data: { notes: mergedNotes },
    });
  }

  // Activity log entry
  const logAction = validation.isComplete
    ? "order.intake_complete"
    : "order.intake_incomplete";

  const actorUserId = actor?.id ?? null;
  const actorEmail = actor?.email ?? undefined;
  const actorRole = actor?.role ?? undefined;

  await logActivity({
    actor: actor
      ? { id: actorUserId, email: actorEmail, role: actorRole }
      : null,
    action: logAction,
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: {
      isComplete: validation.isComplete,
      missingFields: validation.missingFields,
      recommendedStatus: validation.recommendedStatus,
    },
  });

  // Notification log entry (non-fatal) — only when intake is incomplete and status changed
  if (!validation.isComplete && needsStatusUpdate) {
    await writeNotificationLog({
      eventType: "ORDER_CREATED",
      audience: "OPS_QUEUE",
      channel: "EMAIL",
      orderId,
      status: "PENDING",
    }).catch(() => {
      // non-fatal
    });
  }

  return validation;
}
