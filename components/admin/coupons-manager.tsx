"use client";

import { useState } from "react";

type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: { toNumber?: () => number } | number | string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
  description: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  createdBy: { name: string | null; role: string } | null;
  approvedBy: { name: string | null } | null;
};

function formatDiscount(c: Coupon) {
  const val =
    typeof c.discountValue === "object" && c.discountValue !== null && "toNumber" in c.discountValue
      ? (c.discountValue as { toNumber: () => number }).toNumber()
      : Number(c.discountValue);
  return c.discountType === "PERCENT" ? `${val}%` : `$${val}`;
}

export function CouponsManager({
  initialCoupons,
  userRole,
}: {
  initialCoupons: Coupon[];
  userRole: string;
}) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "MANAGER";

  async function act(couponId: string, action: "approve" | "deactivate" | "delete") {
    setActingId(couponId);
    setError(null);
    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin/coupons/${couponId}`, { method: "DELETE" });
        const json = await res.json() as { ok: boolean; message?: string };
        if (!json.ok) { setError(json.message ?? "Failed."); return; }
        setCoupons((prev) => prev.filter((c) => c.id !== couponId));
      } else {
        const res = await fetch(`/api/admin/coupons/${couponId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const json = await res.json() as { ok: boolean; message?: string };
        if (!json.ok) { setError(json.message ?? "Failed."); return; }
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === couponId
              ? { ...c, isActive: action === "approve" }
              : c
          )
        );
      }
    } catch {
      setError("Network error.");
    } finally {
      setActingId(null);
    }
  }

  function onCreated(coupon: Coupon) {
    setCoupons((prev) => [coupon, ...prev]);
    setShowForm(false);
  }

  const pending = coupons.filter((c) => !c.isActive && !c.approvedAt);
  const active = coupons.filter((c) => c.isActive);
  const inactive = coupons.filter((c) => !c.isActive && c.approvedAt);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {coupons.length} total · {active.length} active
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {showForm ? "Cancel" : "+ New coupon"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <CreateCouponForm isAdmin={isAdmin} onCreated={onCreated} onCancel={() => setShowForm(false)} />
      )}

      {/* Pending approval (admin sees these) */}
      {isAdmin && pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
            Pending approval ({pending.length})
          </h2>
          <CouponTable
            coupons={pending}
            isAdmin={isAdmin}
            actingId={actingId}
            onAct={act}
            showApprove
          />
        </section>
      )}

      {/* Active */}
      {active.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Active codes</h2>
          <CouponTable
            coupons={active}
            isAdmin={isAdmin}
            actingId={actingId}
            onAct={act}
          />
        </section>
      )}

      {/* Inactive */}
      {inactive.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Inactive</h2>
          <CouponTable
            coupons={inactive}
            isAdmin={isAdmin}
            actingId={actingId}
            onAct={act}
          />
        </section>
      )}

      {coupons.length === 0 && !showForm && (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          No coupons yet.
        </div>
      )}
    </div>
  );
}

function CouponTable({
  coupons,
  isAdmin,
  actingId,
  onAct,
  showApprove,
}: {
  coupons: Coupon[];
  isAdmin: boolean;
  actingId: string | null;
  onAct: (id: string, action: "approve" | "deactivate" | "delete") => void;
  showApprove?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
      <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
        <div>Code</div>
        <div>Discount</div>
        <div>Uses</div>
        <div>Expires</div>
        <div></div>
      </div>
      <div className="divide-y divide-border/80">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-1 gap-2 px-5 py-3.5 text-sm sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-center"
          >
            <div>
              <code className="font-mono font-semibold tracking-wider">{c.code}</code>
              {c.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
              )}
              {c.createdBy && (
                <p className="mt-0.5 text-xs text-muted-foreground opacity-60">
                  by {c.createdBy.name ?? "—"} ({c.createdBy.role})
                </p>
              )}
            </div>
            <div className="font-semibold">{formatDiscount(c)}</div>
            <div className="text-muted-foreground">
              {c.usedCount}
              {c.maxUses ? ` / ${c.maxUses}` : " / ∞"}
            </div>
            <div className="text-xs text-muted-foreground">
              {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "No expiry"}
            </div>
            <div className="flex gap-2">
              {isAdmin && showApprove && (
                <button
                  type="button"
                  disabled={actingId === c.id}
                  onClick={() => onAct(c.id, "approve")}
                  className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {actingId === c.id ? "…" : "Approve"}
                </button>
              )}
              {isAdmin && c.isActive && (
                <button
                  type="button"
                  disabled={actingId === c.id}
                  onClick={() => onAct(c.id, "deactivate")}
                  className="rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground hover:bg-secondary disabled:opacity-50"
                >
                  {actingId === c.id ? "…" : "Deactivate"}
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  disabled={actingId === c.id}
                  onClick={() => onAct(c.id, "delete")}
                  className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateCouponForm({
  isAdmin,
  onCreated,
  onCancel,
}: {
  isAdmin: boolean;
  onCreated: (c: Coupon) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const expiresRaw = fd.get("expiresAt") as string;
    const body = {
      code: (fd.get("code") as string).toUpperCase().trim(),
      discountType: fd.get("discountType") as string,
      discountValue: Number(fd.get("discountValue")),
      maxUses: fd.get("maxUses") ? Number(fd.get("maxUses")) : undefined,
      expiresAt: expiresRaw ? new Date(expiresRaw).toISOString() : undefined,
      description: (fd.get("description") as string).trim() || undefined,
    };

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { ok: boolean; coupon?: Coupon; message?: string };
      if (!json.ok || !json.coupon) {
        setError(json.message ?? "Failed to create coupon.");
      } else {
        onCreated(json.coupon);
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-[2rem] border border-border/80 bg-card/70 p-6"
    >
      <h2 className="text-base font-semibold">New coupon</h2>

      {!isAdmin && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          This coupon will require admin approval before it goes live.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Code <span className="text-red-400">*</span>
          </label>
          <input
            name="code"
            required
            placeholder="SAVE20"
            pattern="[A-Za-z0-9_-]+"
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Discount type <span className="text-red-400">*</span>
          </label>
          <select
            name="discountType"
            required
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm"
          >
            <option value="PERCENT">Percentage (%)</option>
            <option value="FIXED">Fixed amount ($)</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Discount value <span className="text-red-400">*</span>
          </label>
          <input
            name="discountValue"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="20"
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Max uses</label>
          <input
            name="maxUses"
            type="number"
            min="1"
            placeholder="Unlimited"
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Expiry date</label>
          <input
            name="expiresAt"
            type="date"
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Description</label>
        <input
          name="description"
          placeholder="Internal note about this coupon…"
          className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create coupon"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center justify-center rounded-full border border-border/80 px-6 text-sm text-muted-foreground transition hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
