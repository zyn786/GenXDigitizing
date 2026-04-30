"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { RevisionRequest } from "@/lib/workflow/types";

type Props = { revisions: RevisionRequest[] };

const ACTIVE_STATUSES = new Set(["ASSIGNED_TO_DESIGNER", "IN_PROGRESS", "REVISED_PROOF_UPLOADED"]);

export function DesignerRevisionTasks({ revisions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const tasks = revisions.filter((r) => ACTIVE_STATUSES.has(r.status));

  const update = (revisionId: string, action: "start_progress" | "mark_revised_proof_uploaded") => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/designer/revisions/${revisionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const json = await res.json() as { ok?: boolean; error?: string };
        if (!json.ok) {
          setError(json.error ?? "Action failed.");
          return;
        }
        router.refresh();
      } catch {
        setError("Action failed.");
      }
    });
  };

  if (tasks.length === 0) return null;

  return (
    <div className="grid gap-3">
      {error && <div className="text-xs text-red-400">{error}</div>}
      {tasks.map((task) => (
        <div key={task.id} className="rounded-xl border border-border/70 bg-secondary/20 p-3">
          <div className="text-sm font-medium">Revision #{task.revisionNumber}</div>
          <p className="mt-1 text-sm text-muted-foreground">{task.body}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {task.status === "ASSIGNED_TO_DESIGNER" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => update(task.id, "start_progress")}
                className="h-8 rounded-full bg-primary px-3 text-xs text-primary-foreground disabled:opacity-50"
              >
                Start progress
              </button>
            )}
            {task.status !== "REVISED_PROOF_UPLOADED" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => update(task.id, "mark_revised_proof_uploaded")}
                className="h-8 rounded-full border border-border/60 px-3 text-xs text-muted-foreground hover:bg-secondary disabled:opacity-50"
              >
                Mark revised proof uploaded
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
