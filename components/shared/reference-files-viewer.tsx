"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileImage, Download, Trash2, Loader2 } from "lucide-react";

type ReferenceFile = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploaderEmail?: string | null;
  createdAt: string;
};

type Props = {
  files: ReferenceFile[];
  downloadRoute: "admin" | "designer";
  /** When true, shows a delete button on each file row. */
  showDelete?: boolean;
  /** Called after a file is successfully deleted (before router refresh). */
  onDeleted?: (fileId: string) => void;
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function DownloadButton({ fileId, fileName, route }: { fileId: string; fileName: string; route: "admin" | "designer" }) {
  const [loading, setLoading] = React.useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/${route}/reference-files/${fileId}/download`);
      const data = await res.json() as { downloadUrl?: string; error?: string };
      if (data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = fileName;
        a.click();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/60 px-3 text-xs font-medium transition hover:bg-secondary disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      Download
    </button>
  );
}

function DeleteButton({ fileId, route, onDeleted }: { fileId: string; route: "admin" | "designer"; onDeleted?: (fileId: string) => void }) {
  const [deleting, setDeleting] = React.useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this reference file?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/${route}/reference-files/${fileId}`, { method: "DELETE" });
      const json = await res.json() as { ok: boolean };
      if (json.ok) {
        onDeleted?.(fileId);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/5 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
      title="Delete file"
    >
      {deleting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function ReferenceFilesViewer({ files, downloadRoute, showDelete, onDeleted }: Props) {
  if (files.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No reference files uploaded.</p>
    );
  }

  return (
    <div className="grid gap-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 rounded-2xl border border-border/80 bg-secondary/60 px-4 py-3 text-sm"
        >
          <FileImage className="h-4 w-4 shrink-0 text-indigo-400" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{file.fileName}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {formatBytes(file.sizeBytes)}
              {file.uploaderEmail ? ` · ${file.uploaderEmail}` : ""}
              {" · "}{new Date(file.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DownloadButton fileId={file.id} fileName={file.fileName} route={downloadRoute} />
            {showDelete && (
              <DeleteButton
                fileId={file.id}
                route={downloadRoute}
                onDeleted={onDeleted}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
