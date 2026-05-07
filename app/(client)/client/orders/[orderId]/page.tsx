import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, Lock } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConversationLauncherButton } from "@/components/support/conversation-launcher-button";
import { CancelOrderButton } from "@/components/client/cancel-order-button";
import { ClientEditOrderModal } from "@/components/client/client-edit-order-modal";
import { ClientDownloadButton } from "@/components/client/client-download-button";
import { ClientProofReview } from "@/components/workflow/client-proof-review";
import { ClientProofPreview } from "@/components/workflow/client-proof-preview";
import { PaymentGatePanel } from "@/components/workflow/payment-gate-panel";
import { buildTitle } from "@/lib/site";
import { getClientOrder } from "@/lib/workflow/repository";
import { getClientWorkflowStatusLabel, getClientWorkflowStatusTone } from "@/lib/workflow/status";
import { ClientReferenceFilesSection } from "@/components/client/client-reference-files-section";

/* ------------------------------------------------------------------ */
/* Client-friendly helpers                                             */
/* ------------------------------------------------------------------ */

function clientNextAction(
  status: string,
  proofStatus: string,
  paymentStatus: string,
  filesUnlocked: boolean,
): string | null {
  if (status === "CANCELLED") return null;
  if (status === "DELIVERED" || status === "CLOSED" || filesUnlocked) return "Your files are ready to download.";
  if (status === "PROOF_READY") return "Review your proof and approve or request changes.";
  if (status === "REVISION_REQUESTED") return "Your revision is being worked on by our team.";
  if (status === "APPROVED" && paymentStatus === "PAYMENT_PENDING") return "Submit payment proof to unlock your files.";
  if (status === "APPROVED" && paymentStatus === "PAYMENT_SUBMITTED") return "Payment is under review. Files will unlock once approved.";
  if (proofStatus === "PENDING_ADMIN_PROOF_REVIEW" || proofStatus === "INTERNAL_REVIEW") return "Your proof is being reviewed by our team.";
  if (status === "SUBMITTED" || status === "UNDER_REVIEW") return "Your order is being reviewed. We'll assign a designer soon.";
  if (status === "IN_PROGRESS" || status === "ASSIGNED_TO_DESIGNER") return "Your design is in production.";
  return null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type ClientOrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export async function generateMetadata({
  params,
}: ClientOrderDetailPageProps): Promise<Metadata> {
  const { orderId } = await params;
  return { title: buildTitle(`Order ${orderId}`) };
}

export default async function ClientOrderDetailPage({
  params,
}: ClientOrderDetailPageProps) {
  const { orderId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/orders");

  const [order, invoice, rawOrder, referenceFiles] = await Promise.all([
    getClientOrder(orderId, session.user.id),
    prisma.invoice.findFirst({
      where: { orderId },
      select: { id: true, invoiceNumber: true, status: true, filesUnlocked: true },
    }),
    prisma.workflowOrder.findFirst({
      where: { id: orderId, clientUserId: session.user.id },
      select: {
        status: true,
        quoteStatus: true,
        proofStatus: true,
        paymentStatus: true,
        cancelledAt: true,
        cancelReason: true,
        cancelledBy: { select: { name: true } },
        notes: true,
        placement: true,
        fabricType: true,
        designHeightIn: true,
        designWidthIn: true,
        colorQuantity: true,
        specialInstructions: true,
        fileFormats: true,
        trims: true,
        is3dPuffJacketBack: true,
        quantity: true,
        isFreeDesign: true,
        estimatedPrice: true,
        stitchCount: true,
        threadBrand: true,
        colorDetails: true,
      },
    }),
    prisma.clientReferenceFile.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
    }),
  ]);

  if (!order) notFound();

  const statusLabel = getClientWorkflowStatusLabel(order.status);
  const proofStatus = rawOrder?.proofStatus ?? "NOT_UPLOADED";
  const paymentStatus = rawOrder?.paymentStatus ?? "NOT_REQUIRED";
  const filesUnlocked = invoice?.filesUnlocked ?? false;
  const isCancelled = rawOrder?.status === "CANCELLED";
  const canCancel = rawOrder?.status === "SUBMITTED";
  const nextAction = clientNextAction(order.status, proofStatus, paymentStatus, filesUnlocked);

  return (
    <div className="grid gap-6">
      {/* Breadcrumb + Header */}
      <section>
        <Link
          href={"/client/orders" as Route}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          My orders
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {order.reference}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{order.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.serviceLabel}{order.companyName ? ` · ${order.companyName}` : ""}
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium ${getClientWorkflowStatusTone(order.status)}`}>
            {statusLabel}
          </span>
        </div>
      </section>

      {/* Next action banner */}
      {nextAction && !isCancelled && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Next action</p>
              <p className="mt-1 text-sm">{nextAction}</p>
            </div>
            {order.status === "PROOF_READY" && (
              <Button asChild variant="default" shape="pill" size="sm">
                <Link href="#proof-section">Review Proof</Link>
              </Button>
            )}
            {filesUnlocked && (
              <Button asChild variant="default" shape="pill" size="sm">
                <Link href="#files-section">
                  <Download className="h-3.5 w-3.5" />
                  Download Files
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress bar */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
            <p className="text-sm font-medium">{order.progressPercent}%</p>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${Math.max(6, Math.min(order.progressPercent, 100))}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Due" value={order.dueLabel} />
            <Stat label="Revisions" value={String(order.revisionCount)} />
            <Stat label="Priority" value={order.priority} />
            <Stat label="Status" value={statusLabel} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        {/* Main column */}
        <div className="grid gap-4">
          {/* Proof section */}
          {(order.status === "PROOF_READY" ||
            proofStatus === "CLIENT_APPROVED" ||
            proofStatus === "REVISION_REQUESTED" ||
            proofStatus === "PENDING_ADMIN_PROOF_REVIEW") && (
            <Card id="proof-section">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Proof Review</CardTitle>
                <CardDescription>
                  {proofStatus === "PENDING_ADMIN_PROOF_REVIEW"
                    ? "Your proof is being reviewed by our team before it's sent to you."
                    : "Review the proof previews below. Production machine files remain locked until proof approval and payment confirmation."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <ClientProofPreview orderId={order.id} />
                <ClientProofReview
                  orderId={order.id}
                  proofStatus={proofStatus as "NOT_UPLOADED" | "UPLOADED" | "INTERNAL_REVIEW" | "SENT_TO_CLIENT" | "CLIENT_REVIEWING" | "CLIENT_APPROVED" | "REVISION_REQUESTED"}
                  orderStatus={rawOrder?.status ?? order.status}
                />
                {!filesUnlocked && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Final machine files (DST, PES, and others) will be available after proof approval and payment confirmation.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Files section */}
          <Card id="files-section">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery Files</CardTitle>
              <CardDescription>
                {filesUnlocked
                  ? "Your files are ready to download."
                  : "Files will be available once payment is confirmed."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {order.orderFiles.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No files yet. They will appear here once production is complete.
                </p>
              ) : !filesUnlocked ? (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <Lock className="h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-sm text-muted-foreground">
                    Files are locked. {proofStatus !== "CLIENT_APPROVED"
                      ? "Approve your proof to unlock payment and then download."
                      : "Submit payment proof to unlock your files."}
                    {invoice && proofStatus === "CLIENT_APPROVED" && (
                      <>
                        {" "}
                        <Link
                          href={`/client/invoices/${invoice.id}` as Route}
                          className="underline underline-offset-2 hover:text-foreground"
                        >
                          View invoice
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {order.orderFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{file.fileName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatBytes(file.sizeBytes)}
                          {file.uploadedByName ? ` · By ${file.uploadedByName}` : ""}
                        </p>
                      </div>
                      <ClientDownloadButton fileId={file.id} fileName={file.fileName} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reference files */}
          <ClientReferenceFilesSection
            orderId={orderId}
            initialFiles={referenceFiles.map((f) => ({
              ...f,
              createdAt: f.createdAt.toISOString(),
            }))}
          />

          {/* Order specs */}
          <ClientSpecsCard rawOrder={rawOrder} />

          {/* Revision history */}
          {order.orderRevisions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Revision History</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {order.orderRevisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{rev.versionLabel ?? "Revision"}</p>
                      <Badge className="text-[10px]">{rev.status.toLowerCase().replace(/_/g, " ")}</Badge>
                    </div>
                    {rev.clientNotes && (
                      <p className="mt-1 text-xs text-muted-foreground">{rev.clientNotes}</p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Order timeline */}
          {order.events.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Timeline</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {order.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm"
                  >
                    <p className="font-medium">{ev.title}</p>
                    {ev.body && <p className="mt-0.5 text-xs text-muted-foreground">{ev.body}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      {new Date(ev.at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="grid gap-4 self-start">
          {/* Cancellation */}
          {isCancelled && rawOrder?.cancelledAt && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-red-500">Order Cancelled</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Cancelled on</p>
                  <p className="mt-0.5 font-medium">
                    {new Date(rawOrder.cancelledAt).toLocaleString()}
                  </p>
                </div>
                {rawOrder.cancelledBy?.name && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cancelled by</p>
                    <p className="mt-0.5 font-medium">{rawOrder.cancelledBy.name}</p>
                  </div>
                )}
                {rawOrder.cancelReason && (
                  <div>
                    <p className="text-xs text-muted-foreground">Reason</p>
                    <p className="mt-0.5 text-muted-foreground">{rawOrder.cancelReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentGatePanel
                proofStatus={proofStatus as "NOT_UPLOADED" | "UPLOADED" | "INTERNAL_REVIEW" | "SENT_TO_CLIENT" | "CLIENT_REVIEWING" | "CLIENT_APPROVED" | "REVISION_REQUESTED"}
                paymentStatus={paymentStatus as "NOT_REQUIRED" | "PAYMENT_PENDING" | "PAYMENT_SUBMITTED" | "PAYMENT_UNDER_REVIEW" | "PAID" | "PARTIALLY_PAID" | "REJECTED" | "REFUNDED"}
                invoiceId={invoice?.id ?? null}
                invoiceNumber={invoice?.invoiceNumber ?? null}
                invoiceStatus={invoice?.status ?? null}
                filesUnlocked={filesUnlocked}
              />
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <ConversationLauncherButton
                mode="client"
                type="ORDER"
                orderId={order.id}
                label="Chat about this order"
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" shape="pill" size="sm" className="w-full">
                <Link href={"/client/orders" as Route}>Back to orders</Link>
              </Button>
              {rawOrder?.status === "SUBMITTED" && (
                <>
                  <div className="my-1 h-px bg-border/60" />
                  <ClientEditOrderModal
                    orderId={orderId}
                    initialData={{
                      title: order.title,
                      notes: rawOrder.notes ?? null,
                      placement: rawOrder.placement ?? null,
                      fabricType: rawOrder.fabricType ?? null,
                      designHeightIn: rawOrder.designHeightIn != null ? Number(rawOrder.designHeightIn) : null,
                      designWidthIn: rawOrder.designWidthIn != null ? Number(rawOrder.designWidthIn) : null,
                      colorQuantity: rawOrder.colorQuantity ?? null,
                      specialInstructions: rawOrder.specialInstructions ?? null,
                    }}
                    initialFiles={referenceFiles.map((f) => ({
                      ...f,
                      createdAt: f.createdAt.toISOString(),
                    }))}
                  />
                </>
              )}
              {!isCancelled && canCancel && (
                <>
                  <div className="my-1 h-px bg-border/60" />
                  <CancelOrderButton orderId={order.id} />
                </>
              )}
              {!isCancelled && !canCancel && rawOrder?.status !== "SUBMITTED" && (
                <>
                  <div className="my-1 h-px bg-border/60" />
                  <p className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs leading-snug text-muted-foreground">
                    Cancellation is no longer available — this order is already in production.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-2 text-sm">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ClientSpecsCard({ rawOrder }: { rawOrder: Record<string, unknown> | null }) {
  if (!rawOrder) return null;

  const placement = rawOrder.placement as string | null;
  const stitchCount = rawOrder.stitchCount as number | null;
  const fabricType = rawOrder.fabricType as string | null;
  const fileFormats = (rawOrder.fileFormats as string[]) ?? [];
  const colorQuantity = rawOrder.colorQuantity as number | null;
  const threadBrand = rawOrder.threadBrand as string | null;
  const colorDetails = rawOrder.colorDetails as string | null;
  const trims = rawOrder.trims as string | null;
  const is3dPuffJacketBack = rawOrder.is3dPuffJacketBack as boolean;
  const designHeightIn = rawOrder.designHeightIn as number | null;
  const designWidthIn = rawOrder.designWidthIn as number | null;
  const quantity = rawOrder.quantity as number ?? 1;
  const isFreeDesign = rawOrder.isFreeDesign as boolean;
  const estimatedPrice = rawOrder.estimatedPrice != null ? Number(rawOrder.estimatedPrice) : null;
  const specialInstructions = rawOrder.specialInstructions as string | null;
  const hasAnySpec = placement || stitchCount || fabricType || fileFormats.length > 0 ||
    colorQuantity || threadBrand || is3dPuffJacketBack || designHeightIn || designWidthIn;

  if (!hasAnySpec && !specialInstructions) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Order Specs</CardTitle>
        <CardDescription>What you submitted with this order.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-2">
          <Chip label={`Qty: ${quantity}`} />
          {isFreeDesign && <Chip label="Free first design" variant="emerald" />}
          {is3dPuffJacketBack && <Chip label="3D Puff Jacket Back" variant="purple" />}
          {estimatedPrice != null && <Chip label={`Est. $${estimatedPrice.toFixed(2)}`} variant="blue" />}
        </div>

        {hasAnySpec && (
          <div className="divide-y divide-border/60">
            {placement && <SpecRow label="Placement" value={placement} />}
            {(designHeightIn || designWidthIn) && (
              <SpecRow label="Dimensions" value={`${designHeightIn ?? "?"}″ H × ${designWidthIn ?? "?"}″ W`} />
            )}
            {stitchCount && <SpecRow label="Stitch count" value={stitchCount.toLocaleString()} />}
            {fabricType && <SpecRow label="Fabric" value={fabricType} />}
            {fileFormats.length > 0 && <SpecRow label="File formats" value={fileFormats.join(", ")} />}
            {colorQuantity && <SpecRow label="Thread colors" value={String(colorQuantity)} />}
            {threadBrand && <SpecRow label="Thread brand" value={threadBrand} />}
            {colorDetails && <SpecRow label="Color details" value={colorDetails} />}
            {trims && <SpecRow label="Trims" value={trims} />}
          </div>
        )}

        {specialInstructions && (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Special Instructions
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{specialInstructions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Chip({ label, variant = "default" }: { label: string; variant?: "default" | "emerald" | "purple" | "blue" }) {
  const variants = {
    default: "border-border/60 bg-muted/60 text-muted-foreground",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    purple: "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}
