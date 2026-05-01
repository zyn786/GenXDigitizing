import { cn } from "@/lib/utils";
import { getWorkflowStatusLabel } from "@/lib/workflow/status";
import type { WorkflowStatus } from "@/lib/workflow/types";

const toneMap: Record<WorkflowStatus, string> = {
  NEW: "bg-white/10 text-white/75 border-white/10",
  QUOTED: "bg-sky-500/10 text-sky-200 border-sky-400/20",
  SUBMITTED: "bg-blue-500/10 text-blue-200 border-blue-400/20",
  UNDER_REVIEW: "bg-sky-500/10 text-sky-200 border-sky-400/20",
  ASSIGNED_TO_DESIGNER: "bg-indigo-500/10 text-indigo-200 border-indigo-400/20",
  IN_PROGRESS: "bg-amber-500/10 text-amber-200 border-amber-400/20",
  PROOF_READY: "bg-violet-500/10 text-violet-200 border-violet-400/20",
  REVISION_REQUESTED: "bg-fuchsia-500/10 text-fuchsia-200 border-fuchsia-400/20",
  APPROVED: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20",
  DELIVERED: "bg-teal-500/10 text-teal-200 border-teal-400/20",
  CLOSED: "bg-teal-500/10 text-teal-200 border-teal-400/20",
  CANCELLED: "bg-red-500/10 text-red-300 border-red-400/20",
};

export function OrderStatusBadge({ status }: { status: WorkflowStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        toneMap[status]
      )}
    >
      {getWorkflowStatusLabel(status)}
    </span>
  );
}
