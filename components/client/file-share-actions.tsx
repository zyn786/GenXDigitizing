"use client";

import { useState } from "react";
import { Download, Share2, MessageCircle, Loader2, AlertTriangle } from "lucide-react";

type Props = {
  fileId: string;
  fileName: string;
  mimeType: string;
};

export function FileShareActions({ fileId, fileName, mimeType }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharingWp, setSharingWp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);

  async function fetchFileBlob(): Promise<{ blob: Blob; fileName: string } | null> {
    try {
      const res = await fetch(`/api/client/order-files/${fileId}/download`);
      const json = await res.json() as {
        ok?: boolean;
        downloadUrl?: string;
        fileName?: string;
        error?: string;
      };
      if (!json.downloadUrl) {
        setError(json.error ?? "Download unavailable.");
        return null;
      }
      const blobRes = await fetch(json.downloadUrl);
      const blob = await blobRes.blob();
      return { blob, fileName: json.fileName ?? fileName };
    } catch {
      setError("Failed to fetch file.");
      return null;
    }
  }

  function canShareFiles(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function"
    );
  }

  // ── Download ──

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/client/order-files/${fileId}/download`);
      const json = await res.json() as {
        ok?: boolean;
        downloadUrl?: string;
        fileName?: string;
        error?: string;
      };
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
      setDownloading(false);
    }
  }

  // ── Share (generic) ──

  async function handleShare() {
    setSharing(true);
    setError(null);
    setFallback(null);

    if (!canShareFiles()) {
      setFallback("File sharing is not supported on this browser. Please download the file and attach it manually.");
      setSharing(false);
      return;
    }

    const result = await fetchFileBlob();
    if (!result) {
      setSharing(false);
      return;
    }

    const file = new File([result.blob], result.fileName, {
      type: mimeType || "application/octet-stream",
    });

    if (!navigator.canShare({ files: [file] })) {
      setFallback("File sharing is not supported on this browser. Please download the file and attach it manually.");
      setSharing(false);
      return;
    }

    try {
      await navigator.share({
        files: [file],
        title: result.fileName,
      });
    } catch {
      // user cancelled — not an error
    } finally {
      setSharing(false);
    }
  }

  // ── Share to WhatsApp ──

  async function handleShareWhatsapp() {
    setSharingWp(true);
    setError(null);
    setFallback(null);

    if (!canShareFiles()) {
      setFallback("WhatsApp file sharing is only supported on some mobile browsers. Download the file and attach it in WhatsApp.");
      setSharingWp(false);
      return;
    }

    const result = await fetchFileBlob();
    if (!result) {
      setSharingWp(false);
      return;
    }

    const file = new File([result.blob], result.fileName, {
      type: mimeType || "application/octet-stream",
    });

    if (!navigator.canShare({ files: [file] })) {
      setFallback("WhatsApp file sharing is only supported on some mobile browsers. Download the file and attach it in WhatsApp.");
      setSharingWp(false);
      return;
    }

    try {
      await navigator.share({
        files: [file],
        title: result.fileName,
        text: "Final embroidery file from GenX Digitizing",
      });
    } catch {
      // user cancelled — not an error
    } finally {
      setSharingWp(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Download */}
        <button
          type="button"
          disabled={downloading}
          onClick={handleDownload}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {downloading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Downloading…
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              Download
            </>
          )}
        </button>

        {/* Share */}
        <button
          type="button"
          disabled={sharing}
          onClick={handleShare}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card disabled:opacity-50"
        >
          {sharing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Preparing…
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" />
              Share
            </>
          )}
        </button>

        {/* WhatsApp */}
        <button
          type="button"
          disabled={sharingWp}
          onClick={handleShareWhatsapp}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {sharingWp ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Preparing…
            </>
          ) : (
            <>
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {fallback && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
          {fallback}
        </div>
      )}
    </div>
  );
}
