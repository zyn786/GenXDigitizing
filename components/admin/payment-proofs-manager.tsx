"use client";

import { useState } from "react";
import Image from "next/image";

import type { PaymentProofRecord } from "@/lib/payments/types";

type ProofStatus = PaymentProofRecord["status"];

const STATUS_LABELS: Record<ProofStatus, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_COLORS: Record<ProofStatus, string> = {
  PENDING: "text-amber-400 bg-amber-500/10",
  APPROVED: "text-emerald-400 bg-emerald-500/10",
  REJECTED: "text-red-400 bg-red-500/10",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export function PaymentProofsManager({
  initialProofs,
}: {
  initialProofs: PaymentProofRecord[];
}) {
  const [proofs, setProofs] = useState(initialProofs);
  const [viewingProof, setViewingProof] = useState<PaymentProofRecord | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [loadingImageId, setLoadingImageId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ProofStatus | "ALL">("PENDING");

  async function viewImage(proof: PaymentProofRecord) {
    setViewingProof(proof);
    setProofImageUrl(null);
    setLoadingImageId(proof.id);
    try {
      const res = await fetch(`/api/admin/payment-proofs/${proof.id}/image`);
      const json = await res.json() as { ok: boolean; viewUrl?: string };
      if (json.ok && json.viewUrl) setProofImageUrl(json.viewUrl);
    } catch {
      // silently fail - image won't show
    } finally {
      setLoadingImageId(null);
    }
  }

  async function approve(proofId: string) {
    setActingId(proofId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payment-proofs/${proofId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) { setError(json.message ?? "Failed to approve."); return; }
      setProofs((prev) => prev.map((p) => p.id === proofId ? { ...p, status: "APPROVED" as const } : p));
      if (viewingProof?.id === proofId) setViewingProof((v) => v ? { ...v, status: "APPROVED" } : v);
    } catch {
      setError("Network error.");
    } finally {
      setActingId(null);
    }
  }

  async function reject(proofId: string) {
    if (!rejectReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }
    setActingId(proofId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payment-proofs/${proofId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: rejectReason.trim() }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) { setError(json.message ?? "Failed to reject."); return; }
      setProofs((prev) => prev.map((p) => p.id === proofId ? { ...p, status: "REJECTED" as const, rejectionReason: rejectReason.trim() } : p));
      if (viewingProof?.id === proofId) setViewingProof((v) => v ? { ...v, status: "REJECTED", rejectionReason: rejectReason.trim() } : v);
      setRejectingId(null);
      setRejectReason("");
    } catch {
      setError("Network error.");
    } finally {
      setActingId(null);
    }
  }

  const displayed = filterStatus === "ALL" ? proofs : proofs.filter((p) => p.status === filterStatus);
  const pendingCount = proofs.filter((p) => p.status === "PENDING").length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {proofs.length} total · {pendingCount} pending
        </p>
        <div className="flex gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "ALL" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {viewingProof && (
        <div className="grid gap-4 rounded-[2rem] border border-border/80 bg-card/70 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{viewingProof.clientName}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[viewingProof.status]}`}>
                  {STATUS_LABELS[viewingProof.status]}
                </span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Order #{viewingProof.orderNumber} · Invoice {viewingProof.invoiceNumber}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                ${viewingProof.amountClaimed.toFixed(2)} via {viewingProof.paymentAccountName ?? "Unknown"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Submitted {formatDate(viewingProof.submittedAt)}
              </div>
              {viewingProof.clientNotes && (
                <div className="mt-2 rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 text-sm text-muted-foreground">
                  {viewingProof.clientNotes}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setViewingProof(null); setProofImageUrl(null); setRejectingId(null); setRejectReason(""); }}
              className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/40 p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Payment proof image
            </div>
            {loadingImageId === viewingProof.id && (
              <div className="text-sm text-muted-foreground">Loading image…</div>
            )}
            {proofImageUrl ? (
              <div className="relative h-96 w-full">
                <Image
                  src={proofImageUrl}
                  alt="Payment proof"
                  fill
                  className="rounded-xl object-contain"
                  unoptimized
                />
              </div>
            ) : !loadingImageId && (
              <div className="text-sm text-muted-foreground">Image unavailable.</div>
            )}
          </div>

          {viewingProof.status === "PENDING" && (
            <div className="grid gap-3">
              {rejectingId === viewingProof.id ? (
                <div className="grid gap-3">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (required — client will see this)"
                    rows={3}
                    className="rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={actingId === viewingProof.id}
                      onClick={() => reject(viewingProof.id)}
                      className="inline-flex h-10 items-center justify-center rounded-full bg-red-500/10 px-5 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {actingId === viewingProof.id ? "Rejecting…" : "Confirm reject"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRejectingId(null); setRejectReason(""); }}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-border/80 px-5 text-sm text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={actingId === viewingProof.id}
                    onClick={() => approve(viewingProof.id)}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-500/10 px-5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {actingId === viewingProof.id ? "Approving…" : "Approve payment"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectingId(viewingProof.id)}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-red-500/10 px-5 text-sm font-medium text-red-400 hover:bg-red-500/20"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}

          {viewingProof.status === "REJECTED" && viewingProof.rejectionReason && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              Rejection reason: {viewingProof.rejectionReason}
            </div>
          )}
        </div>
      )}

      {displayed.length > 0 ? (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="hidden grid-cols-[1fr_1fr_auto_auto_auto] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
            <div>Client / Invoice</div>
            <div>Amount / Method</div>
            <div>Submitted</div>
            <div>Status</div>
            <div></div>
          </div>
          <div className="divide-y divide-border/80">
            {displayed.map((proof) => (
              <div
                key={proof.id}
                className="grid grid-cols-1 gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-center"
              >
                <div>
                  <div className="font-medium">{proof.clientName}</div>
                  <div className="text-xs text-muted-foreground">
                    #{proof.orderNumber} · {proof.invoiceNumber}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">${proof.amountClaimed.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{proof.paymentAccountName ?? "—"}</div>
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(proof.submittedAt)}</div>
                <div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[proof.status]}`}>
                    {STATUS_LABELS[proof.status]}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => viewImage(proof)}
                    className="rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground hover:bg-secondary"
                  >
                    View
                  </button>
                  {proof.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        disabled={actingId === proof.id}
                        onClick={() => approve(proof.id)}
                        className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {actingId === proof.id ? "…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { viewImage(proof); setRejectingId(proof.id); }}
                        className="rounded-full px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          {filterStatus === "PENDING" ? "No pending payment proofs." : `No ${filterStatus.toLowerCase()} proofs.`}
        </div>
      )}
    </div>
  );
}
