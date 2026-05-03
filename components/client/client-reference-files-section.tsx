"use client";

import * as React from "react";
import { FileImage, Plus, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReferenceFileUploader, type RefFile } from "@/components/shared/reference-file-uploader";

type InitialFile = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

type Props = {
  orderId: string;
  initialFiles: InitialFile[];
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClientReferenceFilesSection({ orderId, initialFiles }: Props) {
  const [showUpload, setShowUpload] = React.useState(false);
  const [newFiles, setNewFiles] = React.useState<RefFile[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");

  async function saveFiles() {
    if (newFiles.length === 0) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/client/orders/${orderId}/reference-files`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ files: newFiles }),
      });

      const result = await res.json() as { ok: boolean; message?: string };
      if (!res.ok || !result.ok) {
        setError(result.message ?? "Failed to save files.");
        return;
      }

      setSaved(true);
      setNewFiles([]);
      setShowUpload(false);
      // Reload to show newly saved files
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="rounded-[1.5rem] border-border/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Reference files</CardTitle>
            <CardDescription>
              Files you uploaded with this order.
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={() => setShowUpload((p) => !p)}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/60 px-3 text-xs font-medium transition hover:bg-secondary"
          >
            {showUpload ? (
              <><ChevronUp className="h-3.5 w-3.5" /> Cancel</>
            ) : (
              <><Plus className="h-3.5 w-3.5" /> Add files</>
            )}
          </button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {/* Existing files */}
        {initialFiles.length > 0 ? (
          <div className="grid gap-1.5">
            {initialFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-2xl border border-border/80 bg-secondary/60 px-4 py-2.5 text-sm"
              >
                <FileImage className="h-4 w-4 shrink-0 text-indigo-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{f.fileName}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatBytes(f.sizeBytes)} · {new Date(f.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !showUpload ? (
          <p className="text-sm text-muted-foreground">
            No reference files uploaded. Use &ldquo;Add files&rdquo; to upload artwork or reference images.
          </p>
        ) : null}

        {/* Upload section */}
        {showUpload && (
          <div className="grid gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-4">
            <ReferenceFileUploader
              files={newFiles}
              onChange={setNewFiles}
              maxFiles={10}
              disabled={saving}
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            {saved && (
              <p className="text-sm text-emerald-400">Files saved successfully.</p>
            )}
            {newFiles.length > 0 && (
              <button
                type="button"
                onClick={saveFiles}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving…" : `Save ${newFiles.length} file${newFiles.length > 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
