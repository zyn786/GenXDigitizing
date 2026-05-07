"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

type Props = {
  invoiceId: string;
  userRole: string;
};

export function InvoiceActions({ invoiceId, userRole }: Props) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const canManage = userRole === "SUPER_ADMIN" || userRole === "MANAGER";

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-border/80 bg-secondary/80 p-4 text-sm text-muted-foreground">
        Billing actions are restricted to Super Admin and Manager roles.
      </div>
    );
  }

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Failed to send invoice.");
      } else {
        setSent(true);
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-3">
      {sent && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
          Invoice sent successfully.
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}
      <button
        type="button"
        disabled={sending}
        onClick={handleSend}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send invoice to client
          </>
        )}
      </button>
      <p className="text-xs text-muted-foreground">
        Invoice line editing, discount lines, and manual payment recording are available on the billing audit page.
      </p>
    </div>
  );
}
