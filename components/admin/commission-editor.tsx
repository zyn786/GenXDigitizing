"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";

type Props = {
  userId: string;
  initialType: "PERCENTAGE" | "FLAT_RATE";
  initialRate: number;
};

export function CommissionEditor({ userId, initialType, initialRate }: Props) {
  const [type, setType] = React.useState<"PERCENTAGE" | "FLAT_RATE">(initialType);
  const [rate, setRate] = React.useState(String(initialRate));
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSave() {
    const rateNum = parseFloat(rate);
    if (isNaN(rateNum) || rateNum < 0) {
      setError("Enter a valid rate.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${userId}/commission`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionType: type, commissionRate: rateNum }),
      });
      if (!res.ok) throw new Error("Failed to save.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      {/* Type toggle */}
      <div>
        <div className="mb-1.5 text-xs text-muted-foreground">Commission type</div>
        <div className="flex rounded-xl border border-border/80 bg-secondary/40 p-1 text-sm">
          {(["PERCENTAGE", "FLAT_RATE"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                type === t
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "PERCENTAGE" ? "% of order value" : "Flat rate per order"}
            </button>
          ))}
        </div>
      </div>

      {/* Rate input */}
      <div>
        <div className="mb-1.5 text-xs text-muted-foreground">
          {type === "PERCENTAGE" ? "Percentage (%)" : "Amount per order ($)"}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {type === "PERCENTAGE" ? "%" : "$"}
            </span>
            <input
              type="number"
              min={0}
              max={type === "PERCENTAGE" ? 100 : undefined}
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="h-9 w-full rounded-full border border-border/80 bg-background pl-7 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <Check className="h-3.5 w-3.5" />
            ) : null}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        {type === "PERCENTAGE"
          ? `Designer earns ${rate || "0"}% of the order's estimated price when it is marked Delivered.`
          : `Designer earns a flat $${rate || "0"} per order when it is marked Delivered.`}
      </p>
    </div>
  );
}
