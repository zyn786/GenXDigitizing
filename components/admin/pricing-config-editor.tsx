"use client";

import * as React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

type ConfigRecord = { key: string; value: string; label?: string | null; description?: string | null };
type BulkRule = { id?: string; minQty: number; discountPercent: number; label?: string; isActive: boolean };

const DEFAULT_CONFIGS: ConfigRecord[] = [
  { key: "stitch_rate_per_1000", value: "1.00", label: "Stitch rate per 1,000 stitches ($)", description: "Base rate used when client provides stitch count. 1,000 stitches = $1.00 by default." },
  { key: "stitch_pricing_enabled", value: "true", label: "Enable stitch-count pricing", description: "When enabled and client provides stitch count, uses stitch-plan pricing instead of size-based." },
  { key: "free_first_design_enabled", value: "true", label: "Free first design for new clients", description: "When enabled, the first order from a new client is free." },
  { key: "puff_jacket_back_base_price", value: "35.00", label: "3D Puff Jacket Back base price ($)", description: "Flat rate for 3D Puff Jacket Back — treated as a separate premium service." },
];

export function PricingConfigEditor() {
  const [configs, setConfigs] = React.useState<ConfigRecord[]>(DEFAULT_CONFIGS);
  const [bulkRules, setBulkRules] = React.useState<BulkRule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [newRule, setNewRule] = React.useState<Partial<BulkRule>>({ minQty: 5, discountPercent: 5, isActive: true });

  React.useEffect(() => {
    Promise.all([
      fetch("/api/admin/pricing-config").then((r) => r.json()),
      fetch("/api/admin/bulk-discounts").then((r) => r.json()),
    ]).then(([confData, ruleData]) => {
      if (confData.ok && confData.records?.length) {
        const merged = DEFAULT_CONFIGS.map((def) => {
          const found = confData.records.find((r: ConfigRecord) => r.key === def.key);
          return found ? { ...def, ...found } : def;
        });
        setConfigs(merged);
      }
      if (ruleData.ok) setBulkRules(ruleData.rules ?? []);
      setLoading(false);
    });
  }, []);

  function updateConfig(key: string, value: string) {
    setConfigs((prev) => prev.map((c) => (c.key === key ? { ...c, value } : c)));
  }

  async function saveConfigs() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/pricing-config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ configs }),
    });
    const data = await res.json();
    setMessage(data.message ?? (data.ok ? "Saved." : "Error saving."));
    setSaving(false);
  }

  async function addBulkRule() {
    if (!newRule.minQty || newRule.discountPercent === undefined) return;
    const res = await fetch("/api/admin/bulk-discounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(newRule),
    });
    const data = await res.json();
    if (data.ok) {
      setBulkRules((prev) => [...prev, data.rule].sort((a, b) => a.minQty - b.minQty));
      setNewRule({ minQty: 5, discountPercent: 5, isActive: true });
    }
  }

  async function deleteBulkRule(id: string) {
    await fetch("/api/admin/bulk-discounts", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBulkRules((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading pricing config…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Global pricing settings */}
      <section className="rounded-[1.75rem] border border-border/80 bg-card p-6">
        <h3 className="font-semibold">Pricing Settings</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Controls stitch-plan pricing, free first design, and special service rates.
        </p>

        <div className="mt-5 space-y-4">
          {configs.map((c) => (
            <div key={c.key} className="grid gap-1.5">
              <label className="text-sm font-medium">{c.label ?? c.key}</label>
              {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
              {c.value === "true" || c.value === "false" ? (
                <select
                  value={c.value}
                  onChange={(e) => updateConfig(c.key, e.target.value)}
                  className="h-10 w-48 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : (
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={c.value}
                  onChange={(e) => updateConfig(c.key, e.target.value)}
                  className="h-10 w-48 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={saveConfigs}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Settings
          </button>
          {message && <span className="text-sm text-muted-foreground">{message}</span>}
        </div>
      </section>

      {/* Bulk discount rules */}
      <section className="rounded-[1.75rem] border border-border/80 bg-card p-6">
        <h3 className="font-semibold">Bulk Discount Rules</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Auto-applied discounts based on order quantity. Stacks: the highest matching rule wins.
        </p>

        <div className="mt-5 space-y-2">
          {bulkRules.length === 0 && (
            <p className="text-sm text-muted-foreground">No bulk discount rules. Add one below.</p>
          )}
          {bulkRules.map((rule) => (
            <div key={rule.id ?? rule.minQty} className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <div className="flex-1">
                <span className="font-medium">{rule.minQty}+ items</span>
                <span className="ml-2 text-sm text-muted-foreground">→ {rule.discountPercent}% off</span>
                {rule.label && <span className="ml-2 text-xs text-muted-foreground">({rule.label})</span>}
              </div>
              <div className={`text-xs font-medium ${rule.isActive ? "text-emerald-500" : "text-muted-foreground"}`}>
                {rule.isActive ? "Active" : "Inactive"}
              </div>
              {rule.id && (
                <button
                  onClick={() => deleteBulkRule(rule.id!)}
                  className="text-muted-foreground hover:text-destructive transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-border/60 bg-background/30 p-4">
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Min quantity</label>
            <input
              type="number" min={1}
              value={newRule.minQty ?? ""}
              onChange={(e) => setNewRule((p) => ({ ...p, minQty: Number(e.target.value) }))}
              className="h-10 w-28 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ring"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Discount %</label>
            <input
              type="number" min={0} max={100} step={0.5}
              value={newRule.discountPercent ?? ""}
              onChange={(e) => setNewRule((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
              className="h-10 w-28 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ring"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Label (optional)</label>
            <input
              type="text"
              value={newRule.label ?? ""}
              onChange={(e) => setNewRule((p) => ({ ...p, label: e.target.value }))}
              placeholder="e.g. Small batch"
              className="h-10 w-36 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ring"
            />
          </div>
          <button
            onClick={addBulkRule}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Rule
          </button>
        </div>
      </section>

      {/* Order rules display */}
      <section className="rounded-[1.75rem] border border-border/80 bg-card p-6">
        <h3 className="font-semibold">Order Rules Reference</h3>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> LC to LC same-size adjustment &amp; color change are <strong>free</strong></li>
          <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">!</span> Changing from Left Chest to Jacket Back counts as a <strong>new design / new order</strong></li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Free first design: controlled by the setting above</li>
          <li className="flex items-start gap-2"><span className="text-indigo-500 mt-0.5">★</span> 3D Puff Jacket Back is a <strong>separate premium service</strong> — flat rate, not standard 3D Puff pricing</li>
          <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">$</span> Stitch-plan pricing: 1,000 stitches = $1.00 (admin-adjustable rate above)</li>
        </ul>
      </section>
    </div>
  );
}
