import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/workflow/order-status-badge";
import { OrderStatusDropdown } from "@/components/workflow/order-status-dropdown";
import { DesignerAssignControl } from "@/components/workflow/designer-assign-control";
import { ConvertQuoteButton } from "@/components/workflow/convert-quote-button";
import { OrderFileUploader } from "@/components/admin/order-file-uploader";
import { ProofSendPanel } from "@/components/workflow/proof-send-panel";
import { AdminProofReviewPanel } from "@/components/workflow/admin-proof-review-panel";
import { AdminProofPreview } from "@/components/workflow/admin-proof-preview";
import { RevisionManager } from "@/components/workflow/revision-manager";
import { AdminPaymentApproval } from "@/components/workflow/admin-payment-approval";
import { WorkflowTimeline } from "@/components/workflow/workflow-timeline";
import { ConversationLauncherButton } from "@/components/support/conversation-launcher-button";
import { buildTitle } from "@/lib/site";
import { getAdminOrder } from "@/lib/workflow/repository";
import type { OrderProduction } from "@/lib/workflow/types";
import { ReferenceFilesViewer } from "@/components/shared/reference-files-viewer";

type Props = { params: Promise<{ orderId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return { title: buildTitle(`Order ${orderId}`) };
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { orderId } = await params;
  const session = await auth();
  const userRole = session?.user?.role ?? null;

  const [order, invoice, rawOrder, designers, referenceFiles, proofReviewSetting] = await Promise.all([
    getAdminOrder(orderId),
    prisma.invoice.findFirst({
      where: { orderId },
      select: {
        id: true, invoiceNumber: true, status: true, clientEmail: true, filesUnlocked: true,
        proofSubmissions: { where: { status: "PENDING" }, orderBy: { submittedAt: "desc" }, select: { id: true, amountClaimed: true, clientNotes: true, submittedAt: true } },
      },
    }),
    prisma.workflowOrder.findUnique({
      where: { id: orderId },
      select: {
        status: true, quoteStatus: true, proofStatus: true, paymentStatus: true,
        quotedPrice: true, cancelledAt: true, cancelReason: true,
        cancelledBy: { select: { name: true } },
        assignedToUserId: true, proofReviewNote: true,
      },
    }),
    prisma.user.findMany({ where: { role: "DESIGNER", isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.clientReferenceFile.findMany({
      where: { orderId }, orderBy: { createdAt: "asc" },
      select: { id: true, fileName: true, mimeType: true, sizeBytes: true, uploaderEmail: true, createdAt: true },
    }),
    prisma.pricingConfig.findUnique({ where: { key: "admin_proof_review_enabled" }, select: { value: true } }),
  ]);

  if (!order) notFound();

  const invoiceHref = invoice ? (`/admin/invoices/${invoice.id}` as Route) : null;
  const canManagePayment = userRole === "SUPER_ADMIN" || userRole === "MANAGER";
  const requiresAdminReview = proofReviewSetting?.value === "true";
  const showAdminReviewPanel =
    rawOrder?.proofStatus === "PENDING_ADMIN_PROOF_REVIEW" || rawOrder?.proofStatus === "PROOF_REJECTED_BY_ADMIN" || rawOrder?.proofStatus === "PROOF_APPROVED_BY_ADMIN";

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section>
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={"/admin/orders" as Route}>Orders</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{order.reference}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{order.reference}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{order.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.serviceLabel} · {order.clientName}{order.companyName ? ` · ${order.companyName}` : ""}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </section>

      {/* Progress bar */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
            <p className="text-sm font-medium">{order.progressPercent}%</p>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.max(6, Math.min(order.progressPercent, 100))}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Due" value={order.dueLabel} />
            <Stat label="Revisions" value={String(order.revisionCount)} />
            <Stat label="Assigned" value={order.assignedTo ?? "Unassigned"} />
            <Stat label="Priority" value={order.priority} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        {/* Main column */}
        <div className="grid gap-4">
          {/* Production specs */}
          <ProductionSpecsCard production={order.production} />

          {/* Reference files */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Client Reference Files</CardTitle>
              <CardDescription>Files uploaded by the client with their order.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReferenceFilesViewer files={referenceFiles.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() }))} downloadRoute="admin" showDelete />
            </CardContent>
          </Card>

          {/* Design files + proof */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Design Files & Proof</CardTitle>
              <CardDescription>Upload proof and final files. Files are locked until payment is confirmed.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <OrderFileUploader orderId={order.id} initialFiles={order.orderFiles} />

              <div className="border-t border-border/60 pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Proof previews</p>
                <AdminProofPreview orderId={order.id} />
              </div>

              <div className="border-t border-border/60 pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Proof delivery</p>
                <ProofSendPanel orderId={order.id} proofStatus={order.proofStatus} orderStatus={order.status} fileCount={order.orderFiles.length} requiresAdminReview={requiresAdminReview} />
              </div>

              {showAdminReviewPanel && (userRole === "SUPER_ADMIN" || userRole === "MANAGER") && (
                <div className="border-t border-border/60 pt-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Admin proof review</p>
                  <AdminProofReviewPanel orderId={order.id} proofStatus={order.proofStatus as "PENDING_ADMIN_PROOF_REVIEW" | "PROOF_APPROVED_BY_ADMIN" | "PROOF_REJECTED_BY_ADMIN"} proofReviewNote={rawOrder?.proofReviewNote ?? null} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revisions */}
          {(["REVISION_REQUESTED", "IN_PROGRESS"].includes(order.status) || order.orderRevisions.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Revisions</CardTitle>
                <CardDescription>Manage client revision requests and designer assignments.</CardDescription>
              </CardHeader>
              <CardContent>
                <RevisionManager orderId={order.id} revisions={order.orderRevisions} designers={designers} />
              </CardContent>
            </Card>
          )}

          {/* Activity timeline */}
          {order.events.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {order.events.map((ev) => (
                  <div key={ev.id} className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
                    <p className="font-medium">{ev.title}</p>
                    {ev.body && <p className="mt-0.5 text-xs text-muted-foreground">{ev.body}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground/60">{new Date(ev.at).toLocaleString()}</p>
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
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-red-500">Cancelled</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="mt-0.5 font-medium">{new Date(rawOrder.cancelledAt).toLocaleString()}</p>
                </div>
                {rawOrder.cancelledBy?.name && (
                  <div>
                    <p className="text-xs text-muted-foreground">By</p>
                    <p className="mt-0.5">{rawOrder.cancelledBy.name}</p>
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

          {/* Workflow timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowTimeline orderStatus={order.status} quoteStatus={order.quoteStatus} proofStatus={order.proofStatus} paymentStatus={order.paymentStatus} filesUnlocked={invoice?.filesUnlocked ?? false} />
            </CardContent>
          </Card>

          {/* Designer assignment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assigned Designer</CardTitle>
            </CardHeader>
            <CardContent>
              <DesignerAssignControl orderId={order.id} currentDesignerId={rawOrder?.assignedToUserId ?? null} designers={designers} />
            </CardContent>
          </Card>

          {/* Payment */}
          {(order.proofStatus === "CLIENT_APPROVED" || order.paymentStatus !== "NOT_REQUIRED") && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment</CardTitle>
                {!canManagePayment && <CardDescription>Super Admin or Manager can approve payments.</CardDescription>}
              </CardHeader>
              <CardContent>
                {canManagePayment ? (
                  <AdminPaymentApproval orderId={order.id} paymentStatus={order.paymentStatus} pendingProofs={(invoice?.proofSubmissions ?? []).map((p) => ({ id: p.id, amountClaimed: Number(p.amountClaimed), clientNotes: p.clientNotes, submittedAt: p.submittedAt.toISOString() }))} filesUnlocked={invoice?.filesUnlocked ?? false} />
                ) : (
                  <p className="text-xs text-muted-foreground">Payment status: {order.paymentStatus.toLowerCase().replace(/_/g, " ")}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Invoice */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice ? (
                <div className="grid gap-3">
                  <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{invoice.clientEmail}</p>
                  <span className="inline-block w-fit rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium capitalize">{invoice.status.toLowerCase()}</span>
                  {invoiceHref && (
                    <Button asChild variant="default" shape="pill" size="sm">
                      <Link href={invoiceHref}>Open invoice</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No invoice yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions</CardTitle>
              <CardDescription>Workflow controls for this order.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {rawOrder?.status === "DRAFT" ? (
                <ConvertQuoteButton orderId={order.id} />
              ) : (
                <OrderStatusDropdown
                  orderId={order.id}
                  currentStatus={order.status}
                  userRole={String(userRole ?? "")}
                  title="Update Order Status"
                  description="Move this order through the production workflow."
                />
              )}
              <div className="my-1 h-px bg-border/60" />
              <Button asChild variant="outline" shape="pill" size="sm" className="w-full">
                <Link href={"/admin/orders" as Route}>Back to queue</Link>
              </Button>
              <ConversationLauncherButton mode="admin" type="ORDER" orderId={order.id} label="Open conversation" />
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

function ProductionSpecsCard({ production }: { production: OrderProduction }) {
  const hasAnySpec = production.placement || production.stitchCount || production.fabricType || production.fileFormats.length > 0 || production.colorQuantity || production.threadBrand || production.is3dPuffJacketBack || production.designHeightIn || production.designWidthIn;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Production Specs</CardTitle>
        <CardDescription>Order requirements from the client.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip label={`Qty: ${production.quantity}`} />
          {production.isFreeDesign && <Chip label="Free design" variant="emerald" />}
          {production.is3dPuffJacketBack && <Chip label="3D Puff Jacket Back" variant="purple" />}
          {production.estimatedPrice != null && <Chip label={`Est. $${production.estimatedPrice.toFixed(2)}`} variant="blue" />}
          {production.leadSource && <Chip label={`Lead: ${production.leadSource}`} />}
        </div>

        {!hasAnySpec ? (
          <p className="text-sm text-muted-foreground">No production specs provided.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {production.placement && <SpecRow label="Placement" value={production.placement} />}
            {(production.designHeightIn || production.designWidthIn) && <SpecRow label="Dimensions" value={`${production.designHeightIn ?? "?"}″ H × ${production.designWidthIn ?? "?"}″ W`} />}
            {production.stitchCount && <SpecRow label="Stitch count" value={production.stitchCount.toLocaleString()} />}
            {production.fabricType && <SpecRow label="Fabric" value={production.fabricType} />}
            {production.fileFormats.length > 0 && <SpecRow label="File formats" value={production.fileFormats.join(", ")} />}
            {production.colorQuantity && <SpecRow label="Thread colors" value={String(production.colorQuantity)} />}
            {production.threadBrand && <SpecRow label="Thread brand" value={production.threadBrand} />}
            {production.colorDetails && <SpecRow label="Color details" value={production.colorDetails} />}
            {production.trims && <SpecRow label="Trims" value={production.trims} />}
          </div>
        )}

        {production.specialInstructions && (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">Special Instructions</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{production.specialInstructions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

