"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type LineItem = {
  id?: string;
  label: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
};

type InvoiceData = {
  id: string;
  status: string;
  currency: string;
  subtotalAmount: number;
  totalAmount: number;
  balanceDue: number;
  lineItems: LineItem[];
};

type Props = {
  invoice: InvoiceData;
  canEdit: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toFixed(2);
}

const LOCKED_STATUSES = new Set(["PAID", "CANCELLED", "VOID"]);

// ─── Component ───────────────────────────────────────────────────────────────

export function InvoiceLineEditor({ invoice, canEdit }: Props) {
  const router = useRouter();
  const isLocked = LOCKED_STATUSES.has(invoice.status);
  const editable = canEdit && !isLocked;

  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice.lineItems.length > 0
      ? invoice.lineItems.map((li) => ({ ...li }))
      : [{ label: "", description: null, quantity: 1, unitPrice: 0 }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  function updateItem(idx: number, field: keyof LineItem, value: string | number | null) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  function removeItem(idx: number) {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function addItem() {
    setLineItems((prev) => [
      ...prev,
      { label: "", description: null, quantity: 1, unitPrice: 0 },
    ]);
  }

  async function handleSave() {
    const valid = lineItems.filter((li) => li.label.trim());
    if (valid.length === 0) {
      setError("At least one line item with a label is required.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineItems: valid }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed to save.");
      } else {
        setSuccess(true);
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return (
      <div className="rounded-2xl border border-border/80 bg-secondary/80 p-4 text-sm text-muted-foreground">
        Line editing is restricted to Super Admin and Manager.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Line Items</p>
        {editable && (
          <button
            type="button"
            onClick={addItem}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground hover:bg-secondary disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            Add line
          </button>
        )}
      </div>

      {isLocked && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
          This invoice is {invoice.status.toLowerCase()} and cannot be edited.
        </div>
      )}

      <div className="grid gap-2">
        {lineItems.map((li, idx) => (
          <div
            key={idx}
            className="grid gap-2 rounded-2xl border border-border/80 bg-secondary/40 p-3 sm:grid-cols-[1fr_auto_auto_auto]"
          >
            <div className="grid gap-1">
              <input
                type="text"
                value={li.label}
                onChange={(e) => updateItem(idx, "label", e.target.value)}
                disabled={!editable || saving}
                placeholder="Item label"
                className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <input
                type="text"
                value={li.description ?? ""}
                onChange={(e) => updateItem(idx, "description", e.target.value || null)}
                disabled={!editable || saving}
                placeholder="Description (optional)"
                className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <input
              type="number"
              min="1"
              value={li.quantity}
              onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
              disabled={!editable || saving}
              className="w-16 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              title="Quantity"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={li.unitPrice}
              onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
              disabled={!editable || saving}
              className="w-24 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              title="Unit price"
            />
            {editable && lineItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(idx)}
                disabled={saving}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                title="Remove line"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-semibold">${fmt(subtotal)}</span>
      </div>

      {editable && (
        <div className="grid gap-2">
          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
              Invoice updated successfully.
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
