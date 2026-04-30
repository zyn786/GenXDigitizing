"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, RotateCcw, AlertCircle, Eye } from "lucide-react";

type Props = {
  orderId: string;
  proofId: string;
  fileName: string;
};

export function ProofReviewPanel({ orderId, proofId, fileName }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"idle" | "revise">("idle");
  const [revisionNote, setRevisionNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "revision" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);

  useEffect(() => {
    void fetch(`/api/client/orders/${orderId}/proof-viewed`, { method: "POST" }).catch(() => {});
  }, [orderId]);

  async function handleDownload() {
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

  function respond(action: "approve" | "request_revision") {
    setError(null);
    if (action === "request_revision" && !revisionNote.trim()) {
      setError("Please describe the changes you need.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/client/orders/${orderId}/proof-respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            action === "approve"
              ? { action: "approve" }
              : { action: "request_revision", revisionNote: revisionNote.trim(), attachmentUrls }
          ),
        });
        const json = await res.json() as { ok?: boolean; error?: string };
        if (!json.ok) {
          setError(json.error ?? "Something went wrong.");
          return;
        }
        setDone(action === "approve" ? "approved" : "revision");
        router.refresh();
      } catch {
        setError("Request failed. Please try again.");
      }
    });
  }

  if (done === "approved") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
        <CheckCircle className="h-4 w-4 shrink-0" />
        You approved this proof. We&apos;ll move forward with production.
      </div>
    );
  }

  if (done === "revision") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
        <RotateCcw className="h-4 w-4 shrink-0" />
        Revision request submitted. Our designer will update the proof and notify you.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {/* View proof button */}
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-border/80 px-5 text-sm font-medium transition hover:bg-secondary"
      >
        <Eye className="h-4 w-4" />
        View / download proof file
      </button>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {view === "idle" && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => respond("approve")}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {isPending ? "Approving…" : "Approve proof"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setView("revise")}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border/80 px-5 text-sm font-medium transition hover:bg-secondary disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Request revision
          </button>
        </div>
      )}

      {view === "revise" && (
        <div className="grid gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="text-sm font-medium text-amber-400">Request a revision</div>
          <p className="text-xs text-muted-foreground">
            Describe exactly what changes you need and our designer will revise the proof.
          </p>
          <div className="grid gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={async () => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.onchange = async () => {
                  const files = Array.from(input.files ?? []);
                  if (files.length === 0) return;
                  setUploading(true);
                  try {
                    const uploaded: string[] = [];
                    for (const file of files) {
                      const intentRes = await fetch("/api/revision-upload-intent", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          orderId,
                          fileName: file.name,
                          mimeType: file.type || "application/octet-stream",
                        }),
                      });
                      const intentJson = await intentRes.json() as {
                        uploadUrl?: string;
                        objectKey?: string;
                        error?: string;
                      };
                      if (!intentJson.uploadUrl || !intentJson.objectKey) {
                        setError(intentJson.error ?? "Could not upload attachment.");
                        continue;
                      }
                      const uploadRes = await fetch(intentJson.uploadUrl, {
                        method: "PUT",
                        body: file,
                        headers: { "Content-Type": file.type || "application/octet-stream" },
                      });
                      if (!uploadRes.ok) {
                        setError("Attachment upload failed.");
                        continue;
                      }
                      uploaded.push(intentJson.objectKey);
                    }
                    if (uploaded.length > 0) {
                      setAttachmentUrls((prev) => [...prev, ...uploaded]);
                    }
                  } finally {
                    setUploading(false);
                  }
                };
                input.click();
              }}
              className="inline-flex h-9 w-fit items-center rounded-full border border-border/60 px-4 text-xs text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              {uploading ? "Uploading attachments..." : "Attach reference files"}
            </button>
            {attachmentUrls.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                {attachmentUrls.length} attachment{attachmentUrls.length === 1 ? "" : "s"} added
              </div>
            )}
          </div>
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="E.g. Please make the text bolder and change the color to navy blue…"
            rows={4}
            className="w-full resize-none rounded-xl border border-border/60 bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => respond("request_revision")}
              className="inline-flex h-9 items-center rounded-full bg-amber-500 px-4 text-xs font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
            >
              {isPending ? "Submitting…" : "Submit revision request"}
            </button>
            <button
              type="button"
              onClick={() => { setView("idle"); setError(null); }}
              className="inline-flex h-9 items-center rounded-full border border-border/60 px-4 text-xs text-muted-foreground hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
