"use client";

import { useState } from "react";

export function AdminFileDownloadButton({ fileId, fileName }: { fileId: string; fileName: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/order-files/${fileId}/download`);
      const json = await res.json() as { ok?: boolean; downloadUrl?: string; fileName?: string; error?: string };

      if (!json.downloadUrl) {
        setError(json.error ?? "Download unavailable.");
        return;
      }

      const a = document.createElement("a");
      a.href = json.downloadUrl;
      a.download = json.fileName ?? fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setError("Download failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={handleDownload}
        className="rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground hover:bg-secondary disabled:opacity-50"
      >
        {loading ? "Preparing…" : "Download"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
