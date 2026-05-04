"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getPaymentStatusLabel } from "@/lib/workflow/status";
import type { OrderPaymentStatus } from "@/lib/workflow/types";

const TONE: Record<OrderPaymentStatus, string> = {
  NOT_REQUIRED: "border-border/60 bg-muted/60 text-muted-foreground",
  PAYMENT_PENDING: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PAYMENT_SUBMITTED: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PAYMENT_UNDER_REVIEW: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  PAID: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  PARTIALLY_PAID: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  REJECTED: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-600 dark:text-red-400",
  REFUNDED: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

type PendingProof = {
  id: string;
  amountClaimed: number;
  clientNotes: string | null;
  submittedAt: string;
};

export function AdminPaymentApproval({
  orderId,
  paymentStatus,
  pendingProofs,
  filesUnlocked,
}: {
  orderId: string;
  paymentStatus: OrderPaymentStatus;
  pendingProofs: PendingProof[];
  filesUnlocked: boolean;
}) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handlePaymentAction(action: "approve" | "reject", proofId?: string) {
    if (action === "approve") setApproving(true);
    else setRejecting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          proofSubmissionId: proofId,
          reason: reason || undefined,
        }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setApproving(false);
      setRejecting(false);
    }
  }

  async function handleUnlock() {
    setUnlocking(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/unlock-files`, { method: "POST" });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) setError(json.message ?? "Failed.");
      else router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Payment status</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE[paymentStatus]}`}>
          {getPaymentStatusLabel(paymentStatus)}
        </span>
      </div>

      {filesUnlocked && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
          Files are unlocked and available to the client.
        </div>
      )}

      {pendingProofs.length > 0 && !filesUnlocked && (
        <div className="grid gap-2">
          <div className="text-xs font-medium text-muted-foreground">Pending payment proof</div>
          {pendingProofs.map((proof) => (
            <div key={proof.id} className="rounded-2xl border border-border/80 bg-secondary/40 p-3 grid gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount claimed</span>
                <span className="font-medium">${Number(proof.amountClaimed).toFixed(2)}</span>
              </div>
              {proof.clientNotes && (
                <p className="text-xs text-muted-foreground">{proof.clientNotes}</p>
              )}
              <div className="text-xs text-muted-foreground">
                Submitted: {new Date(proof.submittedAt).toLocaleString()}
              </div>

              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

              <div className="grid gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={approving || rejecting}
                    onClick={() => handlePaymentAction("approve", proof.id)}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-emerald-600 px-3 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {approving ? "Approving…" : "Approve & unlock files"}
                  </button>
                  <button
                    type="button"
                    disabled={approving || rejecting}
                    onClick={() => handlePaymentAction("reject", proof.id)}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10 px-3 text-xs font-medium text-red-600 dark:text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {rejecting ? "Rejecting…" : "Reject"}
                  </button>
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Rejection reason (optional)"
                  className="w-full resize-none rounded-xl border border-border/80 bg-background px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!filesUnlocked && (
        <div className="border-t border-border/60 pt-3">
          <div className="text-xs text-muted-foreground mb-2">Manual override</div>
          {error && !pendingProofs.length && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</p>}
          <button
            type="button"
            disabled={unlocking}
            onClick={handleUnlock}
            className="inline-flex h-9 w-full items-center justify-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card disabled:opacity-50"
          >
            {unlocking ? "Unlocking…" : "Manually unlock files"}
          </button>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Super Admin / Manager only. Bypasses payment verification.
          </p>
        </div>
      )}
    </div>
  );
}
