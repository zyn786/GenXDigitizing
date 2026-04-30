"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { RevisionRequest } from "@/lib/workflow/types";

type Props = {
  orderId: string;
  revisions: RevisionRequest[];
  designers: Array<{ id: string; name: string | null }>;
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED_BY_CLIENT: "Requested by client",
  CREATED_BY_ADMIN: "Created by admin",
  UNDER_ADMIN_REVIEW: "Under admin review",
  ASSIGNED_TO_DESIGNER: "Assigned to designer",
  IN_PROGRESS: "In progress",
  REVISED_PROOF_UPLOADED: "Revised proof uploaded",
  SENT_TO_CLIENT: "Sent to client",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export function RevisionAdminPanel({ orderId, revisions, designers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch {
        setError("Action failed.");
      }
    });
  }

  return (
    <div className="grid gap-4">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border/70 bg-secondary/20 p-3">
        <div className="mb-2 text-xs font-medium">Create revision on behalf of client</div>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          placeholder="Describe revision instructions..."
          className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={isPending || !instructions.trim()}
          onClick={() =>
            run(async () => {
              const res = await fetch(`/api/admin/orders/${orderId}/revisions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "create_by_admin",
                  revisionInstructions: instructions.trim(),
                }),
              });
              const json = await res.json() as { ok?: boolean; error?: string };
              if (!json.ok) throw new Error(json.error ?? "Failed");
              setInstructions("");
            })
          }
          className="mt-2 inline-flex h-8 items-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          Create admin revision
        </button>
      </div>

      {revisions.length === 0 ? (
        <div className="text-sm text-muted-foreground">No revisions yet.</div>
      ) : (
        revisions
          .slice()
          .reverse()
          .map((rev) => (
            <div key={rev.id} className="rounded-xl border border-border/70 bg-secondary/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium">Revision #{rev.revisionNumber}</div>
                <span className="text-xs text-muted-foreground">{STATUS_LABEL[rev.status] ?? rev.status}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{rev.body}</p>
              {rev.assignedDesignerName && (
                <div className="mt-1 text-xs text-muted-foreground">Assigned: {rev.assignedDesignerName}</div>
              )}
              {rev.attachmentUrls.length > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Attachments: {rev.attachmentUrls.length}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  disabled={isPending}
                  defaultValue=""
                  onChange={(e) => {
                    const designerId = e.currentTarget.value;
                    if (!designerId) return;
                    run(async () => {
                      const res = await fetch(`/api/admin/orders/${orderId}/revisions`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "assign_designer",
                          revisionId: rev.id,
                          assignedDesignerId: designerId,
                        }),
                      });
                      const json = await res.json() as { ok?: boolean; error?: string };
                      if (!json.ok) throw new Error(json.error ?? "Failed");
                    });
                  }}
                  className="h-8 rounded-full border border-border/60 bg-background px-3 text-xs"
                >
                  <option value="">Assign designer...</option>
                  {designers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name ?? "Unnamed designer"}
                    </option>
                  ))}
                </select>

                {(["UNDER_ADMIN_REVIEW", "SENT_TO_CLIENT", "APPROVED", "REJECTED", "CANCELLED"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      run(async () => {
                        const res = await fetch(`/api/admin/orders/${orderId}/revisions`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "set_status",
                            revisionId: rev.id,
                            status: s,
                          }),
                        });
                        const json = await res.json() as { ok?: boolean; error?: string };
                        if (!json.ok) throw new Error(json.error ?? "Failed");
                      })
                    }
                    className="h-8 rounded-full border border-border/60 px-3 text-xs text-muted-foreground hover:bg-secondary"
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
