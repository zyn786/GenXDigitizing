"use client";

import * as React from "react";
import { Search, Loader2, CheckCircle2, Clock, Wrench, PackageCheck, XCircle, RefreshCw } from "lucide-react";

type OrderData = {
  id: string;
  orderNumber: string;
  title: string;
  serviceType: string;
  status: string;
  proofStatus: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
  progressPercent: number;
  revisionCount: number;
};

const SERVICE_LABELS: Record<string, string> = {
  EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
  VECTOR_ART: "Vector Art",
  COLOR_SEPARATION_DTF: "Color Separation / DTF",
  CUSTOM_PATCHES: "Custom Patches",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SUBMITTED:           { label: "Submitted",            color: "text-blue-300   border-blue-400/20   bg-blue-500/10",     icon: <Clock className="h-4 w-4" /> },
  UNDER_REVIEW:        { label: "Under review",         color: "text-sky-300    border-sky-400/20    bg-sky-500/10",      icon: <Search className="h-4 w-4" /> },
  ASSIGNED_TO_DESIGNER:{ label: "Assigned to designer", color: "text-indigo-300 border-indigo-400/20 bg-indigo-500/10",  icon: <Wrench className="h-4 w-4" /> },
  IN_PROGRESS:         { label: "In progress",          color: "text-amber-300  border-amber-400/20  bg-amber-500/10",   icon: <Wrench className="h-4 w-4" /> },
  PROOF_READY:         { label: "Proof ready",          color: "text-violet-300 border-violet-400/20 bg-violet-500/10",  icon: <PackageCheck className="h-4 w-4" /> },
  REVISION_REQUESTED:  { label: "Revision requested",   color: "text-fuchsia-300 border-fuchsia-400/20 bg-fuchsia-500/10", icon: <RefreshCw className="h-4 w-4" /> },
  APPROVED:            { label: "Approved",             color: "text-emerald-300 border-emerald-400/20 bg-emerald-500/10", icon: <CheckCircle2 className="h-4 w-4" /> },
  DELIVERED:           { label: "Delivered",            color: "text-teal-300   border-teal-400/20   bg-teal-500/10",    icon: <CheckCircle2 className="h-4 w-4" /> },
  CLOSED:              { label: "Closed",               color: "text-teal-300   border-teal-400/20   bg-teal-500/10",    icon: <CheckCircle2 className="h-4 w-4" /> },
  CANCELLED:           { label: "Cancelled",            color: "text-red-300    border-red-400/20    bg-red-500/10",     icon: <XCircle className="h-4 w-4" /> },
};

const PROOF_LABELS: Record<string, string> = {
  NOT_UPLOADED:              "Awaiting proof",
  UPLOADED:                  "Proof uploaded",
  INTERNAL_REVIEW:           "Internal review",
  PENDING_ADMIN_PROOF_REVIEW:"Pending review",
  PROOF_APPROVED_BY_ADMIN:   "Proof approved",
  PROOF_REJECTED_BY_ADMIN:   "Proof under revision",
  SENT_TO_CLIENT:            "Proof sent to you",
  CLIENT_REVIEWING:          "Awaiting your review",
  CLIENT_APPROVED:           "You approved the proof",
  REVISION_REQUESTED:        "Revision in progress",
};

const inp = "h-12 w-full rounded-2xl border border-white/[0.12] bg-white/[0.06] px-4 text-sm text-white outline-none placeholder:text-white/60 focus:border-indigo-400/40 focus:bg-white/[0.10] transition-all";

type Props = { initialNumber: string; initialEmail: string };

export function OrderStatusLookup({ initialNumber, initialEmail }: Props) {
  const [number, setNumber] = React.useState(initialNumber);
  const [email,  setEmail]  = React.useState(initialEmail);
  const [loading, setLoading] = React.useState(false);
  const [error,   setError]   = React.useState("");
  const [order,   setOrder]   = React.useState<OrderData | null>(null);

  // Auto-lookup if both params provided via URL
  const autoLookedUp = React.useRef(false);
  React.useEffect(() => {
    if (!autoLookedUp.current && initialNumber && initialEmail) {
      autoLookedUp.current = true;
      void lookup(initialNumber, initialEmail);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lookup(num: string, em: string) {
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(
        `/api/public/order-status?number=${encodeURIComponent(num.trim().toUpperCase())}&email=${encodeURIComponent(em.trim())}`,
      );
      const data = await res.json() as { ok: boolean; message?: string; order?: OrderData };
      if (!data.ok || !data.order) {
        setError(data.message ?? "Order not found.");
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!number.trim() || !email.trim()) {
      setError("Both order number and email are required.");
      return;
    }
    void lookup(number, email);
  }

  const cfg = order ? (STATUS_CONFIG[order.status] ?? { label: order.status, color: "text-white/60 border-white/20 bg-white/5", icon: <Clock className="h-4 w-4" /> }) : null;

  return (
    <div className="rounded-[2rem] border border-white/[0.10] bg-white/[0.04] p-6 backdrop-blur-sm">
      {/* Lookup form */}
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-1.5 text-sm text-white/70">
          Order number
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="GX-XXXXXXXX-XXXX"
            className={inp}
            disabled={loading}
          />
        </label>
        <label className="grid gap-1.5 text-sm text-white/70">
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inp}
            disabled={loading}
          />
        </label>

        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-500 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(99,102,241,0.30)] transition hover:bg-indigo-400 disabled:opacity-60"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Looking up…</>
          ) : (
            <><Search className="h-4 w-4" /> Track order</>
          )}
        </button>
      </form>

      {/* Result */}
      {order && cfg && (
        <div className="mt-6 grid gap-4 border-t border-white/[0.08] pt-6">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
                Order
              </div>
              <div className="mt-0.5 font-mono text-lg font-bold text-white">
                {order.orderNumber}
              </div>
              <div className="mt-1 text-sm text-white/60">{order.title}</div>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}
            </span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-white/65">
              <span>Progress</span>
              <span>{order.progressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.08]">
              <div
                className="h-2 rounded-full bg-indigo-500 transition-all"
                style={{ width: `${Math.max(4, Math.min(order.progressPercent, 100))}%` }}
              />
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Service",   value: SERVICE_LABELS[order.serviceType] ?? order.serviceType },
              { label: "Quantity",  value: String(order.quantity) },
              { label: "Revisions", value: String(order.revisionCount) },
              { label: "Proof",     value: PROOF_LABELS[order.proofStatus] ?? order.proofStatus },
              { label: "Submitted", value: new Date(order.createdAt).toLocaleDateString() },
              {
                label: "Last update",
                value: new Date(order.updatedAt).toLocaleDateString(),
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">{label}</div>
                <div className="mt-1 text-sm font-medium text-white/80">{value}</div>
              </div>
            ))}
          </div>

          {order.deliveredAt && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-300">
              Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
            </div>
          )}

          <p className="text-center text-xs text-white/60">
            Want full access to proofs and files?{" "}
            <a href="/register" className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition">
              Create your account
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
