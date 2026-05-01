"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getProofStatusLabel } from "@/lib/workflow/status";
import type { ProofStatus } from "@/lib/workflow/types";

const PROOF_TONE: Record<ProofStatus, string> = {
  NOT_UPLOADED: "border-white/10 bg-white/5 text-white/60",
  UPLOADED: "border-blue-400/30 bg-blue-500/10 text-blue-300",
  INTERNAL_REVIEW: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  PENDING_ADMIN_PROOF_REVIEW: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  PROOF_APPROVED_BY_ADMIN: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  PROOF_REJECTED_BY_ADMIN: "border-red-400/30 bg-red-500/10 text-red-300",
  SENT_TO_CLIENT: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  CLIENT_REVIEWING: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  CLIENT_APPROVED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  REVISION_REQUESTED: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300",
};

export function ProofSendPanel({
  orderId,
  proofStatus,
  orderStatus,
  fileCount,
  requiresAdminReview = false,
}: {
  orderId: string;
  proofStatus: ProofStatus;
  orderStatus: string;
  fileCount: number;
  requiresAdminReview?: boolean;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend =
    ["IN_PROGRESS", "REVISION_REQUESTED", "PROOF_REJECTED_BY_ADMIN"].includes(orderStatus) &&
    fileCount > 0 &&
    proofStatus !== "PENDING_ADMIN_PROOF_REVIEW" &&
    proofStatus !== "SENT_TO_CLIENT" &&
    proofStatus !== "CLIENT_REVIEWING";

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/send-proof`, { method: "POST" });
      const json = await res.json() as { ok: boolean; adminReview?: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed to submit proof.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setSending(false);
    }
  }

  const buttonLabel = requiresAdminReview
    ? sending ? "Submitting…" : "Submit proof for admin review"
    : sending ? "Sending…" : "Send proof to client";

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Proof status</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${PROOF_TONE[proofStatus]}`}>
          {getProofStatusLabel(proofStatus)}
        </span>
      </div>

      {proofStatus === "PENDING_ADMIN_PROOF_REVIEW" && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
          Proof is waiting for admin review before being sent to the client.
        </div>
      )}

      {proofStatus === "PROOF_REJECTED_BY_ADMIN" && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          Admin rejected this proof. Upload updated files and resubmit.
        </div>
      )}

      {proofStatus === "CLIENT_APPROVED" && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          Client has approved this proof. Payment is now pending.
        </div>
      )}

      {proofStatus === "REVISION_REQUESTED" && (
        <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 px-4 py-3 text-sm text-fuchsia-300">
          Client requested a revision. Upload updated files and resubmit.
        </div>
      )}

      {proofStatus === "SENT_TO_CLIENT" || proofStatus === "CLIENT_REVIEWING" ? (
        <p className="text-xs text-muted-foreground">Proof has been sent to the client for review.</p>
      ) : null}

      {canSend && proofStatus !== "CLIENT_APPROVED" && (
        <>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="button"
            disabled={sending}
            onClick={handleSend}
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {buttonLabel}
          </button>
          {requiresAdminReview && (
            <p className="text-xs text-muted-foreground">
              Admin review is enabled. Proof will be reviewed before client delivery.
            </p>
          )}
        </>
      )}

      {!canSend &&
        proofStatus !== "CLIENT_APPROVED" &&
        proofStatus !== "REVISION_REQUESTED" &&
        proofStatus !== "PENDING_ADMIN_PROOF_REVIEW" &&
        proofStatus !== "PROOF_REJECTED_BY_ADMIN" &&
        proofStatus !== "SENT_TO_CLIENT" &&
        proofStatus !== "CLIENT_REVIEWING" && (
          <p className="text-xs text-muted-foreground">
            {fileCount === 0
              ? "Upload proof preview images above before submitting."
              : `Order must be in progress or in revision to submit a proof (current: ${orderStatus.toLowerCase()}).`}
          </p>
        )}
    </div>
  );
}
