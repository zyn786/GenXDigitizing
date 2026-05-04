import { cn } from "@/lib/utils";
import { getWorkflowStatusLabel, getAdminWorkflowStatusTone } from "@/lib/workflow/status";
import type { WorkflowStatus } from "@/lib/workflow/types";

export function OrderStatusBadge({ status }: { status: WorkflowStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        getAdminWorkflowStatusTone(status)
      )}
    >
      {getWorkflowStatusLabel(status)}
    </span>
  );
}
