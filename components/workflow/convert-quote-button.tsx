"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConvertQuoteButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function convert() {
    setConverting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quotes/${orderId}`, {
        method: "POST",
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Conversion failed.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={converting}
        onClick={convert}
        className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {converting ? "Converting…" : "Convert to live order"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Moves the quote to SUBMITTED status and starts the production workflow.
      </p>
    </div>
  );
}
