"use client";

/**
 * Shared helpers for order file cards.
 *
 * The order pages render Supabase *signed* URLs, which next/image rejects
 * (its remotePatterns only allow public paths), so previews use plain <img>.
 * Downloads go through fetch → blob → object URL: the `download` attribute is
 * ignored on cross-origin URLs, and without this the browser simply opens the
 * file in a tab. PDFs preview through a blob-backed iframe, which carries no
 * X-Frame-Options and needs no plugin allowances of its own.
 */

import { useEffect, useState } from "react";

export type PreviewKind = "image" | "pdf" | null;

/** Which inline preview a filename supports, if any. */
export function previewKind(filename: string): PreviewKind {
  const name = String(filename || "").toLowerCase();
  if (/\.pdf$/.test(name)) return "pdf";
  if (/\.(png|jpe?g|gif|webp|bmp|avif|heic|heif)$/.test(name)) return "image";
  return null;
}

/** Save a file without navigating to it — works cross-origin. */
export async function saveFile(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename || "file";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 60_000);
  } catch {
    // Storage refused the CORS read — fall back to the signed URL itself.
    // The browser may open it, but at least the file is reachable.
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "file";
    a.rel = "noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

/** First-page PDF preview; falls back to a message when the viewer can't run. */
export function PdfPreviewFrame({
  url,
  title,
  className,
  style,
  toolbar = true,
}: {
  url: string;
  title: string;
  className?: string;
  style?: React.CSSProperties;
  /** Viewer controls (zoom, page nav) — off for compact thumbnails. */
  toolbar?: boolean;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && (navigator as any).pdfViewerEnabled === false) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    let created: string | null = null;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const typed =
          blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
        created = URL.createObjectURL(typed);
        setBlobUrl(created);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [url]);

  if (blobUrl) {
    const fragment = toolbar
      ? "#view=FitH&navpanes=0"
      : "#toolbar=0&navpanes=0&scrollbar=0&view=FitH";
    return (
      <iframe
        src={blobUrl + fragment}
        title={title}
        className={className}
        style={{ border: "none", display: "block", ...style }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        color: "var(--txt3)",
        fontSize: 12,
        textAlign: "center",
        ...style,
      }}
    >
      {failed ? "Preview not available in this browser — use Download." : "Loading preview…"}
    </div>
  );
}
