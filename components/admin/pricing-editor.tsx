"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
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
        body: JSON.stringify({
          categories: catalog.categories.map((cat) => ({
            key: cat.key,
            label: cat.label,
            emoji: cat.emoji,
            description: cat.description,
            isActive: cat.isActive,
            tiers: cat.tiers.map((tier) => ({
              key: tier.key,
              label: tier.label,
              basePrice: tier.price,
              isActive: tier.isActive,
            })),
          })),
          addons: catalog.addons.map((a) => ({
            key: a.key,
            label: a.label,
            price: a.price,
            isActive: a.isActive,
          })),
          delivery: catalog.delivery.map((d) => ({
            key: d.key,
            label: d.label,
            subLabel: d.subLabel,
            extraPrice: d.extraPrice,
            isActive: d.isActive,
          })),
        }),
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

  function updateTierLabel(catKey: string, tierKey: string, label: string) {
    setCatalog((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.key === catKey
          ? { ...c, tiers: c.tiers.map((t) => (t.key === tierKey ? { ...t, label } : t)) }
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

  function updateAddonLabel(key: string, label: string) {
    setCatalog((prev) => ({
      ...prev,
      addons: prev.addons.map((a) => (a.key === key ? { ...a, label } : a)),
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

  function updateDeliveryLabel(key: string, label: string) {
    setCatalog((prev) => ({
      ...prev,
      delivery: prev.delivery.map((d) => (d.key === key ? { ...d, label } : d)),
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
                  <TierRow
                    key={tier.key}
                    label={tier.label}
                    price={tier.price}
                    isActive={tier.isActive}
                    onLabelChange={(label) => updateTierLabel(cat.key, tier.key, label)}
                    onPriceChange={(price) => updateTierPrice(cat.key, tier.key, price)}
                    onToggle={() => toggleTier(cat.key, tier.key)}
                    pricePrefix="$"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add-ons */}
      {activeTab === "addons" && (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
            <div>Add-on</div>
            <div>Price</div>
            <div>Status</div>
            <div>Edit</div>
          </div>
          <div className="divide-y divide-border/80">
            {catalog.addons.map((addon) => (
              <TierRow
                key={addon.key}
                label={addon.label}
                price={addon.price}
                isActive={addon.isActive}
                onLabelChange={(label) => updateAddonLabel(addon.key, label)}
                onPriceChange={(price) => updateAddonPrice(addon.key, price)}
                onToggle={() => toggleAddon(addon.key)}
                pricePrefix="$"
              />
            ))}
          </div>
        </div>
      )}

      {/* Delivery */}
      {activeTab === "delivery" && (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
            <div>Speed</div>
            <div>Extra price</div>
            <div>Status</div>
            <div>Edit</div>
          </div>
          <div className="divide-y divide-border/80">
            {catalog.delivery.map((d) => (
              <TierRow
                key={d.key}
                label={d.label}
                subLabel={d.subLabel}
                price={d.extraPrice}
                isActive={d.isActive}
                onLabelChange={(label) => updateDeliveryLabel(d.key, label)}
                onPriceChange={(price) => updateDeliveryPrice(d.key, price)}
                onToggle={() => toggleDelivery(d.key)}
                pricePrefix="+$"
              />
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

function TierRow({
  label,
  subLabel,
  price,
  isActive,
  onLabelChange,
  onPriceChange,
  onToggle,
  pricePrefix,
}: {
  label: string;
  subLabel?: string;
  price: number;
  isActive: boolean;
  onLabelChange: (label: string) => void;
  onPriceChange: (price: number) => void;
  onToggle: () => void;
  pricePrefix: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  function commitEdit() {
    const trimmed = draft.trim();
    if (trimmed) onLabelChange(trimmed);
    else setDraft(label);
    setEditing(false);
  }

  function cancelEdit() {
    setDraft(label);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            type="text"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            className="w-full rounded-xl border border-primary/60 bg-background px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        ) : (
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {subLabel && <p className="text-xs text-muted-foreground/60">{subLabel}</p>}
          </div>
        )}
      </div>
      <PriceInput value={price} prefix={pricePrefix} onChange={onPriceChange} />
      <ActiveToggle active={isActive} onToggle={onToggle} small />
      {editing ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={commitEdit}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 transition hover:bg-emerald-500/20"
          >
            <Check size={13} />
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground transition hover:bg-secondary"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setDraft(label); setEditing(true); }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <Pencil size={13} />
        </button>
      )}
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
