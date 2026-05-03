"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";

import type { ManualPaymentAccountRecord } from "@/lib/payments/types";

type ProofStatus = "PENDING" | "APPROVED" | "REJECTED";

type ExistingProof = {
  id: string;
  status: ProofStatus;
  amountClaimed: number;
  clientNotes: string | null;
  rejectionReason: string | null;
  submittedAt: string;
  paymentAccountName: string | null;
};

export function PaymentProofForm({
  invoiceId,
  invoiceTotal,
  currency,
  paymentAccounts,
  existingProofs,
}: {
  invoiceId: string;
  invoiceTotal: number;
  currency: string;
  paymentAccounts: ManualPaymentAccountRecord[];
  existingProofs: ExistingProof[];
}) {
  const [selectedAccount, setSelectedAccount] = useState<ManualPaymentAccountRecord | null>(
    paymentAccounts.length === 1 ? paymentAccounts[0] : null
  );
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [amountClaimed, setAmountClaimed] = useState(invoiceTotal.toFixed(2));
  const [clientNotes, setClientNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const latestProof = existingProofs[0] ?? null;
  const hasPendingProof = existingProofs.some((p) => p.status === "PENDING");
  const hasApprovedProof = existingProofs.some((p) => p.status === "APPROVED");

  if (hasApprovedProof) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-400">
        Your payment has been approved. Files are now unlocked for download.
      </div>
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!proofFile) {
      setError("Please select a payment proof image.");
      return;
    }

    if (!selectedAccount) {
      setError("Please select a payment method.");
      return;
    }

    const amount = parseFloat(amountClaimed);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    setUploading(true);
    let objectKey = "";
    let bucket = "";

    try {
      const intentRes = await fetch("/api/payment-proof-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: proofFile.name,
          mimeType: proofFile.type,
          sizeBytes: proofFile.size,
        }),
      });
      const intentJson = await intentRes.json() as {
        uploadUrl?: string;
        objectKey?: string;
        bucket?: string;
        error?: string;
      };

      if (!intentJson.uploadUrl || !intentJson.objectKey || !intentJson.bucket) {
        setError(intentJson.error ?? "Failed to get upload URL.");
        setUploading(false);
        return;
      }

      objectKey = intentJson.objectKey;
      bucket = intentJson.bucket;

      const uploadRes = await fetch(intentJson.uploadUrl, {
        method: "PUT",
        body: proofFile,
        headers: { "Content-Type": proofFile.type },
      });

      if (!uploadRes.ok) {
        setError("Failed to upload image. Please try again.");
        setUploading(false);
        return;
      }
    } catch {
      setError("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    setUploading(false);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/client/invoices/${invoiceId}/payment-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentAccountId: selectedAccount.id,
          proofImageKey: objectKey,
          proofImageBucket: bucket,
          amountClaimed: amount,
          clientNotes: clientNotes.trim() || null,
        }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed to submit proof.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-400">
        Payment proof submitted successfully. Our team will review it shortly and unlock your files once approved.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {latestProof?.status === "REJECTED" && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <div className="font-medium">Your previous payment proof was rejected.</div>
          {latestProof.rejectionReason && (
            <div className="mt-1">{latestProof.rejectionReason}</div>
          )}
          <div className="mt-2">Please resubmit with a valid payment screenshot below.</div>
        </div>
      )}

      {hasPendingProof && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-400">
          Your payment proof is currently under review. We&rsquo;ll unlock your files once approved.
        </div>
      )}

      {paymentAccounts.length > 0 && !hasPendingProof && (
        <form onSubmit={handleSubmit} className="grid gap-5">
          {paymentAccounts.length > 1 && (
            <div className="grid gap-3">
              <div className="text-sm font-medium">Choose a payment method</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentAccounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedAccount(account)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedAccount?.id === account.id
                        ? "border-primary bg-primary/10"
                        : "border-border/80 bg-card/70 hover:bg-card"
                    }`}
                  >
                    <div className="font-medium">{account.displayName}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {account.accountName}
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {account.accountId}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedAccount && (
            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <div className="text-sm font-medium">{selectedAccount.displayName}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {selectedAccount.accountName} · <span className="font-mono">{selectedAccount.accountId}</span>
              </div>
              {selectedAccount.instructions && (
                <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {selectedAccount.instructions}
                </div>
              )}
              {selectedAccount.paymentLink && (
                <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <QRCode value={selectedAccount.paymentLink} size={120} />
                    </div>
                    <span className="text-xs text-muted-foreground">Scan to pay</span>
                  </div>
                  <div className="flex flex-col justify-center gap-2">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Or click to pay
                    </div>
                    <a
                      href={selectedAccount.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
                    >
                      Pay via {selectedAccount.displayName} →
                    </a>
                    <div className="break-all text-xs text-muted-foreground/70">
                      {selectedAccount.paymentLink}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <label className="text-sm font-medium">
              Amount paid ({currency}) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amountClaimed}
              onChange={(e) => setAmountClaimed(e.target.value)}
              required
              className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">
              Payment proof screenshot <span className="text-red-400">*</span>
            </label>
            <div
              className="cursor-pointer rounded-2xl border border-dashed border-border/80 p-6 text-center transition hover:border-border"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob URL not compatible with next/image
                <img src={previewUrl} alt="Proof preview" className="mx-auto max-h-48 rounded-xl object-contain" />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Click to select an image (JPG, PNG, WebP — max 20 MB)
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            {proofFile && (
              <div className="text-xs text-muted-foreground">{proofFile.name}</div>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Notes for admin</label>
            <textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Optional — e.g. transaction ID, date of payment, any details to help verify"
              rows={3}
              className="rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || submitting || !selectedAccount}
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? "Uploading image…" : submitting ? "Submitting…" : "Submit payment proof"}
          </button>
        </form>
      )}

      {paymentAccounts.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-secondary/40 px-5 py-4 text-sm text-muted-foreground">
          No payment methods are currently available. Please contact support.
        </div>
      )}
    </div>
  );
}
