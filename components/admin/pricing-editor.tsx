"use client";

import { useState } from "react";
import type { PricingCatalog } from "@/lib/pricing/catalog";

type Tab = "categories" | "addons" | "delivery";

export function PricingEditor({ initialCatalog }: { initialCatalog: PricingCatalog }) {
  const [catalog, setCatalog] = useState<PricingCatalog>(initialCatalog);
  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catalog),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Save failed.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function updateTierPrice(catKey: string, tierKey: string, price: number) {
    setCatalog((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.key === catKey
          ? { ...c, tiers: c.tiers.map((t) => (t.key === tierKey ? { ...t, price } : t)) }
          : c
      ),
    }));
  }

  function toggleTier(catKey: string, tierKey: string) {
    setCatalog((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.key === catKey
          ? { ...c, tiers: c.tiers.map((t) => (t.key === tierKey ? { ...t, isActive: !t.isActive } : t)) }
          : c
      ),
    }));
  }

  function toggleCategory(catKey: string) {
    setCatalog((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.key === catKey ? { ...c, isActive: !c.isActive } : c
      ),
    }));
  }

  function updateAddonPrice(key: string, price: number) {
    setCatalog((prev) => ({
      ...prev,
      addons: prev.addons.map((a) => (a.key === key ? { ...a, price } : a)),
    }));
  }

  function toggleAddon(key: string) {
    setCatalog((prev) => ({
      ...prev,
      addons: prev.addons.map((a) => (a.key === key ? { ...a, isActive: !a.isActive } : a)),
    }));
  }

  function updateDeliveryPrice(key: string, extraPrice: number) {
    setCatalog((prev) => ({
      ...prev,
      delivery: prev.delivery.map((d) => (d.key === key ? { ...d, extraPrice } : d)),
    }));
  }

  function toggleDelivery(key: string) {
    setCatalog((prev) => ({
      ...prev,
      delivery: prev.delivery.map((d) => (d.key === key ? { ...d, isActive: !d.isActive } : d)),
    }));
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "categories", label: "Service categories" },
    { id: "addons", label: "Add-ons" },
    { id: "delivery", label: "Delivery speeds" },
  ];

  return (
    <div className="grid gap-6">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl border border-border/80 bg-card/70 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
              activeTab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      {activeTab === "categories" && (
        <div className="grid gap-5">
          {catalog.categories.map((cat) => (
            <div
              key={cat.key}
              className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70"
            >
              <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.emoji}</span>
                  <div>
                    <p className="font-semibold">{cat.label}</p>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    )}
                  </div>
                </div>
                <ActiveToggle active={cat.isActive} onToggle={() => toggleCategory(cat.key)} />
              </div>

              <div className="divide-y divide-border/80">
                {cat.tiers.map((tier) => (
                  <div key={tier.key} className="flex items-center gap-3 px-5 py-3">
                    <p className="flex-1 text-sm text-muted-foreground">{tier.label}</p>
                    <PriceInput
                      value={tier.price}
                      prefix="$"
                      onChange={(v) => updateTierPrice(cat.key, tier.key, v)}
                    />
                    <ActiveToggle
                      active={tier.isActive}
                      onToggle={() => toggleTier(cat.key, tier.key)}
                      small
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add-ons */}
      {activeTab === "addons" && (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
            <div>Add-on</div>
            <div>Price</div>
            <div>Status</div>
          </div>
          <div className="divide-y divide-border/80">
            {catalog.addons.map((addon) => (
              <div key={addon.key} className="flex items-center gap-3 px-5 py-3.5">
                <p className="flex-1 text-sm">{addon.label}</p>
                <PriceInput
                  value={addon.price}
                  prefix="$"
                  onChange={(v) => updateAddonPrice(addon.key, v)}
                />
                <ActiveToggle
                  active={addon.isActive}
                  onToggle={() => toggleAddon(addon.key)}
                  small
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery */}
      {activeTab === "delivery" && (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
            <div>Speed</div>
            <div>Extra price</div>
            <div>Status</div>
          </div>
          <div className="divide-y divide-border/80">
            {catalog.delivery.map((d) => (
              <div key={d.key} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1">
                  <p className="text-sm">{d.label}</p>
                  {d.subLabel && <p className="text-xs text-muted-foreground">{d.subLabel}</p>}
                </div>
                <PriceInput
                  value={d.extraPrice}
                  prefix="+$"
                  onChange={(v) => updateDeliveryPrice(d.key, v)}
                />
                <ActiveToggle
                  active={d.isActive}
                  onToggle={() => toggleDelivery(d.key)}
                  small
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save bar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save pricing"}
        </button>
        {saved && (
          <p className="text-sm text-emerald-400">Saved — changes are now live on client forms.</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}

function PriceInput({
  value,
  prefix,
  onChange,
}: {
  value: number;
  prefix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="shrink-0 text-xs text-muted-foreground">{prefix}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-right text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

function ActiveToggle({
  active,
  onToggle,
  small,
}: {
  active: boolean;
  onToggle: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`shrink-0 rounded-full font-medium transition ${
        small ? "w-14 py-1 text-xs" : "px-4 py-1.5 text-sm"
      } ${
        active
          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
      }`}
    >
      {active ? "Active" : "Off"}
    </button>
  );
}
