import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ConversationLauncherButton } from "@/components/support/conversation-launcher-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/workflow/order-status-badge";
import { OrderStatusControls } from "@/components/workflow/order-status-controls";
import { DesignerAssignControl } from "@/components/workflow/designer-assign-control";
import { ConvertQuoteButton } from "@/components/workflow/convert-quote-button";
import { OrderFileUploader } from "@/components/admin/order-file-uploader";
import { ProofSendPanel } from "@/components/workflow/proof-send-panel";
import { AdminProofReviewPanel } from "@/components/workflow/admin-proof-review-panel";
import { RevisionManager } from "@/components/workflow/revision-manager";
import { AdminPaymentApproval } from "@/components/workflow/admin-payment-approval";
import { WorkflowTimeline } from "@/components/workflow/workflow-timeline";
import { buildTitle } from "@/lib/site";
import { getAdminOrder } from "@/lib/workflow/repository";
import type { OrderProduction } from "@/lib/workflow/types";
import { ReferenceFilesViewer } from "@/components/shared/reference-files-viewer";

type AdminOrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export async function generateMetadata({
  params,
}: AdminOrderDetailPageProps): Promise<Metadata> {
  const { orderId } = await params;
  return { title: buildTitle(`Order ${orderId}`) };
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { orderId } = await params;
  const session = await auth();
  const userRole = session?.user?.role ?? null;

  const [order, invoice, rawOrder, designers, referenceFiles, proofReviewSetting] = await Promise.all([
    getAdminOrder(orderId),
    prisma.invoice.findFirst({
      where: { orderId },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        clientEmail: true,
        filesUnlocked: true,
        proofSubmissions: {
          where: { status: "PENDING" },
          orderBy: { submittedAt: "desc" },
          select: {
            id: true,
            amountClaimed: true,
            clientNotes: true,
            submittedAt: true,
          },
        },
      },
    }),
    prisma.workflowOrder.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        quoteStatus: true,
        proofStatus: true,
        paymentStatus: true,
        quotedPrice: true,
        cancelledAt: true,
        cancelReason: true,
        cancelledBy: { select: { name: true } },
        assignedToUserId: true,
        proofReviewNote: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "DESIGNER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.clientReferenceFile.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, fileName: true, mimeType: true, sizeBytes: true,
        uploaderEmail: true, createdAt: true,
      },
    }),
    prisma.pricingConfig.findUnique({
      where: { key: "admin_proof_review_enabled" },
      select: { value: true },
    }),
  ]);

  if (!order) notFound();

  const invoiceHref = invoice ? (`/admin/invoices/${invoice.id}` as Route) : null;
  const canManagePayment = userRole === "SUPER_ADMIN" || userRole === "MANAGER";
  const requiresAdminReview = proofReviewSetting?.value === "true";
  const showAdminReviewPanel =
    rawOrder?.proofStatus === "PENDING_ADMIN_PROOF_REVIEW" ||
    rawOrder?.proofStatus === "PROOF_REJECTED_BY_ADMIN" ||
    rawOrder?.proofStatus === "PROOF_APPROVED_BY_ADMIN";

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section>
        <Link
          href={"/admin/orders" as Route}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Order queue
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {order.reference}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{order.title}</h1>
            <div className="mt-2 text-sm text-muted-foreground">
              {order.serviceLabel} · {order.clientName}
              {order.companyName ? ` · ${order.companyName}` : ""}
            </div>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </section>

      {/* Progress */}
      <Card className="rounded-[1.5rem] border-border/80">
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Progress</div>
            <div className="text-sm font-medium">{order.progressPercent}%</div>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${Math.max(6, Math.min(order.progressPercent, 100))}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetaStat label="Due" value={order.dueLabel} />
            <MetaStat label="Revisions" value={`${order.revisionCount}`} />
            <MetaStat label="Assigned" value={order.assignedTo ?? "Unassigned"} />
            <MetaStat label="Priority" value={order.priority} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        {/* Main */}
        <div className="grid gap-4">
          {/* Production specs */}
          <ProductionSpecsCard production={order.production} />

          {/* Client reference files */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Client reference files</CardTitle>
              <CardDescription>
                Files uploaded by the client with their order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReferenceFilesViewer
                files={referenceFiles.map((f) => ({
                  ...f,
                  createdAt: f.createdAt.toISOString(),
                }))}
                downloadRoute="admin"
              />
            </CardContent>
          </Card>

          {/* File uploader */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Design files</CardTitle>
              <CardDescription>
                Upload proof and final files. Files are locked until payment is confirmed.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <OrderFileUploader
                orderId={order.id}
                initialFiles={order.orderFiles}
              />

              {/* Send proof control */}
              <div className="border-t border-border/60 pt-4">
                <div className="mb-2 text-xs font-medium text-muted-foreground">Proof delivery</div>
                <ProofSendPanel
                  orderId={order.id}
                  proofStatus={order.proofStatus}
                  orderStatus={order.status}
                  fileCount={order.orderFiles.length}
                  requiresAdminReview={requiresAdminReview}
                />
              </div>

              {/* Admin proof review (when proof is pending admin review) */}
              {showAdminReviewPanel && (userRole === "SUPER_ADMIN" || userRole === "MANAGER") && (
                <div className="border-t border-border/60 pt-4">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Admin proof review</div>
                  <AdminProofReviewPanel
                    orderId={order.id}
                    proofStatus={order.proofStatus as "PENDING_ADMIN_PROOF_REVIEW" | "PROOF_APPROVED_BY_ADMIN" | "PROOF_REJECTED_BY_ADMIN"}
                    proofReviewNote={rawOrder?.proofReviewNote ?? null}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revision manager */}
          {(["REVISION_REQUESTED", "IN_PROGRESS"].includes(order.status) || order.orderRevisions.length > 0) && (
            <Card className="rounded-[1.5rem] border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Revisions</CardTitle>
                <CardDescription>Manage client revision requests and designer assignments.</CardDescription>
              </CardHeader>
              <CardContent>
                <RevisionManager
                  orderId={order.id}
                  revisions={order.orderRevisions}
                  designers={designers}
                />
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {order.events.length > 0 && (
            <Card className="rounded-[1.5rem] border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Activity timeline</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {order.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-border/80 bg-secondary/60 px-4 py-3 text-sm"
                  >
                    <div className="font-medium">{ev.title}</div>
                    {ev.body && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{ev.body}</div>
                    )}
                    <div className="mt-1 text-[10px] text-muted-foreground/60">
                      {new Date(ev.at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="grid gap-4 self-start">
          {/* Cancellation */}
          {rawOrder?.cancelledAt && (
            <Card className="rounded-[1.5rem] border-red-500/20 bg-red-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-red-400">Cancelled</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Date</div>
                  <div className="mt-0.5 font-medium">
                    {new Date(rawOrder.cancelledAt).toLocaleString()}
                  </div>
                </div>
                {rawOrder.cancelledBy?.name && (
                  <div>
                    <div className="text-xs text-muted-foreground">By</div>
                    <div className="mt-0.5">{rawOrder.cancelledBy.name}</div>
                  </div>
                )}
                {rawOrder.cancelReason && (
                  <div>
                    <div className="text-xs text-muted-foreground">Reason</div>
                    <div className="mt-0.5 text-muted-foreground">{rawOrder.cancelReason}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Workflow timeline */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowTimeline
                orderStatus={order.status}
                quoteStatus={order.quoteStatus}
                proofStatus={order.proofStatus}
                paymentStatus={order.paymentStatus}
                filesUnlocked={invoice?.filesUnlocked ?? false}
              />
            </CardContent>
          </Card>

          {/* Designer assignment */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assigned designer</CardTitle>
            </CardHeader>
            <CardContent>
              <DesignerAssignControl
                orderId={order.id}
                currentDesignerId={rawOrder?.assignedToUserId ?? null}
                designers={designers}
              />
            </CardContent>
          </Card>

          {/* Payment approval */}
          {(order.proofStatus === "CLIENT_APPROVED" || order.paymentStatus !== "NOT_REQUIRED") && (
            <Card className="rounded-[1.5rem] border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment</CardTitle>
                {!canManagePayment && (
                  <CardDescription>Super Admin or Manager can approve payments.</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {canManagePayment ? (
                  <AdminPaymentApproval
                    orderId={order.id}
                    paymentStatus={order.paymentStatus}
                    pendingProofs={(invoice?.proofSubmissions ?? []).map((p) => ({
                      id: p.id,
                      amountClaimed: Number(p.amountClaimed),
                      clientNotes: p.clientNotes,
                      submittedAt: p.submittedAt.toISOString(),
                    }))}
                    filesUnlocked={invoice?.filesUnlocked ?? false}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Payment status: {order.paymentStatus.toLowerCase().replace(/_/g, " ")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Invoice */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice ? (
                <div className="grid gap-3">
                  <div className="text-sm font-medium">{invoice.invoiceNumber}</div>
                  <div className="text-xs text-muted-foreground">{invoice.clientEmail}</div>
                  <span className="inline-block w-fit rounded-full border border-border/80 bg-secondary/80 px-2.5 py-0.5 text-[10px] font-medium capitalize">
                    {invoice.status.toLowerCase()}
                  </span>
                  {invoiceHref && (
                    <Link
                      href={invoiceHref}
                      className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                    >
                      Open invoice
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No invoice yet.</div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions</CardTitle>
              <CardDescription>Workflow controls for this order.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {rawOrder?.status === "DRAFT" ? (
                <ConvertQuoteButton orderId={order.id} />
              ) : (
                <OrderStatusControls orderId={order.id} status={order.status} />
              )}
              <div className="my-1 h-px bg-border/60" />
              <Link
                href={"/admin/orders" as Route}
                className="inline-flex h-9 items-center justify-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
              >
                Back to queue
              </Link>
              <ConversationLauncherButton
                mode="admin"
                type="ORDER"
                orderId={order.id}
                label="Open conversation"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function ProductionSpecsCard({ production }: { production: OrderProduction }) {
  const hasAnySpec =
    production.placement ||
    production.stitchCount ||
    production.fabricType ||
    production.fileFormats.length > 0 ||
    production.colorQuantity ||
    production.threadBrand ||
    production.is3dPuffJacketBack ||
    production.designHeightIn ||
    production.designWidthIn;

  return (
    <Card className="rounded-[1.5rem] border-border/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Production specs</CardTitle>
        <CardDescription>Order requirements from the client.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip label={`Qty: ${production.quantity}`} />
          {production.isFreeDesign && <Chip label="Free design" color="emerald" />}
          {production.is3dPuffJacketBack && <Chip label="3D Puff Jacket Back" color="purple" />}
          {production.estimatedPrice != null && (
            <Chip label={`Est. $${production.estimatedPrice.toFixed(2)}`} color="blue" />
          )}
          {production.leadSource && <Chip label={`Lead: ${production.leadSource}`} />}
        </div>

        {!hasAnySpec && (
          <p className="text-sm text-muted-foreground">No production specs provided.</p>
        )}

        {hasAnySpec && (
          <div className="divide-y divide-border/60">
            {production.placement && <SpecRow label="Placement" value={production.placement} />}
            {(production.designHeightIn || production.designWidthIn) && (
              <SpecRow
                label="Dimensions"
                value={`${production.designHeightIn ?? "?"}″ H × ${production.designWidthIn ?? "?"}″ W`}
              />
            )}
            {production.stitchCount && (
              <SpecRow label="Stitch count" value={production.stitchCount.toLocaleString()} />
            )}
            {production.fabricType && <SpecRow label="Fabric" value={production.fabricType} />}
            {production.fileFormats.length > 0 && (
              <SpecRow label="File formats" value={production.fileFormats.join(", ")} />
            )}
            {production.colorQuantity && (
              <SpecRow label="Thread colors" value={`${production.colorQuantity}`} />
            )}
            {production.threadBrand && <SpecRow label="Thread brand" value={production.threadBrand} />}
            {production.colorDetails && <SpecRow label="Color details" value={production.colorDetails} />}
            {production.trims && <SpecRow label="Trims" value={production.trims} />}
          </div>
        )}

        {production.specialInstructions && (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-400">
              Special instructions
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {production.specialInstructions}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Chip({
  label,
  color = "default",
}: {
  label: string;
  color?: "default" | "emerald" | "purple" | "blue";
}) {
  const colors = {
    default: "border-border/80 bg-secondary/80 text-muted-foreground",
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-400",
    purple: "border-purple-400/30 bg-purple-500/10 text-purple-400",
    blue: "border-blue-400/30 bg-blue-500/10 text-blue-400",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${colors[color]}`}>
      {label}
    </span>
  );
}
