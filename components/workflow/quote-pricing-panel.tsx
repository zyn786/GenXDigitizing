"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuotePricingPanel({
  orderId,
  currentPrice,
  quoteStatus,
}: {
  orderId: string;
  currentPrice: number | null;
  quoteStatus: string | null;
}) {
  const router = useRouter();
  const [price, setPrice] = useState(currentPrice?.toString() ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isSent = quoteStatus === "PRICE_SENT" || quoteStatus === "CLIENT_ACCEPTED" || quoteStatus === "CLIENT_REJECTED";

  async function handleSetPrice() {
    const parsed = parseFloat(price);
    if (!parsed || parsed <= 0) {
      setError("Enter a valid price.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/quotes/${orderId}/price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotedPrice: parsed, quoteNotes: notes || undefined }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed to save price.");
      } else {
        setSuccess("Price saved.");
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendQuote() {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/quotes/${orderId}/send-quote`, { method: "POST" });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed to send quote.");
      } else {
        setSuccess("Quote sent to client.");
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setSending(false);
    }
  }

  if (isSent) {
    return (
      <div className="grid gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-semibold">${currentPrice?.toFixed(2)}</span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
            {quoteStatus === "PRICE_SENT" ? "Awaiting client response" :
             quoteStatus === "CLIENT_ACCEPTED" ? "Accepted" : "Rejected"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Quote has been sent to the client.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <label className="text-xs text-muted-foreground">Quoted price (USD)</label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <label className="text-xs text-muted-foreground">Notes for client (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Breakdown or special terms…"
          className="w-full resize-none rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-emerald-400">{success}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleSetPrice}
          className="inline-flex h-9 flex-1 items-center justify-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save price"}
        </button>
        <button
          type="button"
          disabled={sending || !currentPrice}
          onClick={handleSendQuote}
          className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send to client"}
        </button>
      </div>
      {!currentPrice && (
        <p className="text-xs text-muted-foreground">Save a price first before sending.</p>
      )}
    </div>
  );
}
