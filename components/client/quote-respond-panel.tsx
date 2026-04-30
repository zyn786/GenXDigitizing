"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  quoteId: string;
}

export function QuoteRespondPanel({ quoteId }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"idle" | "reject">("idle");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "reject") {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(`/api/client/quotes/${quoteId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason || undefined }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Something went wrong. Please try again.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(null);
    }
  }

  if (view === "reject") {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          Let us know why you&apos;re declining (optional) so we can improve our pricing.
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Price is over budget, found another provider…"
          className="w-full rounded-xl border border-border/80 bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => respond("reject")}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-4 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" />
            {pending === "reject" ? "Declining…" : "Confirm decline"}
          </button>
          <button
            type="button"
            onClick={() => { setView("idle"); setReason(""); }}
            className="inline-flex h-9 items-center justify-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
          >
            Back
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm leading-6 text-muted-foreground">
        Review the quoted amount above and choose your response. Accepting will lock in this price and allow us to begin production.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => respond("accept")}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          {pending === "accept" ? "Accepting…" : "Accept this quote"}
        </button>
        <button
          type="button"
          onClick={() => setView("reject")}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-4 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
        >
          <XCircle className="h-3.5 w-3.5" />
          Decline
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
