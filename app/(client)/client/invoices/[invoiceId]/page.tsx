import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConversationLauncherButton } from "@/components/support/conversation-launcher-button";
import { PaymentProofForm } from "@/components/client/payment-proof-form";
import { getCurrencySymbol } from "@/lib/billing/currencies";
import { getClientInvoiceById } from "@/lib/billing/repository";
import { getPaymentAccounts, getClientPaymentProofs } from "@/lib/payments/repository";
import { buildTitle } from "@/lib/site";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function invoiceStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

function invoiceStatusTone(status: string): string {
  switch (status) {
    case "PAID": return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "PARTIALLY_PAID": return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "OVERDUE": return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400";
    case "SENT": return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "CANCELLED": return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400";
    default: return "border-border/60 bg-muted/60 text-muted-foreground";
  }
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type ClientInvoiceDetailPageProps = {
  params: Promise<{ invoiceId: string }>;
};

export async function generateMetadata({ params }: ClientInvoiceDetailPageProps): Promise<Metadata> {
  const { invoiceId } = await params;
  return { title: buildTitle(`Invoice ${invoiceId}`) };
}

export default async function ClientInvoiceDetailPage({ params }: ClientInvoiceDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/invoices");

  const { invoiceId } = await params;

  const [invoice, paymentAccounts, existingProofs] = await Promise.all([
    getClientInvoiceById(session.user.id, invoiceId),
    getPaymentAccounts(true),
    getClientPaymentProofs(session.user.id, invoiceId),
  ]);

  if (!invoice) notFound();

  const symbol = getCurrencySymbol(invoice.currency);
  const isPaid = invoice.status === "PAID";
  const showPaymentSection = !isPaid && invoice.status !== "CANCELLED" && invoice.status !== "DRAFT";

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section>
        <Link
          href={"/client/invoices" as Route}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Invoices
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {invoice.invoiceNumber}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Invoice</h1>
            <p className="mt-1 text-sm text-muted-foreground">{invoice.clientName}</p>
          </div>
          <Badge className={invoiceStatusTone(invoice.status)}>
            {invoiceStatusLabel(invoice.status)}
          </Badge>
        </div>
      </section>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</p>
            <p className="mt-2 text-3xl font-semibold">{symbol}{invoice.total.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Paid</p>
            <p className="mt-2 text-3xl font-semibold">{symbol}{invoice.paidAmount.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Balance</p>
            <p className="mt-2 text-3xl font-semibold">{symbol}{invoice.balanceDue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Due</p>
            <p className="mt-2 text-3xl font-semibold">{invoice.dueDate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Details + Billing info */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline" shape="pill" size="sm">
              <Link href={"/client/invoices" as Route}>Back to invoices</Link>
            </Button>
            <Button asChild variant="default" shape="pill" size="sm">
              <Link href={`/client/orders/${invoice.orderId}` as Route}>View order</Link>
            </Button>
            <ConversationLauncherButton
              mode="client"
              type="INVOICE"
              invoiceId={invoice.id}
              label="Billing chat"
            />
          </CardContent>
        </Card>

        {/* Billing info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Billing Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <p>Email: {invoice.clientEmail}</p>
            {invoice.backupEmail && <p>Backup: {invoice.backupEmail}</p>}
            <p>Currency: {invoice.currency}</p>
            {isPaid && (
              <p className="mt-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Payment confirmed — files are unlocked for download.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {invoice.lineItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="font-medium">{item.label}</p>
              {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
              <p className="mt-2 text-sm text-muted-foreground">
                Qty {item.quantity} · {symbol}{item.unitPrice.toFixed(2)} · Total {symbol}{item.lineTotal.toFixed(2)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Discounts + Payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Discounts</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {invoice.discountLines.length > 0 ? (
              invoice.discountLines.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="mt-1">{item.source} · {item.percentage.toFixed(2)}% · Applied {symbol}{item.appliedAmount.toFixed(2)}</p>
                  {item.approvalNote && <p className="mt-1">{item.approvalNote}</p>}
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">No discounts applied.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {invoice.payments.length > 0 ? (
              invoice.payments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{payment.receiptNumber}</p>
                  <p className="mt-1">{symbol}{payment.amount.toFixed(2)} · {payment.method}</p>
                  <p className="mt-1">Received: {payment.receivedAt}</p>
                  {payment.receiptSentAt && <p className="mt-1">Receipt: {payment.receiptSentAt}</p>}
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">No payments recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment submission */}
      {showPaymentSection && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Submit Payment</CardTitle>
            <CardDescription>
              Pay using one of the methods below, then upload a screenshot of your receipt. Files unlock once payment is verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentProofForm
              invoiceId={invoice.id}
              invoiceTotal={invoice.balanceDue}
              currency={invoice.currency}
              paymentAccounts={paymentAccounts}
              existingProofs={existingProofs.map((p) => ({
                id: p.id,
                status: p.status,
                amountClaimed: p.amountClaimed,
                clientNotes: p.clientNotes,
                rejectionReason: p.rejectionReason,
                submittedAt: p.submittedAt,
                paymentAccountName: p.paymentAccountName,
              }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
