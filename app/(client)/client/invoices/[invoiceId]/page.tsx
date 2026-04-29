import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { ConversationLauncherButton } from "@/components/support/conversation-launcher-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentProofForm } from "@/components/client/payment-proof-form";
import { getCurrencySymbol } from "@/lib/billing/currencies";
import { getClientInvoiceById } from "@/lib/billing/repository";
import { getPaymentAccounts, getClientPaymentProofs } from "@/lib/payments/repository";
import { buildTitle } from "@/lib/site";

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

  const currency = getCurrencySymbol(invoice.currency);
  const invoicesHref = "/client/invoices" as Route;
  const orderHref = `/client/orders/${invoice.orderId}` as Route;

  const isPaid = invoice.status === "PAID";
  const showPaymentSection = !isPaid && invoice.status !== "CANCELLED" && invoice.status !== "DRAFT";

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardDescription>{invoice.invoiceNumber}</CardDescription>
            <CardTitle className="text-4xl tracking-tight">Invoice detail</CardTitle>
            <div className="text-sm text-muted-foreground">
              {invoice.clientName} · {invoice.status.replaceAll("_", " ").toLowerCase()}
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="Total" value={`${currency}${invoice.total.toFixed(2)}`} />
              <Metric label="Paid" value={`${currency}${invoice.paidAmount.toFixed(2)}`} />
              <Metric label="Balance" value={`${currency}${invoice.balanceDue.toFixed(2)}`} />
              <Metric label="Due" value={invoice.dueDate} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={invoicesHref}
                className="inline-flex h-11 items-center rounded-full border border-border/80 bg-card/70 px-5 text-sm font-medium transition hover:bg-card"
              >
                Back to invoices
              </Link>
              <Link
                href={orderHref}
                className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-95"
              >
                Open linked order
              </Link>
              <ConversationLauncherButton
                mode="client"
                type="INVOICE"
                invoiceId={invoice.id}
                label="Open billing chat"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing summary</CardTitle>
            <CardDescription>
              Totals, payments, discounts, and receipts remain connected.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div>Client email: {invoice.clientEmail}</div>
            <div>Backup email: {invoice.backupEmail ?? "Not set"}</div>
            <div>Currency: {invoice.currency}</div>
            <div>Status: {invoice.status.replaceAll("_", " ")}</div>
            {isPaid && (
              <div className="mt-1 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400">
                Payment confirmed — files are unlocked for download.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {invoice.lineItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border/80 bg-secondary/80 p-4">
              <div className="font-medium">{item.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {item.description ?? "No description"}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Qty {item.quantity} · {currency}{item.unitPrice.toFixed(2)} · Total {currency}{item.lineTotal.toFixed(2)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Discount lines</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {invoice.discountLines.length ? (
              invoice.discountLines.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/80 bg-secondary/80 p-4 text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">{item.label}</div>
                  <div className="mt-1">
                    {item.source} · {item.percentage.toFixed(2)}% · Applied {currency}{item.appliedAmount.toFixed(2)}
                  </div>
                  <div className="mt-1">{item.approvalNote ?? "No approval note"}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border/80 bg-secondary/80 p-4 text-sm text-muted-foreground">
                No discount lines on this invoice.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment history</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {invoice.payments.length ? (
              invoice.payments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-border/80 bg-secondary/80 p-4 text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">{payment.receiptNumber}</div>
                  <div className="mt-1">{currency}{payment.amount.toFixed(2)} · {payment.method}</div>
                  <div className="mt-1">Received: {payment.receivedAt}</div>
                  <div className="mt-1">Receipt sent: {payment.receiptSentAt ?? "Pending"}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border/80 bg-secondary/80 p-4 text-sm text-muted-foreground">
                No payments recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showPaymentSection && (
        <Card>
          <CardHeader>
            <CardTitle>Submit payment</CardTitle>
            <CardDescription>
              Pay using one of the methods below, then upload a screenshot or photo of
              your payment receipt. Your files will be unlocked once we verify it.
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-secondary/80 p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  );
}
