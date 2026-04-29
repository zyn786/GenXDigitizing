"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/client/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: reason.trim() || undefined }),
      });
      const json = await res.json() as { ok: boolean; message?: string; blocked?: boolean };
      if (!json.ok) {
        setError(json.message ?? "Something went wrong.");
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setError(null); setReason(""); }}
        className="inline-flex h-9 w-full items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-4 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
      >
        Cancel order
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Cancel this order?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This action cannot be undone. Your order will remain visible in your dashboard
              with a Cancelled status.
            </p>

            <div className="mt-4 grid gap-2">
              <label className="text-xs text-muted-foreground">
                Reason for cancellation <span className="opacity-60">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Let us know why you're cancelling…"
                className="w-full resize-none rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {error && (
              <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="flex-1 rounded-full border border-border/80 bg-card/70 py-2.5 text-sm font-medium transition hover:bg-card disabled:opacity-50"
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={pending}
                className="flex-1 rounded-full bg-red-500/90 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {pending ? "Cancelling…" : "Yes, cancel it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
