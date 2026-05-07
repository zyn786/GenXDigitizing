// Mirrors Prisma enum WorkflowOrderStatus in schema.prisma.
// Self-defined to avoid depending on generated Prisma client at module load time.
export type WorkflowOrderStatus =
  | "DRAFT"
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

// ─── Safety model ────────────────────────────────────────────────────────────
//
// Normal transitions are STRICT. Only the transitions listed in
// WORKFLOW_TRANSITIONS are allowed by default.
//
// Admin override (allowAdminOverride: true) unlocks any non-terminal → any
// target transition. This is DANGEROUS and must be passed EXPLICITLY.
// No actor role auto-detection — DESIGNER never receives override.
//
// Rules for call sites:
//   - Client/public routes:        omit allowAdminOverride (defaults false)
//   - Normal workflow routes:      omit allowAdminOverride (defaults false)
//   - Admin assign/unassign:       pass allowAdminOverride: true explicitly
//   - Admin workflow PATCH:        pass allowAdminOverride: true explicitly
//   - Admin revision create/assign: pass allowAdminOverride: true explicitly

export const WORKFLOW_TRANSITIONS: Record<
  WorkflowOrderStatus,
  WorkflowOrderStatus[]
> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["UNDER_REVIEW", "ASSIGNED_TO_DESIGNER", "CANCELLED"],
  UNDER_REVIEW: ["ASSIGNED_TO_DESIGNER", "CANCELLED"],
  ASSIGNED_TO_DESIGNER: ["UNDER_REVIEW", "PROOF_READY", "CANCELLED"],
  IN_PROGRESS: ["UNDER_REVIEW", "PROOF_READY", "CANCELLED"],
  PROOF_READY: ["APPROVED", "REVISION_REQUESTED", "IN_PROGRESS", "CANCELLED"],
  REVISION_REQUESTED: ["IN_PROGRESS", "PROOF_READY", "CANCELLED"],
  APPROVED: ["DELIVERED", "REVISION_REQUESTED", "CANCELLED"],
  DELIVERED: ["CLOSED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

// States reachable via admin override (any non-terminal → target).
// Only active when allowAdminOverride is explicitly true.
const ADMIN_OVERRIDE_TARGETS: WorkflowOrderStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED_TO_DESIGNER",
  "IN_PROGRESS",
  "PROOF_READY",
  "REVISION_REQUESTED",
  "APPROVED",
  "DELIVERED",
  "CLOSED",
  "CANCELLED",
];

const TERMINAL: Set<WorkflowOrderStatus> = new Set(["CLOSED", "CANCELLED"]);

// ─── Types ──────────────────────────────────────────────────────────────────

export type TransitionInput = {
  from: WorkflowOrderStatus;
  to: WorkflowOrderStatus;
  /** For audit/logging only. Does NOT grant override powers. */
  actorRole?: string | null;
  reason?: string;
};

export type TransitionOptions = {
  /** When true, allow any non-terminal → any target transition.
   *  Must be passed EXPLICITLY. No automatic role-based detection.
   *  Default: false. */
  allowAdminOverride?: boolean;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function canTransition(
  from: WorkflowOrderStatus,
  to: WorkflowOrderStatus,
  opts?: TransitionOptions,
): boolean {
  if (from === to) return true;
  if (WORKFLOW_TRANSITIONS[from]?.includes(to)) return true;

  if (opts?.allowAdminOverride) {
    if (!TERMINAL.has(from) && ADMIN_OVERRIDE_TARGETS.includes(to)) return true;
  }

  return false;
}

export function assertCanTransition(
  input: TransitionInput,
  opts?: TransitionOptions,
): void {
  // allowAdminOverride defaults to false. Caller must opt in explicitly.
  // actorRole is not used for detection — see safety model above.
  if (!canTransition(input.from, input.to, opts)) {
    throw new TransitionError(input.from, input.to);
  }
}

// ─── Error ──────────────────────────────────────────────────────────────────

export class TransitionError extends Error {
  public readonly from: string;
  public readonly to: string;

  constructor(from: string, to: string) {
    super(`Invalid status transition from "${from}" to "${to}".`);
    this.name = "TransitionError";
    this.from = from;
    this.to = to;
  }
}

// ─── PROOF_APPROVED_BY_ADMIN note ───────────────────────────────────────────
// ProofStatus.PROOF_APPROVED_BY_ADMIN exists in the Prisma schema but is
// currently unused in the codebase. The approve-proof-admin route moves
// proofStatus directly from PENDING_ADMIN_PROOF_REVIEW → SENT_TO_CLIENT
// without writing PROOF_APPROVED_BY_ADMIN. This enum value is reserved for
// a future intermediate review step if needed.
