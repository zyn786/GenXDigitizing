import type { WorkflowStatus, QuoteStatus, ProofStatus, OrderRevisionStatus, OrderPaymentStatus } from "@/lib/workflow/types";

export function getWorkflowStatusLabel(status: WorkflowStatus): string {
  switch (status) {
    case "NEW": return "New";
    case "QUOTED": return "Quoted";
    case "SUBMITTED": return "Submitted";
    case "UNDER_REVIEW": return "Under review";
    case "ASSIGNED_TO_DESIGNER": return "Assigned to designer";
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
    case "UNDER_REVIEW": return 20;
    case "ASSIGNED_TO_DESIGNER": return 35;
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

export function getQuoteStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case "NEW": return "Awaiting review";
    case "UNDER_REVIEW": return "Under review";
    case "PRICE_SENT": return "Price sent";
    case "CLIENT_ACCEPTED": return "Accepted";
    case "CLIENT_REJECTED": return "Rejected";
    case "CONVERTED_TO_ORDER": return "Converted to order";
    case "CANCELLED": return "Cancelled";
  }
}

export function getProofStatusLabel(status: ProofStatus): string {
  switch (status) {
    case "NOT_UPLOADED": return "Awaiting proof";
    case "UPLOADED": return "Proof uploaded";
    case "INTERNAL_REVIEW": return "Internal review";
    case "PENDING_ADMIN_PROOF_REVIEW": return "Pending admin review";
    case "PROOF_APPROVED_BY_ADMIN": return "Approved by admin";
    case "PROOF_REJECTED_BY_ADMIN": return "Rejected by admin";
    case "SENT_TO_CLIENT": return "Sent to client";
    case "CLIENT_REVIEWING": return "Client reviewing";
    case "CLIENT_APPROVED": return "Client approved";
    case "REVISION_REQUESTED": return "Revision requested";
  }
}

export function getRevisionStatusLabel(status: OrderRevisionStatus): string {
  switch (status) {
    case "REQUESTED_BY_CLIENT": return "Requested by client";
    case "CREATED_BY_ADMIN": return "Created by admin";
    case "UNDER_ADMIN_REVIEW": return "Under admin review";
    case "ASSIGNED_TO_DESIGNER": return "Assigned to designer";
    case "IN_PROGRESS": return "In progress";
    case "REVISED_PROOF_UPLOADED": return "Revised proof uploaded";
    case "COMPLETED": return "Completed";
    case "CANCELLED": return "Cancelled";
  }
}

export function getPaymentStatusLabel(status: OrderPaymentStatus): string {
  switch (status) {
    case "NOT_REQUIRED": return "Not required";
    case "PAYMENT_PENDING": return "Payment pending";
    case "PAYMENT_SUBMITTED": return "Submitted";
    case "PAYMENT_UNDER_REVIEW": return "Under review";
    case "PAID": return "Paid";
    case "PARTIALLY_PAID": return "Partially paid";
    case "REJECTED": return "Rejected";
    case "REFUNDED": return "Refunded";
  }
}
