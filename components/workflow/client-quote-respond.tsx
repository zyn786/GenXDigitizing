"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

export function ClientQuoteRespond({
  orderId,
  quotedPrice,
  quoteStatus,
}: {
  orderId: string;
  quotedPrice: number;
  quoteStatus: string;
}) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [clientNotes, setClientNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "accept" | "reject") {
    if (action === "accept") setAccepting(true);
    else setRejecting(true);
    setError(null);

    try {
      const res = await fetch(`/api/client/quotes/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, clientNotes: clientNotes || undefined }),
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
      setAccepting(false);
      setRejecting(false);
    }
  }

  if (quoteStatus === "CLIENT_ACCEPTED") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">Quote accepted</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          You accepted this quote. Your order is now in the production queue.
        </p>
      </div>
    );
  }

  if (quoteStatus === "CLIENT_REJECTED") {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-4">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-400" />
          <span className="text-sm font-medium text-red-300">Quote declined</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          You declined this quote. Contact us if you'd like to discuss further.
        </p>
      </div>
    );
  }

  if (quoteStatus !== "PRICE_SENT") {
    return (
      <div className="text-sm text-muted-foreground">
        Your quote is being reviewed. We'll notify you when pricing is ready.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-1">Quoted price</div>
        <div className="text-3xl font-semibold">${quotedPrice.toFixed(2)}</div>
        <p className="mt-2 text-xs text-muted-foreground">
          Accept this quote to move your design into production. If the price doesn't work for you, you can decline and contact us to discuss.
        </p>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!showRejectForm ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={accepting || rejecting}
            onClick={() => handleAction("accept")}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {accepting ? "Accepting…" : "Accept quote"}
          </button>
          <button
            type="button"
            disabled={accepting || rejecting}
            onClick={() => setShowRejectForm(true)}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-4 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" />
            Decline
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          <textarea
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            rows={2}
            placeholder="Reason for declining (optional)"
            className="w-full resize-none rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={rejecting}
              onClick={() => handleAction("reject")}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10 px-4 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {rejecting ? "Declining…" : "Confirm decline"}
            </button>
            <button
              type="button"
              disabled={rejecting}
              onClick={() => { setShowRejectForm(false); setError(null); }}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
