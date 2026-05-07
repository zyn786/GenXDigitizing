"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import {
  WORKFLOW_TRANSITIONS,
  type WorkflowOrderStatus,
} from "@/lib/workflow/transitions";
import { getAdminWorkflowStatusTone } from "@/lib/workflow/status";

// ─── Labels ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<WorkflowOrderStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ASSIGNED_TO_DESIGNER: "Assigned to Designer",
  IN_PROGRESS: "In Progress",
  PROOF_READY: "Proof Ready",
  REVISION_REQUESTED: "Revision Requested",
  APPROVED: "Approved",
  DELIVERED: "Delivered",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

// ─── Destructive transitions (require confirmation) ─────────────────────────

const NEEDS_CONFIRMATION = new Set<WorkflowOrderStatus>([
  "CANCELLED",
  "DELIVERED",
  "CLOSED",
  "APPROVED",
]);

// ─── Designer-safe targets ──────────────────────────────────────────────────

const DESIGNER_TARGETS: WorkflowOrderStatus[] = [
  "ASSIGNED_TO_DESIGNER",
  "IN_PROGRESS",
  "PROOF_READY",
];

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  orderId: string;
  currentStatus: string;
  /** The viewer's role. If "DESIGNER", options are restricted. */
  userRole: string;
  /** Title shown above the dropdown. */
  title?: string;
  /** Description shown above the dropdown. */
  description?: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function OrderStatusDropdown({
  orderId,
  currentStatus,
  userRole,
  title = "Update Order Status",
  description = "Move this order through the production workflow.",
}: Props) {
  const router = useRouter();
  const isDesigner = userRole === "DESIGNER";
  const current = (currentStatus as WorkflowOrderStatus) ?? "SUBMITTED";

  const [selected, setSelected] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate available targets from the transition map, filtering for role.
  const options = useMemo(() => {
    const raw = WORKFLOW_TRANSITIONS[current] ?? [];
    const filtered = isDesigner
      ? raw.filter((t) => DESIGNER_TARGETS.includes(t))
      : raw;

    // Both roles can set CANCELLED via this endpoint.
    // Designer gets it only if their filtered list already includes it.
    // Admin always gets CANCELLED from the map.

    return filtered;
  }, [current, isDesigner]);

  const toneClass = getAdminWorkflowStatusTone(current);

  async function handleUpdate() {
    if (!selected) return;
    const target = selected as WorkflowOrderStatus;

    // Confirmation gate
    if (NEEDS_CONFIRMATION.has(target) && !confirming) {
      setConfirming(true);
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/workflow/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Status update failed. This transition is not allowed from the current state.");
      } else {
        setSuccess(true);
        setSelected("");
        setConfirming(false);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSelectChange(value: string) {
    setSelected(value);
    setConfirming(false);
    setError(null);
    setSuccess(false);
  }

  if (options.length === 0) {
    return (
      <div className="grid gap-2">
        <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-sm font-medium ${toneClass}`}>
          {STATUS_LABEL[current] ?? current}
        </span>
        <p className="text-xs text-muted-foreground">
          No further status changes available.
        </p>
      </div>
    );
  }

  const needsConfirm = selected ? NEEDS_CONFIRMATION.has(selected as WorkflowOrderStatus) : false;

  return (
    <div className="grid gap-3">
      {/* Current status badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Current:</span>
        <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium ${toneClass}`}>
          {STATUS_LABEL[current] ?? current}
        </span>
      </div>

      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <p className="text-xs text-muted-foreground -mt-1">
        {isDesigner
          ? "Update only the production status for your assigned job."
          : description}
      </p>
      <p className="text-[11px] text-muted-foreground/70">
        Only valid workflow transitions are available.
      </p>

      {/* Select + button */}
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => handleSelectChange(e.target.value)}
          disabled={saving}
          className="h-9 flex-1 rounded-full border border-border/80 bg-background px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        >
          <option value="">Select new status…</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {STATUS_LABEL[opt]}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!selected || saving}
          onClick={handleUpdate}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-5 text-xs font-medium transition disabled:opacity-50 ${
            confirming && needsConfirm
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : confirming && needsConfirm ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              Confirm {STATUS_LABEL[selected as WorkflowOrderStatus]}
            </>
          ) : (
            "Update"
          )}
        </button>
      </div>

      {/* Cancel confirmation */}
      {confirming && needsConfirm && (
        <button
          type="button"
          onClick={() => { setConfirming(false); setSelected(""); }}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Cancel
        </button>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Status updated successfully.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
