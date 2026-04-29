import type { WorkflowStatus } from "@/lib/workflow/types";

export function getWorkflowStatusLabel(status: WorkflowStatus): string {
  switch (status) {
    case "NEW": return "New";
    case "QUOTED": return "Quoted";
    case "SUBMITTED": return "Submitted";
    case "IN_PROGRESS": return "In progress";
    case "PROOF_READY": return "Proof ready";
    case "REVISION_REQUESTED": return "Revision requested";
    case "APPROVED": return "Approved";
    case "DELIVERED": return "Delivered";
    case "CLOSED": return "Closed";
    case "CANCELLED": return "Cancelled";
  }
}

export function getWorkflowProgress(status: WorkflowStatus): number {
  switch (status) {
    case "NEW": return 5;
    case "QUOTED": return 10;
    case "SUBMITTED": return 15;
    case "IN_PROGRESS": return 50;
    case "PROOF_READY": return 70;
    case "REVISION_REQUESTED": return 75;
    case "APPROVED": return 90;
    case "DELIVERED": return 100;
    case "CLOSED": return 100;
    case "CANCELLED": return 0;
  }
}

export function canRequestRevision(status: WorkflowStatus): boolean {
  return status === "PROOF_READY";
}

export function canApproveProof(status: WorkflowStatus): boolean {
  return status === "PROOF_READY";
}
