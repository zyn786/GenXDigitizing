"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { ProofStatus } from "@/lib/workflow/types";
import { getProofStatusLabel } from "@/lib/workflow/status";

const PROOF_TONE: Record<string, string> = {
  PENDING_ADMIN_PROOF_REVIEW: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PROOF_APPROVED_BY_ADMIN: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  PROOF_REJECTED_BY_ADMIN: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-600 dark:text-red-400",
  SENT_TO_CLIENT: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

export function AdminProofReviewPanel({
  orderId,
  proofStatus,
  proofReviewNote,
}: {
  orderId: string;
  proofStatus: ProofStatus;
  proofReviewNote?: string | null;
}) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (proofStatus !== "PENDING_ADMIN_PROOF_REVIEW" && proofStatus !== "PROOF_REJECTED_BY_ADMIN" && proofStatus !== "PROOF_APPROVED_BY_ADMIN") {
    return null;
  }

  const tone = PROOF_TONE[proofStatus] ?? "border-border/80 bg-secondary/60 text-foreground";

  async function handleApprove() {
    setApproving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve-proof-admin`, { method: "POST" });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed to approve proof.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!rejectNote.trim() || rejectNote.trim().length < 5) {
      setError("Feedback must be at least 5 characters.");
      return;
    }
    setRejecting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reject-proof-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: rejectNote }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed to reject proof.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Admin review status</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}>
          {getProofStatusLabel(proofStatus)}
        </span>
      </div>

      {proofStatus === "PROOF_REJECTED_BY_ADMIN" && proofReviewNote && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
          <div className="mb-1 flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            Rejected with feedback
          </div>
          <p className="text-xs text-muted-foreground">{proofReviewNote}</p>
        </div>
      )}

      {proofStatus === "PROOF_APPROVED_BY_ADMIN" && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          Proof approved and sent to client.
        </div>
      )}

      {proofStatus === "PENDING_ADMIN_PROOF_REVIEW" && (
        <>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm">
            <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Proof awaiting your review
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Review the proof preview images above, then approve to send to the client or reject with feedback for the designer.
            </p>
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          {!showRejectForm ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={approving || rejecting}
                onClick={handleApprove}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {approving ? "Approving…" : "Approve & send to client"}
              </button>
              <button
                type="button"
                disabled={approving || rejecting}
                onClick={() => setShowRejectForm(true)}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-4 text-xs font-medium text-red-600 dark:text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject with feedback
              </button>
            </div>
          ) : (
            <div className="grid gap-2">
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                placeholder="Describe what needs to be changed before sending to the client…"
                className="w-full resize-none rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={rejecting}
                  onClick={handleReject}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-red-600 px-4 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {rejecting ? "Rejecting…" : "Send rejection feedback"}
                </button>
                <button
                  type="button"
                  disabled={rejecting}
                  onClick={() => { setShowRejectForm(false); setError(null); }}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
