"use client";

import * as React from "react";
import { Upload, X, FileImage, Loader2, AlertCircle } from "lucide-react";

export type RefFile = {
  fileName: string;
  objectKey: string;
  bucket: string;
  mimeType: string;
  sizeBytes: number;
};

type Props = {
  files: RefFile[];
  onChange: (files: RefFile[]) => void;
  guestEmail?: string;
  maxFiles?: number;
  disabled?: boolean;
};

const ALLOWED = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf", "application/zip", "image/svg+xml",
];

const MAX_MB = 30;

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReferenceFileUploader({
  files,
  onChange,
  guestEmail,
  maxFiles = 10,
  disabled = false,
}: Props) {
  const [uploading, setUploading] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || disabled) return;
    const newErrors: string[] = [];

    const selected = Array.from(fileList).slice(0, maxFiles - files.length);

    for (const file of selected) {
      if (!ALLOWED.includes(file.type)) {
        newErrors.push(`${file.name}: file type not supported`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        newErrors.push(`${file.name}: exceeds ${MAX_MB} MB limit`);
        continue;
      }

      const uploadId = `${file.name}-${Date.now()}`;
      setUploading((p) => [...p, uploadId]);

      try {
        const intentRes = await fetch("/api/upload/reference", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            guestEmail: guestEmail || undefined,
          }),
        });

        const intent = await intentRes.json() as {
          uploadUrl?: string;
          objectKey?: string;
          bucket?: string;
          error?: string;
        };

        if (!intentRes.ok || !intent.uploadUrl) {
          newErrors.push(`${file.name}: ${intent.error ?? "Upload failed"}`);
          continue;
        }

        await fetch(intent.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "content-type": file.type },
        });

        onChange([
          ...files,
          {
            fileName: file.name,
            objectKey: intent.objectKey!,
            bucket: intent.bucket!,
            mimeType: file.type,
            sizeBytes: file.size,
          },
        ]);
      } catch {
        newErrors.push(`${file.name}: Upload failed`);
      } finally {
        setUploading((p) => p.filter((id) => id !== uploadId));
      }
    }

    setErrors(newErrors);
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  const isBusy = uploading.length > 0;
  const canUploadMore = files.length < maxFiles && !disabled;

  return (
    <div className="grid gap-3">
      {/* Drop zone */}
      {canUploadMore && (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-sm text-white/50 transition hover:border-white/25 hover:bg-white/[0.06] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isBusy ? (
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
          <span>
            {isBusy
              ? "Uploading…"
              : "Drop files here or click to upload"}
          </span>
          <span className="text-[11px] text-white/30">
            JPG, PNG, PDF, SVG, ZIP · Max {MAX_MB} MB each · Up to {maxFiles} files
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Errors */}
      {errors.length > 0 && (
        <div className="grid gap-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="grid gap-1.5">
          {files.map((f, i) => (
            <div
              key={f.objectKey}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5"
            >
              <FileImage className="h-4 w-4 shrink-0 text-indigo-400" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{f.fileName}</div>
                <div className="text-xs text-white/40">{formatBytes(f.sizeBytes)}</div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                disabled={disabled}
                className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white/70 disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
