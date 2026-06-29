"use client";

import { useState, useRef, useCallback } from "react";

export interface UploadFile {
  id: string;
  file: File;
  preview?: string; // object URL for images
}

export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export interface UseUploadOptions {
  /** Max file size in bytes (default 50MB) */
  maxSize?: number;
  /** Max number of files (default 10) */
  maxFiles?: number;
  /** Accepted MIME types / extensions for the input */
  accept?: string;
  /** Auto-generate preview object URLs for image files */
  generatePreviews?: boolean;
}

export function useUpload(opts: UseUploadOptions = {}) {
  const {
    maxSize = 50 * 1024 * 1024,
    maxFiles = 10,
    accept = "image/*,.pdf,.ai,.eps,.svg,.dst,.png,.jpg,.jpeg,.webp",
    generatePreviews = true,
  } = opts;

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Revoke all preview object URLs on unmount
  const revokeAll = useCallback(() => {
    for (const f of files) {
      if (f.preview) URL.revokeObjectURL(f.preview);
    }
  }, [files]);

  /** Generate unique ID for file dedup */
  function fileFingerprint(f: File): string {
    return `${f.name}::${f.size}::${f.lastModified}`;
  }

  /** Add files with validation, dedup, and preview generation */
  const addFiles = useCallback(
    (incoming: FileList | File[]): { added: UploadFile[]; errors: string[] } => {
      const arr = Array.from(incoming);
      const errors: string[] = [];
      const added: UploadFile[] = [];
      const existingPrints = new Set(files.map((f) => fileFingerprint(f.file)));

      for (const f of arr) {
        // Size validation
        if (f.size > maxSize) {
          errors.push(`${f.name} exceeds ${formatSize(maxSize)} limit`);
          continue;
        }
        // Duplicate detection
        const fp = fileFingerprint(f);
        if (existingPrints.has(fp)) {
          errors.push(`${f.name} already added`);
          continue;
        }
        existingPrints.add(fp);

        const entry: UploadFile = {
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file: f,
        };

        // Generate preview for images
        if (generatePreviews && f.type.startsWith("image/")) {
          entry.preview = URL.createObjectURL(f);
        }

        added.push(entry);
      }

      setFiles((prev) => {
        const combined = [...prev, ...added];
        return combined.slice(0, maxFiles);
      });

      if (added.length > maxFiles) {
        errors.push(`Max ${maxFiles} files allowed; only first ${maxFiles} kept`);
      }

      return { added: added.slice(0, maxFiles), errors };
    },
    [files, maxSize, maxFiles, generatePreviews]
  );

  /** Remove single file */
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const found = prev.find((f) => f.id === id);
      if (found?.preview) URL.revokeObjectURL(found.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  /** Clear all files */
  const clearFiles = useCallback(() => {
    revokeAll();
    setFiles([]);
    setError(null);
  }, [revokeAll]);

  /** Upload files to an endpoint with progress tracking & abort support */
  const upload = useCallback(
    async (
      url: string,
      extraFormData?: Record<string, string>,
      fileFieldName: string = "files"
    ): Promise<{ ok: boolean; data?: any; error?: string }> => {
      if (files.length === 0) {
        setError("No files to upload");
        return { ok: false, error: "No files to upload" };
      }

      setUploading(true);
      setProgress({ percent: 0, loaded: 0, total: 0 });
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const fd = new FormData();
        if (extraFormData) {
          for (const [k, v] of Object.entries(extraFormData)) {
            fd.append(k, v);
          }
        }
        for (const f of files) {
          fd.append(fileFieldName, f.file);
        }

        // Use XMLHttpRequest for progress tracking
        const result = await new Promise<{ ok: boolean; data?: any; error?: string }>(
          (resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);

            // Abort handling
            const onAbort = () => {
              xhr.abort();
              resolve({ ok: false, error: "Upload cancelled" });
            };
            controller.signal.addEventListener("abort", onAbort, { once: true });

            // Progress
            xhr.upload.addEventListener("progress", (e) => {
              if (e.lengthComputable) {
                setProgress({ percent: Math.round((e.loaded / e.total) * 100), loaded: e.loaded, total: e.total });
              }
            });

            xhr.addEventListener("load", () => {
              controller.signal.removeEventListener("abort", onAbort);
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  resolve({ ok: true, data: JSON.parse(xhr.responseText) });
                } catch {
                  resolve({ ok: true, data: xhr.responseText });
                }
              } else {
                let msg = `Upload failed (${xhr.status})`;
                try {
                  const e = JSON.parse(xhr.responseText);
                  msg = e.error || e.message || msg;
                } catch {}
                resolve({ ok: false, error: msg });
              }
            });

            xhr.addEventListener("error", () => {
              controller.signal.removeEventListener("abort", onAbort);
              resolve({ ok: false, error: "Network error — check your connection" });
            });

            xhr.addEventListener("abort", () => {
              controller.signal.removeEventListener("abort", onAbort);
              resolve({ ok: false, error: "Upload cancelled" });
            });

            xhr.send(fd);
          }
        );

        return result;
      } catch (err: any) {
        if (err?.name === "AbortError") {
          return { ok: false, error: "Upload cancelled" };
        }
        return { ok: false, error: err?.message || "Upload failed" };
      } finally {
        setUploading(false);
        abortRef.current = null;
      }
    },
    [files]
  );

  /** Cancel ongoing upload */
  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** Reset everything */
  const reset = useCallback(() => {
    revokeAll();
    setFiles([]);
    setProgress(null);
    setUploading(false);
    setError(null);
    abortRef.current?.abort();
  }, [revokeAll]);

  return {
    files,
    setFiles,
    addFiles,
    removeFile,
    clearFiles,
    upload,
    cancelUpload,
    reset,
    progress,
    uploading,
    error,
    setError,
    fileCount: files.length,
    hasFiles: files.length > 0,
  };
}

export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export type UseUploadReturn = ReturnType<typeof useUpload>;
