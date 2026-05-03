"use client";

import { useRef, useState } from "react";

type UploadedFile = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string | null;
  createdAt: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function OrderFileUploader({
  orderId,
  initialFiles,
}: {
  orderId: string;
  initialFiles: UploadedFile[];
}) {
  const [files, setFiles] = useState(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
        }),
      });
      const json = await res.json() as { ok: boolean; file?: UploadedFile; message?: string };
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

  async function handleDownload(fileId: string, fileName: string) {
    try {
      const res = await fetch(`/api/admin/order-files/${fileId}/download`);
      const json = await res.json() as { ok?: boolean; downloadUrl?: string; fileName?: string; error?: string };
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
          {uploading ? progress ?? "Uploading…" : "+ Upload file"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
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
              <div>
                <div className="text-sm font-medium">{file.fileName}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatBytes(file.sizeBytes)} · {new Date(file.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(file.id, file.fileName)}
                className="rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground hover:bg-secondary"
              >
                Download
              </button>
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
