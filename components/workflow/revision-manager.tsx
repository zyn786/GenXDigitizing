"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getRevisionStatusLabel } from "@/lib/workflow/status";
import type { OrderRevision } from "@/lib/workflow/types";

const STATUS_TONE: Record<string, string> = {
  REQUESTED_BY_CLIENT: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CREATED_BY_ADMIN: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  UNDER_ADMIN_REVIEW: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ASSIGNED_TO_DESIGNER: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  IN_PROGRESS: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  REVISED_PROOF_UPLOADED: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  COMPLETED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "border-border/60 bg-muted/60 text-muted-foreground",
};

type Designer = { id: string; name: string | null };

export function RevisionManager({
  orderId,
  revisions,
  designers,
}: {
  orderId: string;
  revisions: OrderRevision[];
  designers: Designer[];
}) {
  const router = useRouter();
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<Record<string, string>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [newNotes, setNewNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", adminNotes: newNotes || undefined }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed.");
      } else {
        setNewNotes("");
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setCreating(false);
    }
  }

  async function handleAssign(revisionId: string) {
    const designerId = selectedDesigner[revisionId];
    if (!designerId) {
      setError("Select a designer first.");
      return;
    }
    setAssigning(revisionId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          revisionId,
          assignedToUserId: designerId,
          adminNotes: adminNotes[revisionId] || undefined,
        }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setAssigning(null);
    }
  }

  async function handleUpdateStatus(revisionId: string, status: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", revisionId, status }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) setError(json.message ?? "Failed.");
      else router.refresh();
    } catch {
      setError("Network error.");
    }
  }

  return (
    <div className="grid gap-4">
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      {/* Existing revisions */}
      {revisions.length > 0 && (
        <div className="grid gap-3">
          {revisions.map((rev) => (
            <div key={rev.id} className="rounded-2xl border border-border/80 bg-secondary/40 p-4 grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{rev.versionLabel ?? "Revision"}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[rev.status] ?? ""}`}>
                    {getRevisionStatusLabel(rev.status)}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {rev.status === "REVISED_PROOF_UPLOADED" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(rev.id, "COMPLETED")}
                      className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Mark complete
                    </button>
                  )}
                  {!["COMPLETED", "CANCELLED"].includes(rev.status) && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(rev.id, "CANCELLED")}
                      className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {rev.clientNotes && (
                <div className="rounded-xl bg-background/50 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/70">Client: </span>{rev.clientNotes}
                </div>
              )}

              {rev.requestedByName && (
                <div className="text-xs text-muted-foreground">Requested by: {rev.requestedByName}</div>
              )}

              {/* Assign to designer if not yet assigned */}
              {["REQUESTED_BY_CLIENT", "CREATED_BY_ADMIN", "UNDER_ADMIN_REVIEW"].includes(rev.status) && (
                <div className="grid gap-2 border-t border-border/60 pt-3">
                  <div className="text-xs font-medium text-muted-foreground">Assign to designer</div>
                  <select
                    value={selectedDesigner[rev.id] ?? ""}
                    onChange={(e) => setSelectedDesigner((p) => ({ ...p, [rev.id]: e.target.value }))}
                    className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">Select designer…</option>
                    {designers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name ?? d.id}</option>
                    ))}
                  </select>
                  <textarea
                    value={adminNotes[rev.id] ?? ""}
                    onChange={(e) => setAdminNotes((p) => ({ ...p, [rev.id]: e.target.value }))}
                    rows={2}
                    placeholder="Admin notes for designer (optional)"
                    className="w-full resize-none rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={assigning === rev.id}
                    onClick={() => handleAssign(rev.id)}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    {assigning === rev.id ? "Assigning…" : "Assign revision"}
                  </button>
                </div>
              )}

              {rev.assignedToName && (
                <div className="text-xs text-muted-foreground">Assigned to: {rev.assignedToName}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create new revision */}
      <div className="rounded-2xl border border-dashed border-border/60 p-4 grid gap-2">
        <div className="text-xs font-medium text-muted-foreground">Create admin revision</div>
        <textarea
          value={newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
          rows={2}
          placeholder="Describe the revision required…"
          className="w-full resize-none rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus:outline-none"
        />
        <button
          type="button"
          disabled={creating}
          onClick={handleCreate}
          className="inline-flex h-9 items-center justify-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card disabled:opacity-50"
        >
          {creating ? "Creating…" : "+ Create revision"}
        </button>
      </div>
    </div>
  );
}
