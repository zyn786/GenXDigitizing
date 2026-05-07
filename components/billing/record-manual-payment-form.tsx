"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type PaymentRecord = {
  id: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  method: string;
  reference: string | null;
  receivedAt: string;
  note: string | null;
};

type Props = {
  invoiceId: string;
  currency: string;
  balanceDue: number;
  payments: PaymentRecord[];
  canRecord: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  CASH: "Cash",
  CARD: "Card",
  PAYPAL: "PayPal",
  OTHER: "Other",
};

function fmt(n: number) {
  return n.toFixed(2);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecordManualPaymentForm({
  invoiceId,
  currency,
  balanceDue,
  payments,
  canRecord,
}: Props) {
  const router = useRouter();

  const [amount, setAmount] = useState(balanceDue > 0 ? balanceDue.toFixed(2) : "");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!canRecord) {
    return (
      <div className="rounded-2xl border border-border/80 bg-secondary/80 p-4 text-sm text-muted-foreground">
        Manual payment recording is restricted to Super Admin and Manager.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          currency,
          method,
          reference: reference.trim() || null,
          note: note.trim() || null,
          clientEmail: "client@example.com",
        }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed to record payment.");
      } else {
        setSuccess(true);
        setAmount("");
        setReference("");
        setNote("");
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4">
      {/* Payment history */}
      {payments.length > 0 && (
        <div className="grid gap-2">
          <p className="text-xs font-medium text-muted-foreground">Payment history</p>
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">{p.receiptNumber}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {METHOD_LABELS[p.method] ?? p.method}
                </span>
              </div>
              <span className="font-semibold">
                {currency} {fmt(p.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Balance */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Balance due</span>
        <span className="font-semibold">
          {currency} {fmt(balanceDue)}
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">
              Amount ({currency})
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={submitting}
              className="h-9 rounded-xl border border-border/80 bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              disabled={submitting}
              className="h-9 rounded-xl border border-border/80 bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              {Object.entries(METHOD_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">Reference (optional)</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            disabled={submitting}
            placeholder="Transaction ID, check number, etc."
            className="h-9 rounded-xl border border-border/80 bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
            placeholder="Internal note"
            className="h-9 rounded-xl border border-border/80 bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>

        {success && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
            Payment recorded successfully.
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Recording…
            </>
          ) : (
            "Record payment"
          )}
        </button>
      </form>
    </div>
  );
}
