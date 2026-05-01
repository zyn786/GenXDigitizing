import Link from "next/link";
import type { Route } from "next";
import { Lock, CreditCard, CheckCircle } from "lucide-react";
import type { OrderPaymentStatus, ProofStatus } from "@/lib/workflow/types";

export function PaymentGatePanel({
  proofStatus,
  paymentStatus,
  invoiceId,
  invoiceNumber,
  invoiceStatus,
  filesUnlocked,
  orderId,
}: {
  proofStatus: ProofStatus;
  paymentStatus: OrderPaymentStatus;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  filesUnlocked: boolean;
  orderId: string;
}) {
  if (filesUnlocked || paymentStatus === "PAID") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">Payment confirmed — files unlocked</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Your payment has been verified. Download your files above.
        </p>
      </div>
    );
  }

  if (proofStatus !== "CLIENT_APPROVED") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-white/40" />
          <span className="text-sm font-medium text-white/60">Payment — available after proof approval</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Once you approve your proof, your invoice will appear here for payment.
        </p>
      </div>
    );
  }

  if (!invoiceId) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-300">Payment pending invoice</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          You've approved the proof. Our team is preparing your invoice — it will appear here shortly.
        </p>
      </div>
    );
  }

  const isRejected = paymentStatus === "REJECTED";

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 grid gap-3">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-medium text-amber-300">Payment required</span>
      </div>

      {isRejected && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
          Your previous payment submission was rejected. Please review and resubmit.
        </div>
      )}

      <div className="grid gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Invoice</span>
          <span className="font-medium">{invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="capitalize">{invoiceStatus?.toLowerCase().replace(/_/g, " ")}</span>
        </div>
      </div>

      <Link
        href={`/client/invoices/${invoiceId}` as Route}
        className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
      >
        View invoice &amp; pay
      </Link>
    </div>
  );
}
