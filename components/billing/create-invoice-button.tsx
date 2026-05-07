"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

type Props = {
  orderId: string;
  canCreate: boolean;
  estimatedPrice?: number | null;
  orderTitle?: string | null;
};

export function CreateInvoiceButton({
  orderId,
  canCreate,
  estimatedPrice,
  orderTitle,
}: Props) {
  const router = useRouter();
  const hasPrice = estimatedPrice != null && estimatedPrice > 0;
  const defaultAmount = hasPrice ? estimatedPrice!.toFixed(2) : "";

  const [showForm, setShowForm] = useState(hasPrice);
  const [amount, setAmount] = useState(defaultAmount);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canCreate) {
    return (
      <p className="text-sm text-muted-foreground">
        No invoice yet. Only Super Admin or Manager can create one.
      </p>
    );
  }

  async function handleCreate() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const label = orderTitle
        ? `Digitizing: ${orderTitle}`
        : "Embroidery digitizing service";
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          currency: "USD",
          lineItems: [
            {
              label,
              description: "Embroidery digitizing service for your design.",
              quantity: 1,
              unitPrice: amt,
            },
          ],
        }),
      });
      const json = await res.json() as {
        ok: boolean;
        message?: string;
        invoice?: { id: string };
      };
      if (!json.ok) {
        setError(json.message ?? "Failed to create invoice.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setCreating(false);
    }
  }

  if (!showForm) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">No invoice yet.</p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Create invoice
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium">Create invoice</p>
      {hasPrice && (
        <p className="text-xs text-muted-foreground">
          Prefilled from order estimated price. Adjust as needed.
        </p>
      )}

      <div className="grid gap-2">
        <label className="text-xs text-muted-foreground">
          Invoice amount (USD)
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          disabled={creating}
          className="h-9 rounded-xl border border-border/80 bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={creating}
          onClick={handleCreate}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {creating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Creating…
            </>
          ) : (
            "Create invoice"
          )}
        </button>
        <button
          type="button"
          disabled={creating}
          onClick={() => setShowForm(false)}
          className="inline-flex h-9 items-center rounded-full border border-border/80 px-3 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
