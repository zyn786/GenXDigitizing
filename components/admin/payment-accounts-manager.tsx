"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

import type { ManualPaymentAccountRecord } from "@/lib/payments/types";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  BANK_ACCOUNT: "Bank Account",
  CASH_APP: "Cash App",
  PAYPAL: "PayPal",
  VENMO: "Venmo",
  WISE: "Wise",
  ZELLE: "Zelle",
  OTHER: "Other",
};

type FormState = Omit<ManualPaymentAccountRecord, "id" | "createdAt" | "updatedAt">;

const DEFAULT_FORM: FormState = {
  type: "BANK_ACCOUNT",
  displayName: "",
  accountName: "",
  accountId: "",
  instructions: "",
  paymentLink: "",
  currency: "USD",
  isActive: true,
  notes: "",
  sortOrder: 0,
};

export function PaymentAccountsManager({
  initialAccounts,
}: {
  initialAccounts: ManualPaymentAccountRecord[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(account: ManualPaymentAccountRecord) {
    setForm({
      type: account.type,
      displayName: account.displayName,
      accountName: account.accountName,
      accountId: account.accountId,
      instructions: account.instructions ?? "",
      paymentLink: account.paymentLink ?? "",
      currency: account.currency,
      isActive: account.isActive,
      notes: account.notes ?? "",
      sortOrder: account.sortOrder,
    });
    setEditingId(account.id);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder),
      instructions: form.instructions?.trim() || null,
      paymentLink: form.paymentLink?.trim() || null,
      notes: form.notes?.trim() || null,
    };

    try {
      const url = editingId
        ? `/api/admin/payment-accounts/${editingId}`
        : "/api/admin/payment-accounts";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { ok: boolean; account?: ManualPaymentAccountRecord; message?: string };

      if (!json.ok || !json.account) {
        setError(json.message ?? "Failed to save.");
        return;
      }

      if (editingId) {
        setAccounts((prev) => prev.map((a) => a.id === editingId ? json.account! : a));
      } else {
        setAccounts((prev) => [json.account!, ...prev]);
      }
      cancelForm();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(account: ManualPaymentAccountRecord) {
    setActingId(account.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payment-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !account.isActive }),
      });
      const json = await res.json() as { ok: boolean; account?: ManualPaymentAccountRecord; message?: string };
      if (!json.ok || !json.account) { setError(json.message ?? "Failed."); return; }
      setAccounts((prev) => prev.map((a) => a.id === account.id ? json.account! : a));
    } catch {
      setError("Network error.");
    } finally {
      setActingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this payment account? This cannot be undone.")) return;
    setActingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payment-accounts/${id}`, { method: "DELETE" });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) { setError(json.message ?? "Failed."); return; }
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Network error.");
    } finally {
      setActingId(null);
    }
  }

  const active = accounts.filter((a) => a.isActive);
  const inactive = accounts.filter((a) => !a.isActive);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {accounts.length} accounts · {active.length} active
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          + Add payment method
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-5 rounded-[2rem] border border-border/80 bg-card/70 p-6"
        >
          <h2 className="text-base font-semibold">
            {editingId ? "Edit payment method" : "New payment method"}
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Type <span className="text-red-400">*</span></label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FormState["type"] }))}
                className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm"
                required
              >
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Display name <span className="text-red-400">*</span></label>
              <input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="e.g. Business Checking Account"
                required
                className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Account name <span className="text-red-400">*</span></label>
              <input
                value={form.accountName}
                onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                placeholder="e.g. GenX Digitizing LLC"
                required
                className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Account ID / Email / Number <span className="text-red-400">*</span></label>
              <input
                value={form.accountId}
                onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                placeholder="e.g. payments@genxdigitizing.com"
                required
                className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Currency</label>
              <input
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
                placeholder="USD"
                maxLength={8}
                className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Sort order</label>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Payment link (URL)</label>
            <input
              type="url"
              value={form.paymentLink ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, paymentLink: e.target.value }))}
              placeholder="e.g. https://cash.app/$genxdigitizing or https://paypal.me/genxdigitizing"
              className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground">
              If provided, a scannable QR code and clickable link will be shown to clients.
            </p>
            {form.paymentLink?.trim() && (
              <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-secondary/40 p-4">
                <div className="rounded-xl bg-white p-2">
                  <QRCode value={form.paymentLink.trim()} size={80} />
                </div>
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">QR preview</div>
                  <div className="mt-1 break-all">{form.paymentLink.trim()}</div>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Payment instructions</label>
            <textarea
              value={form.instructions ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              placeholder="Instructions shown to clients, e.g. 'Send payment to $genxdigitizing on Cash App and include your order number in the note.'"
              rows={3}
              className="rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Internal notes</label>
            <input
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Staff-only notes (not shown to clients)"
              className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded"
              />
              Active (visible to clients)
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="inline-flex h-11 items-center justify-center rounded-full border border-border/80 px-6 text-sm text-muted-foreground transition hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Active payment methods</h2>
          <AccountList accounts={active} actingId={actingId} onEdit={openEdit} onToggle={toggleActive} onDelete={handleDelete} />
        </section>
      )}

      {inactive.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Inactive</h2>
          <AccountList accounts={inactive} actingId={actingId} onEdit={openEdit} onToggle={toggleActive} onDelete={handleDelete} />
        </section>
      )}

      {accounts.length === 0 && !showForm && (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          No payment methods configured yet. Add one above.
        </div>
      )}
    </div>
  );
}

function AccountList({
  accounts,
  actingId,
  onEdit,
  onToggle,
  onDelete,
}: {
  accounts: ManualPaymentAccountRecord[];
  actingId: string | null;
  onEdit: (a: ManualPaymentAccountRecord) => void;
  onToggle: (a: ManualPaymentAccountRecord) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
      <div className="divide-y divide-border/80">
        {accounts.map((a) => (
          <div key={a.id} className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{a.displayName}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {ACCOUNT_TYPE_LABELS[a.type] ?? a.type}
                  </span>
                  {!a.isActive && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground opacity-60">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {a.accountName} · <span className="font-mono text-xs">{a.accountId}</span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{a.currency}</div>
                {a.paymentLink && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="rounded-lg bg-white p-1.5">
                      <QRCode value={a.paymentLink} size={56} />
                    </div>
                    <a
                      href={a.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-xs text-primary underline-offset-2 hover:underline"
                    >
                      {a.paymentLink}
                    </a>
                  </div>
                )}
                {a.instructions && (
                  <div className="mt-2 max-w-2xl text-xs text-muted-foreground/80 leading-relaxed">
                    {a.instructions}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={actingId === a.id}
                  onClick={() => onEdit(a)}
                  className="rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground hover:bg-secondary disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={actingId === a.id}
                  onClick={() => onToggle(a)}
                  className={`rounded-full px-3 py-1 text-xs disabled:opacity-50 ${
                    a.isActive
                      ? "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  }`}
                >
                  {actingId === a.id ? "…" : a.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  disabled={actingId === a.id}
                  onClick={() => onDelete(a.id)}
                  className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
