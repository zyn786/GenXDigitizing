"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkflowStatus } from "@/lib/workflow/types";

type Transition = {
  label: string;
  target: string;
  destructive?: boolean;
};

const TRANSITIONS: Partial<Record<WorkflowStatus, Transition[]>> = {
  SUBMITTED: [
    { label: "Start work", target: "IN_PROGRESS" },
    { label: "Cancel order", target: "CANCELLED", destructive: true },
  ],
  IN_PROGRESS: [
    { label: "Send proof", target: "PROOF_READY" },
    { label: "Cancel order", target: "CANCELLED", destructive: true },
  ],
  PROOF_READY: [
    { label: "Mark approved", target: "APPROVED" },
    { label: "Request revision", target: "REVISION_REQUESTED" },
    { label: "Cancel order", target: "CANCELLED", destructive: true },
  ],
  REVISION_REQUESTED: [
    { label: "Resume work", target: "IN_PROGRESS" },
    { label: "Cancel order", target: "CANCELLED", destructive: true },
  ],
  APPROVED: [
    { label: "Mark delivered", target: "DELIVERED" },
  ],
  DELIVERED: [
    { label: "Close order", target: "CLOSED" },
  ],
};

export function OrderStatusControls({
  orderId,
  status,
}: {
  orderId: string;
  status: WorkflowStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transitions = TRANSITIONS[status] ?? [];

  if (transitions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No further actions available.
      </p>
    );
  }

  async function advance(target: string) {
    setPending(target);
    setError(null);
    try {
      const res = await fetch(`/api/workflow/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Something went wrong.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-2">
      {transitions.map((t) => (
        <button
          key={t.target}
          type="button"
          disabled={pending !== null}
          onClick={() => advance(t.target)}
          className={
            t.destructive
              ? "inline-flex h-9 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-4 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
              : "inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          }
        >
          {pending === t.target ? "Saving…" : t.label}
        </button>
      ))}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
