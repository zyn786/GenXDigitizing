import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { ConversationLauncherButton } from "@/components/support/conversation-launcher-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminFileDownloadButton } from "@/components/admin/admin-file-download-button";
import { getCurrencySymbol } from "@/lib/billing/currencies";
import { getAdminInvoiceById } from "@/lib/billing/repository";
import { getOrderFiles } from "@/lib/payments/repository";
import { buildTitle } from "@/lib/site";
import { prisma } from "@/lib/db";

type AdminInvoiceDetailPageProps = {
  params: Promise<{ invoiceId: string }>;
};

export async function generateMetadata({ params }: AdminInvoiceDetailPageProps): Promise<Metadata> {
  const { invoiceId } = await params;
  return { title: buildTitle(`Admin Invoice ${invoiceId}`) };
}

const PROOF_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-400 bg-amber-500/10",
  APPROVED: "text-emerald-400 bg-emerald-500/10",
  REJECTED: "text-red-400 bg-red-500/10",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminInvoiceDetailPage({ params }: AdminInvoiceDetailPageProps) {
  const { invoiceId } = await params;
  const invoice = await getAdminInvoiceById(invoiceId);

  if (!invoice) notFound();

  const currency = getCurrencySymbol(invoice.currency);
  const invoicesHref = "/admin/invoices" as Route;
  const orderHref = `/admin/orders/${invoice.orderId}` as Route;
  const paymentProofsHref = "/admin/payment-proofs" as Route;

  const [invoiceProofs, orderFiles, dbInvoice] = await Promise.all([
    prisma.paymentProofSubmission.findMany({
      where: { invoiceId },
      include: {
        clientUser: { select: { name: true } },
        paymentAccount: { select: { displayName: true } },
        reviewedBy: { select: { name: true } },
      },
      orderBy: { submittedAt: "desc" },
    }),
    getOrderFiles(invoice.orderId),
    prisma.invoice.findUnique({ where: { id: invoiceId }, select: { filesUnlocked: true } }),
  ]);

  const filesUnlocked = dbInvoice?.filesUnlocked ?? false;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardDescription>{invoice.invoiceNumber}</CardDescription>
            <CardTitle className="text-4xl tracking-tight">Billing detail</CardTitle>
            <div className="text-sm text-muted-foreground">
              {invoice.clientName} · {invoice.status.replaceAll("_", " ").toLowerCase()}
              {filesUnlocked && (
                <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                  Files unlocked
                </span>
              )}
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
                mode="admin"
                type="INVOICE"
                invoiceId={invoice.id}
                label="Open billing chat"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin actions</CardTitle>
            <CardDescription>Billing edits, payments, and invoice send actions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Edit invoice lines",
              "Add percentage discount line",
              "Record partial payment",
              "Send invoice email",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border/80 bg-secondary/80 p-4 text-sm text-muted-foreground"
              >
                {item}
              </div>
            ))}
            <Link
              href={paymentProofsHref}
              className="rounded-2xl border border-border/80 bg-secondary/80 p-4 text-sm text-muted-foreground transition hover:bg-secondary"
            >
              Review payment proofs →
            </Link>
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
              <div className="mt-1 text-sm text-muted-foreground">{item.description ?? "No description"}</div>
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
                  <div className="mt-1">{item.source} · {item.percentage.toFixed(2)}% · Applied {currency}{item.appliedAmount.toFixed(2)}</div>
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
                  <div className="mt-1">Reference: {payment.reference ?? "N/A"}</div>
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

      <Card>
        <CardHeader>
          <CardTitle>
            Payment proof submissions
            {invoiceProofs.filter((p) => p.status === "PENDING").length > 0 && (
              <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-sm text-amber-400">
                {invoiceProofs.filter((p) => p.status === "PENDING").length} pending
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Payment screenshots submitted by the client for this invoice.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {invoiceProofs.length ? (
            invoiceProofs.map((proof) => (
              <div key={proof.id} className="rounded-2xl border border-border/80 bg-secondary/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">
                      {proof.clientUser?.name ?? "Client"} · ${Number(proof.amountClaimed).toFixed(2)}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      via {proof.paymentAccount?.displayName ?? "Unknown"} · {new Date(proof.submittedAt).toLocaleString()}
                    </div>
                    {proof.clientNotes && (
                      <div className="mt-1 text-xs text-muted-foreground">{proof.clientNotes}</div>
                    )}
                    {proof.rejectionReason && (
                      <div className="mt-1 text-xs text-red-400">Rejected: {proof.rejectionReason}</div>
                    )}
                    {proof.reviewedBy && proof.reviewedAt && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Reviewed by {proof.reviewedBy.name} · {new Date(proof.reviewedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PROOF_STATUS_COLORS[proof.status] ?? ""}`}>
                      {proof.status}
                    </span>
                    <Link
                      href={paymentProofsHref}
                      className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-secondary"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-border/80 bg-secondary/80 p-4 text-sm text-muted-foreground">
              No payment proofs submitted yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order files</CardTitle>
          <CardDescription>
            Files uploaded by designers.{" "}
            {filesUnlocked
              ? "Files are unlocked — client can download."
              : "Files are locked until payment is approved."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {orderFiles.length ? (
            orderFiles.map((file) => (
              <div key={file.id} className="rounded-2xl border border-border/80 bg-secondary/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{file.fileName}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {formatBytes(file.sizeBytes)} · {file.mimeType}
                      {file.uploadedByName && ` · uploaded by ${file.uploadedByName}`}
                    </div>
                  </div>
                  <AdminFileDownloadButton fileId={file.id} fileName={file.fileName} />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-border/80 bg-secondary/80 p-4 text-sm text-muted-foreground">
              No files uploaded yet.
            </div>
          )}
        </CardContent>
      </Card>
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

