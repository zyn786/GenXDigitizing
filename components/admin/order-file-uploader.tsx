"use client";

import { useRef, useState } from "react";
import { Eye, Lock, Trash2 } from "lucide-react";

type UploadedFile = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string | null;
  createdAt: string;
};

type FileType = "PROOF_PREVIEW" | "FINAL_FILE";

const PROOF_ACCEPT = ".jpg,.jpeg,.png,.pdf";
const FINAL_ACCEPT = ".dst,.pes,.emb,.exp,.jef,.vp3,.xxx,.hus,.sew,.dxt,.zip,.pdf";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function OrderFileUploader({
  orderId,
  initialFiles,
  defaultFileType,
}: {
  orderId: string;
  initialFiles: UploadedFile[];
  defaultFileType?: FileType;
}) {
  const [files, setFiles] = useState(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<FileType>(
    defaultFileType ?? "FINAL_FILE"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileTypeAtUpload: FileType = selectedFileType;

    setUploading(true);
    setError(null);
    setProgress("Getting upload URL…");

    let objectKey = "";
    let bucket = "";

    try {
      const intentRes = await fetch("/api/admin/order-files-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          fileType: fileTypeAtUpload,
          orderId,
        }),
      });
      const intentJson = (await intentRes.json()) as {
        uploadUrl?: string;
        objectKey?: string;
        bucket?: string;
        error?: string;
      };

      if (!intentJson.uploadUrl || !intentJson.objectKey || !intentJson.bucket) {
        setError(intentJson.error ?? "Failed to get upload URL.");
        setUploading(false);
        setProgress(null);
        return;
      }

      objectKey = intentJson.objectKey;
      bucket = intentJson.bucket;

      setProgress("Uploading file…");
      const uploadRes = await fetch(intentJson.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!uploadRes.ok) {
        setError("Upload failed. Please try again.");
        setUploading(false);
        setProgress(null);
        return;
      }
    } catch {
      setError("Upload failed. Please try again.");
      setUploading(false);
      setProgress(null);
      return;
    }

    setProgress("Saving record…");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          objectKey,
          bucket,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          fileType: fileTypeAtUpload,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        file?: UploadedFile;
        message?: string;
      };
      if (!json.ok || !json.file) {
        setError(json.message ?? "Failed to save file record.");
        return;
      }
      setFiles((prev) => [...prev, json.file!]);
    } catch {
      setError("Failed to save file record.");
    } finally {
      setUploading(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(fileId: string) {
    try {
      const res = await fetch(`/api/admin/order-files/${fileId}`, { method: "DELETE" });
      const json = await res.json() as { ok: boolean };
      if (json.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch {
      // silently fail
    }
  }

  async function handleDownload(fileId: string, fileName: string) {
    try {
      const res = await fetch(`/api/admin/order-files/${fileId}/download`);
      const json = (await res.json()) as {
        ok?: boolean;
        downloadUrl?: string;
        fileName?: string;
        error?: string;
      };
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

  const acceptAttr =
    selectedFileType === "PROOF_PREVIEW" ? PROOF_ACCEPT : FINAL_ACCEPT;

  const isProofSelected = selectedFileType === "PROOF_PREVIEW";
  const isFinalSelected = selectedFileType === "FINAL_FILE";

  return (
    <div className="grid gap-4">
      {/* File type selector */}
      <div className="grid gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          File type
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => setSelectedFileType("PROOF_PREVIEW")}
            aria-pressed={isProofSelected}
            className={`flex items-start gap-3 rounded-2xl border bg-card/60 p-4 text-left transition disabled:opacity-50 ${
              isProofSelected
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-border/60 hover:border-border hover:bg-card"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isProofSelected
                  ? "bg-emerald-500/20 text-emerald-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Eye className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Proof Preview</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                JPG/PNG files the client will see before approval.
              </p>
              {isProofSelected && (
                <p className="mt-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Proof previews are visible to the client after proof is sent.
                </p>
              )}
            </div>
          </button>

          <button
            type="button"
            disabled={uploading}
            onClick={() => setSelectedFileType("FINAL_FILE")}
            aria-pressed={isFinalSelected}
            className={`flex items-start gap-3 rounded-2xl border bg-card/60 p-4 text-left transition disabled:opacity-50 ${
              isFinalSelected
                ? "border-violet-500/50 bg-violet-500/10"
                : "border-border/60 hover:border-border hover:bg-card"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isFinalSelected
                  ? "bg-violet-500/20 text-violet-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Lock className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Final Production File</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                DST/PES/EMB/ZIP files locked until payment or free-order release.
              </p>
              {isFinalSelected && (
                <p className="mt-2 text-[11px] font-medium text-violet-600 dark:text-violet-400">
                  Machine files stay locked from the client until payment or admin release.
                </p>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {files.length} file{files.length !== 1 ? "s" : ""} uploaded
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {uploading
            ? progress ?? "Uploading…"
            : isProofSelected
              ? "+ Upload proof preview"
              : "+ Upload final file"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttr}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
        Files uploaded here are locked until the client&rsquo;s invoice payment is approved.
        The client cannot download them until an admin approves their payment proof.
      </div>

      {files.length > 0 ? (
        <div className="grid gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{file.fileName}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatBytes(file.sizeBytes)} · {new Date(file.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDownload(file.id, file.fileName)}
                  className="rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground hover:bg-secondary"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(file.id)}
                  className="rounded-full px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                  title="Delete file"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No files uploaded yet. Click &ldquo;Upload file&rdquo; to add completed work.
        </div>
      )}
    </div>
  );
}
