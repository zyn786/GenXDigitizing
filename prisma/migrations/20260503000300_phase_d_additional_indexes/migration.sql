-- Phase D -- Additional composite indexes on WorkflowOrder for query performance

CREATE INDEX "WorkflowOrder_assignedToUserId_status_idx" ON "WorkflowOrder"("assignedToUserId", "status");
CREATE INDEX "WorkflowOrder_proofStatus_idx" ON "WorkflowOrder"("proofStatus");
CREATE INDEX "WorkflowOrder_paymentStatus_idx" ON "WorkflowOrder"("paymentStatus");
