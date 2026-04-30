"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Send, CheckCircle, RotateCcw, Eye, AlertCircle } from "lucide-react";

import type { DesignProof, ProofStatus } from "@/lib/workflow/types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_LABEL: Record<string, string> = {
  NOT_UPLOADED: "Not uploaded",
  UPLOADED: "Uploaded — awaiting review",
  INTERNAL_REVIEW: "Internal review",
  SENT_TO_CLIENT: "Sent to client",
  CLIENT_REVIEWING: "Client reviewing",
  CLIENT_APPROVED: "Client approved",
  REVISION_REQUESTED: "Revision requested",
};

const STATUS_COLOR: Record<string, string> = {
  NOT_UPLOADED: "text-muted-foreground",
  UPLOADED: "text-amber-400",
  INTERNAL_REVIEW: "text-blue-400",
  SENT_TO_CLIENT: "text-violet-400",
  CLIENT_REVIEWING: "text-violet-400",
  CLIENT_APPROVED: "text-emerald-400",
  REVISION_REQUESTED: "text-orange-400",
};

type Props = {
  orderId: string;
  proofStatus: ProofStatus | null;
  proofs: DesignProof[];
  canSend: boolean; // true for SUPER_ADMIN / MANAGER
};

export function ProofPanel({ orderId, proofStatus: initialStatus, proofs: initialProofs, canSend }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofStatus, setProofStatus] = useState(initialStatus);
  const [proofs, setProofs] = useState(initialProofs);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [overriding, setOverriding] = useState(false);

  const latestProof = proofs.length > 0 ? proofs[proofs.length - 1] : null;
  const latestSentProof = [...proofs].reverse().find((p) => p.sentAt != null) ?? null;
  const currentStatus: string = proofStatus ?? "NOT_UPLOADED";

  const showUploadButton =
    currentStatus === "NOT_UPLOADED" ||
    currentStatus === "UPLOADED" ||
    currentStatus === "INTERNAL_REVIEW" ||
    currentStatus === "REVISION_REQUESTED";

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadProgress("Getting upload URL…");

    let objectKey = "";
    let bucket = "";

    try {
      const intentRes = await fetch("/api/admin/proof-upload-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
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
        return;
      }
      objectKey = intentJson.objectKey;
      bucket = intentJson.bucket;

      setUploadProgress("Uploading file…");
      const uploadRes = await fetch(intentJson.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!uploadRes.ok) {
        setError("Upload failed. Please try again.");
        return;
      }
    } catch {
      setError("Upload failed. Please try again.");
      return;
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }

    setUploadProgress("Saving proof record…");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          objectKey,
          bucket,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      });
      const json = await res.json() as { proof?: DesignProof; error?: string };
      if (!json.proof) {
        setError(json.error ?? "Failed to save proof record.");
        return;
      }
      setProofs((prev) => [...prev, json.proof!]);
      setProofStatus("UPLOADED");
    } catch {
      setError("Failed to save proof record.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function sendAction(action: string, extra?: Record<string, string>) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/proof`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...extra }),
        });
        const json = await res.json() as { ok?: boolean; error?: string };
        if (!json.ok) {
          setError(json.error ?? "Action failed.");
          return;
        }
        if (action === "mark_internal_review") setProofStatus("INTERNAL_REVIEW");
        if (action === "send_to_client") setProofStatus("SENT_TO_CLIENT");
        if (action === "override_status" && extra?.proofStatus) {
          setProofStatus(extra.proofStatus as ProofStatus);
          setOverriding(false);
        }
        router.refresh();
      } catch {
        setError("Request failed. Please try again.");
      }
    });
  }

  async function handleDownload(proofId: string, fileName: string) {
    try {
      const res = await fetch(`/api/proofs/${proofId}/download`);
      const json = await res.json() as { downloadUrl?: string; fileName?: string };
      if (!json.downloadUrl) return;
      const a = document.createElement("a");
      a.href = json.downloadUrl;
      a.download = json.fileName ?? fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // silently fail
    }
  }

  return (
    <div className="grid gap-4">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${STATUS_COLOR[currentStatus] ?? "text-muted-foreground"}`}>
          {STATUS_LABEL[currentStatus] ?? currentStatus}
        </span>
        {canSend && (
          <button
            type="button"
            onClick={() => setOverriding((v) => !v)}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            {overriding ? "Cancel override" : "Override status"}
          </button>
        )}
      </div>

      {/* Override panel */}
      {overriding && canSend && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
          <div className="mb-2 text-xs font-medium text-orange-400">Override proof status</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(["NOT_UPLOADED", "UPLOADED", "INTERNAL_REVIEW", "SENT_TO_CLIENT", "CLIENT_REVIEWING", "CLIENT_APPROVED", "REVISION_REQUESTED"] as const).map((s) => (
              <button
                key={s}
                type="button"
                disabled={isPending || s === currentStatus}
                onClick={() => sendAction("override_status", { proofStatus: s })}
                className="rounded-lg border border-border/60 px-2 py-1.5 text-left text-[11px] text-muted-foreground hover:bg-secondary/60 disabled:opacity-40"
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Upload section */}
      {showUploadButton && (
        <div>
          {currentStatus === "REVISION_REQUESTED" && latestSentProof?.revisionNote && (
            <div className="mb-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
              <div className="mb-1 text-xs font-medium text-orange-400">Client revision note</div>
              <p className="text-sm text-muted-foreground">{latestSentProof.revisionNote}</p>
            </div>
          )}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? (uploadProgress ?? "Uploading…") : (currentStatus === "REVISION_REQUESTED" ? "Upload revised proof" : "Upload proof")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.ai,.eps,.svg,.psd"
          />
        </div>
      )}

      {/* Latest proof card */}
      {latestProof && (
        <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs text-muted-foreground">
                v{latestProof.versionNumber} · {formatBytes(latestProof.sizeBytes)}
              </div>
              <div className="mt-0.5 text-sm font-medium">{latestProof.fileName}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Uploaded {new Date(latestProof.uploadedAt).toLocaleDateString()}
                {latestProof.uploadedByName ? ` by ${latestProof.uploadedByName}` : ""}
              </div>
              {latestProof.sentAt && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Sent {new Date(latestProof.sentAt).toLocaleDateString()}
                </div>
              )}
              {latestProof.approvedByClientAt && (
                <div className="mt-0.5 text-xs text-emerald-400">
                  Approved by client {new Date(latestProof.approvedByClientAt).toLocaleDateString()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleDownload(latestProof.id, latestProof.fileName)}
              className="shrink-0 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary/60"
            >
              <Eye className="inline h-3 w-3 mr-1" />
              View
            </button>
          </div>
        </div>
      )}

      {/* Version history */}
      {proofs.length > 1 && (
        <div className="grid gap-1">
          {proofs.slice(0, -1).reverse().map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/20 px-3 py-2"
            >
              <div>
                <span className="text-xs text-muted-foreground">v{p.versionNumber}</span>
                <span className="ml-2 text-xs text-muted-foreground">{p.fileName}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(p.id, p.fileName)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {currentStatus === "UPLOADED" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => sendAction("mark_internal_review")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/80 px-4 text-xs font-medium text-muted-foreground transition hover:bg-secondary disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            Mark for internal review
          </button>
        )}

        {canSend && latestProof && (currentStatus === "UPLOADED" || currentStatus === "INTERNAL_REVIEW") && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => sendAction("send_to_client", { proofId: latestProof.id })}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {isPending ? "Sending…" : "Send to client"}
          </button>
        )}

        {(currentStatus === "SENT_TO_CLIENT" || currentStatus === "CLIENT_REVIEWING") && (
          <div className="flex items-center gap-1.5 text-sm text-violet-400">
            <RotateCcw className="h-4 w-4 animate-spin" style={{ animationDuration: "3s" }} />
            Waiting for client response…
          </div>
        )}

        {currentStatus === "CLIENT_APPROVED" && (
          <div className="flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            Client approved this proof
          </div>
        )}
      </div>
    </div>
  );
}
