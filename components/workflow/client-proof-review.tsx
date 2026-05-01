"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, RefreshCw } from "lucide-react";
import type { ProofStatus } from "@/lib/workflow/types";

export function ClientProofReview({
  orderId,
  proofStatus,
  orderStatus,
}: {
  orderId: string;
  proofStatus: ProofStatus;
  orderStatus: string;
}) {
  const router = useRouter();
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [approving, setApproving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAct = orderStatus === "PROOF_READY" && proofStatus === "SENT_TO_CLIENT";

  if (proofStatus === "PENDING_ADMIN_PROOF_REVIEW") {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-sm font-medium text-amber-300">Proof under review</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Our team is reviewing your proof before sending it to you. You'll be notified shortly.
        </p>
      </div>
    );
  }

  if (proofStatus === "CLIENT_APPROVED") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">Proof approved</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          You approved this proof. Payment details are shown below.
        </p>
      </div>
    );
  }

  if (proofStatus === "REVISION_REQUESTED") {
    return (
      <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 px-4 py-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-fuchsia-400" />
          <span className="text-sm font-medium text-fuchsia-300">Revision requested</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Your revision request has been received. We'll notify you when the updated proof is ready.
        </p>
      </div>
    );
  }

  if (!canAct) {
    return (
      <div className="text-sm text-muted-foreground">
        {proofStatus === "NOT_UPLOADED"
          ? "Our team is working on your design. You'll be notified when the proof is ready."
          : proofStatus === "UPLOADED" || proofStatus === "INTERNAL_REVIEW"
          ? "Your proof is being reviewed internally. You'll be notified when it's ready."
          : "No action required at this time."}
      </div>
    );
  }

  async function handleApprove() {
    setApproving(true);
    setError(null);
    try {
      const res = await fetch(`/api/client/orders/${orderId}/approve-proof`, { method: "POST" });
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

  async function handleRequestRevision() {
    if (!revisionNotes.trim() || revisionNotes.trim().length < 5) {
      setError("Please describe what needs to be changed (min 5 characters).");
      return;
    }
    setRequesting(true);
    setError(null);
    try {
      const res = await fetch(`/api/client/orders/${orderId}/request-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientNotes: revisionNotes }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed to submit revision request.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-violet-300">
        Your proof is ready. Please review the files above and approve or request changes.
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!showRevisionForm ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={approving || requesting}
            onClick={handleApprove}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {approving ? "Approving…" : "Approve proof"}
          </button>
          <button
            type="button"
            disabled={approving || requesting}
            onClick={() => setShowRevisionForm(true)}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 text-xs font-medium text-fuchsia-300 transition hover:bg-fuchsia-500/20 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Request revision
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          <textarea
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            rows={3}
            placeholder="Describe what needs to be changed…"
            className="w-full resize-none rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={requesting}
              onClick={handleRequestRevision}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {requesting ? "Submitting…" : "Submit revision"}
            </button>
            <button
              type="button"
              disabled={requesting}
              onClick={() => { setShowRevisionForm(false); setError(null); }}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
