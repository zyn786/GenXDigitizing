"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Designer = { id: string; name: string | null };

export function DesignerAssignControl({
  orderId,
  currentDesignerId,
  designers,
}: {
  orderId: string;
  currentDesignerId: string | null;
  designers: Designer[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentDesignerId ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = selected !== (currentDesignerId ?? "");

  async function save() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          designerId: selected === "" ? null : selected,
        }),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Something went wrong.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="h-10 rounded-2xl border border-border/80 bg-background px-3 text-sm"
      >
        <option value="">Unassigned</option>
        {designers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name ?? d.id}
          </option>
        ))}
      </select>

      {isDirty && (
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save assignment"}
        </button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
