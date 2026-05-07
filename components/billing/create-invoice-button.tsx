"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

type Props = {
  orderId: string;
  canCreate: boolean;
};

export function CreateInvoiceButton({ orderId, canCreate }: Props) {
  const router = useRouter();
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
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          currency: "USD",
          lineItems: [
            {
              label: "Digitizing Service",
              description: "Embroidery digitizing service for your design.",
              quantity: 1,
              unitPrice: 0, // admin should update after creation
            },
          ],
        }),
      });
      const json = await res.json() as { ok: boolean; message?: string; invoice?: { id: string } };
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

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">No invoice yet.</p>
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}
      <button
        type="button"
        disabled={creating}
        onClick={handleCreate}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {creating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Creating…
          </>
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" />
            Create invoice
          </>
        )}
      </button>
    </div>
  );
}
