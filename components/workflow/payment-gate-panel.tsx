import Link from "next/link";
import type { Route } from "next";
import { Lock, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderPaymentStatus, ProofStatus } from "@/lib/workflow/types";

export function PaymentGatePanel({
  proofStatus, paymentStatus, invoiceId, invoiceNumber, invoiceStatus, filesUnlocked,
}: {
  proofStatus: ProofStatus; paymentStatus: OrderPaymentStatus;
  invoiceId: string | null; invoiceNumber: string | null; invoiceStatus: string | null; filesUnlocked: boolean;
}) {
  if (filesUnlocked || paymentStatus === "PAID") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4">
        <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /><span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Payment confirmed — files unlocked</span></div>
        <p className="mt-1 text-xs text-muted-foreground">Your payment has been verified. Download your files above.</p>
      </div>
    );
  }
  if (proofStatus !== "CLIENT_APPROVED") {
    return (
      <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-4">
        <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Payment — available after proof approval</span></div>
        <p className="mt-1 text-xs text-muted-foreground">Once you approve your proof, your invoice will appear here for payment.</p>
      </div>
    );
  }
  if (!invoiceId) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4">
        <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-amber-500" /><span className="text-sm font-medium text-amber-600 dark:text-amber-400">Payment pending invoice</span></div>
        <p className="mt-1 text-xs text-muted-foreground">You&rsquo;ve approved the proof. Our team is preparing your invoice — it will appear here shortly.</p>
      </div>
    );
  }
  const isRejected = paymentStatus === "REJECTED";
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 grid gap-3">
      <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-amber-500" /><span className="text-sm font-medium text-amber-600 dark:text-amber-400">Payment required</span></div>
      {isRejected && <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">Your previous payment submission was rejected. Please review and resubmit.</div>}
      <div className="grid gap-1 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Invoice</span><span className="font-medium">{invoiceNumber}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="capitalize">{invoiceStatus?.toLowerCase().replace(/_/g, " ")}</span></div>
      </div>
      <Button asChild variant="default" shape="pill" size="sm"><Link href={`/client/invoices/${invoiceId}` as Route}>View invoice & pay</Link></Button>
    </div>
  );
}
