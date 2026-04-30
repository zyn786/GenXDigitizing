"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, DollarSign, Send, Save, RotateCcw } from "lucide-react";
import type { QuoteStatus } from "@/lib/workflow/types";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

interface Props {
  orderId: string;
  quoteStatus: QuoteStatus | null;
  quotedAmount: number | null;
  quoteCurrency: string | null;
  internalNotes: string | null;
  clientMessage: string | null;
  pricedAt: string | null;
  pricedByName: string | null;
  clientRespondedAt: string | null;
  quoteRejectionReason: string | null;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function QuotePricePanel(props: Props) {
  const router = useRouter();

  const status = props.quoteStatus ?? "NEW";

  const [editing, setEditing] = useState(
    status === "NEW" || status === "UNDER_REVIEW"
  );

  const [amount, setAmount] = useState(props.quotedAmount?.toString() ?? "");
  const [currency, setCurrency] = useState(props.quoteCurrency ?? "USD");
  const [internalNotes, setInternalNotes] = useState(props.internalNotes ?? "");
  const [clientMessage, setClientMessage] = useState(props.clientMessage ?? "");

  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function callPatch(action: string, extra?: Record<string, unknown>) {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quotes/${props.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
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
      setPending(null);
    }
  }

  async function handleConvert() {
    setPending("convert");
    setError(null);
    try {
      const res = await fetch(`/api/admin/quotes/${props.orderId}`, { method: "POST" });
      const json = await res.json() as { ok: boolean; message?: string };
      if (!json.ok) {
        setError(json.message ?? "Conversion failed.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setPending(null);
    }
  }

  function handleSaveOrSend(action: "save" | "send") {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Enter a valid quoted amount.");
      return;
    }
    callPatch(action, {
      quotedAmount: parseFloat(amount),
      quoteCurrency: currency,
      internalNotes: internalNotes || null,
      clientMessage: clientMessage || null,
    });
  }

  if (status === "CONVERTED_TO_ORDER") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
        This quote has been converted to an active order.
      </div>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
        This quote was cancelled.
      </div>
    );
  }

  if (status === "CLIENT_ACCEPTED") {
    return (
      <div className="grid gap-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">Client accepted this quote</span>
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
            <div>
              Amount:{" "}
              <span className="font-semibold text-foreground">
                {props.quoteCurrency ?? "USD"} {props.quotedAmount?.toFixed(2) ?? "—"}
              </span>
            </div>
            <div>Responded: {fmt(props.clientRespondedAt)}</div>
          </div>
        </div>

        <button
          type="button"
          disabled={pending !== null}
          onClick={handleConvert}
          className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {pending === "convert" ? "Converting…" : "Convert to active order"}
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (status === "CLIENT_REJECTED") {
    return (
      <div className="grid gap-3">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">Client declined this quote</span>
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
            {props.quoteRejectionReason && (
              <div>Reason: <span className="italic">{props.quoteRejectionReason}</span></div>
            )}
            <div>Responded: {fmt(props.clientRespondedAt)}</div>
          </div>
        </div>

        {editing ? (
          <QuoteForm
            amount={amount} setAmount={setAmount}
            currency={currency} setCurrency={setCurrency}
            internalNotes={internalNotes} setInternalNotes={setInternalNotes}
            clientMessage={clientMessage} setClientMessage={setClientMessage}
            pending={pending}
            onSave={() => handleSaveOrSend("save")}
            onSend={() => handleSaveOrSend("send")}
            onCancel={() => setEditing(false)}
            showCancel
          />
        ) : (
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Revise &amp; resend
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => callPatch("cancel")}
              className="inline-flex h-9 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-4 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {pending === "cancel" ? "Cancelling…" : "Cancel quote"}
            </button>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (status === "PRICE_SENT" && !editing) {
    return (
      <div className="grid gap-3">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2 text-blue-400">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">Awaiting client response</span>
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
            <div>
              Sent:{" "}
              <span className="font-medium text-foreground">
                {props.quoteCurrency ?? "USD"} {props.quotedAmount?.toFixed(2) ?? "—"}
              </span>
            </div>
            {props.pricedByName && <div>By: {props.pricedByName}</div>}
            <div>Sent at: {fmt(props.pricedAt)}</div>
            {props.clientMessage && (
              <div className="mt-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 italic">
                &ldquo;{props.clientMessage}&rdquo;
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Edit &amp; resend
          </button>
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => callPatch("cancel")}
            className="inline-flex h-9 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-4 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {pending === "cancel" ? "Cancelling…" : "Cancel quote"}
          </button>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  // Edit form — NEW, UNDER_REVIEW, or editing from another state
  return (
    <div className="grid gap-3">
      {status === "NEW" && (
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => callPatch("mark_under_review")}
          className="inline-flex h-8 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50"
        >
          {pending === "mark_under_review" ? "Saving…" : "Mark as Under Review"}
        </button>
      )}

      <QuoteForm
        amount={amount} setAmount={setAmount}
        currency={currency} setCurrency={setCurrency}
        internalNotes={internalNotes} setInternalNotes={setInternalNotes}
        clientMessage={clientMessage} setClientMessage={setClientMessage}
        pending={pending}
        onSave={() => handleSaveOrSend("save")}
        onSend={() => handleSaveOrSend("send")}
        onCancel={status === "PRICE_SENT" ? () => setEditing(false) : undefined}
        showCancel={status === "PRICE_SENT"}
      />

      <button
        type="button"
        disabled={pending !== null}
        onClick={() => callPatch("cancel")}
        className="inline-flex h-9 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-4 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
      >
        {pending === "cancel" ? "Cancelling…" : "Cancel quote"}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function QuoteForm({
  amount, setAmount,
  currency, setCurrency,
  internalNotes, setInternalNotes,
  clientMessage, setClientMessage,
  pending,
  onSave,
  onSend,
  onCancel,
  showCancel,
}: {
  amount: string;
  setAmount: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  internalNotes: string;
  setInternalNotes: (v: string) => void;
  clientMessage: string;
  setClientMessage: (v: string) => void;
  pending: string | null;
  onSave: () => void;
  onSend: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}) {
  return (
    <div className="grid gap-3">
      {/* Price row */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Quoted amount
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-9 w-full rounded-xl border border-border/80 bg-secondary/40 pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-9 rounded-xl border border-border/80 bg-secondary/40 px-3 text-sm outline-none focus:border-primary"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Internal notes */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Internal notes{" "}
          <span className="text-[10px] text-muted-foreground/60">(not visible to client)</span>
        </label>
        <textarea
          rows={3}
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          placeholder="Pricing rationale, complexity notes…"
          className="w-full rounded-xl border border-border/80 bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Client message */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Message to client{" "}
          <span className="text-[10px] text-muted-foreground/60">(optional, sent with price)</span>
        </label>
        <textarea
          rows={3}
          value={clientMessage}
          onChange={(e) => setClientMessage(e.target.value)}
          placeholder="Hi, we've reviewed your design and…"
          className="w-full rounded-xl border border-border/80 bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={onSave}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {pending === "save" ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={onSend}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {pending === "send" ? "Sending…" : "Send price to client"}
        </button>
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
          >
            Discard changes
          </button>
        )}
      </div>
    </div>
  );
}
