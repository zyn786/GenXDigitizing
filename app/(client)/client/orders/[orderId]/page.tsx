import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, RefreshCw, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";

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
import { CancelOrderButton } from "@/components/client/cancel-order-button";
import { ClientEditOrderModal } from "@/components/client/client-edit-order-modal";
import { ClientDownloadButton } from "@/components/client/client-download-button";
import { ClientProofReview } from "@/components/workflow/client-proof-review";
import { PaymentGatePanel } from "@/components/workflow/payment-gate-panel";
import { WorkflowTimeline } from "@/components/workflow/workflow-timeline";
import { buildTitle } from "@/lib/site";
import { getClientOrder } from "@/lib/workflow/repository";
import type { OrderProduction } from "@/lib/workflow/types";
import { ClientReferenceFilesSection } from "@/components/client/client-reference-files-section";

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
      },
    }),
    prisma.clientReferenceFile.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
    }),
  ]);

  if (!order) notFound();

  const statusLabel = order.status.replaceAll("_", " ").toLowerCase();
  const hasInvoice = Boolean(invoice);
  const isCancelled = rawOrder?.status === "CANCELLED";
  const canCancel = rawOrder?.status === "SUBMITTED";
  const filesUnlocked = invoice?.filesUnlocked ?? false;

  const proofStatus = rawOrder?.proofStatus ?? "NOT_UPLOADED";
  const paymentStatus = rawOrder?.paymentStatus ?? "NOT_REQUIRED";

  // Parse intake validation data from notes
  const intakeData = parseIntakeFromNotes(rawOrder?.notes ?? null);

  return (
    <div className="grid gap-6">
      {/* Header */}
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
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {order.reference}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{order.title}</h1>
            <div className="mt-2 text-sm text-muted-foreground">
              {order.serviceLabel}
              {order.companyName ? ` · ${order.companyName}` : ""}
            </div>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </section>

      {/* Order intake status banner */}
      {(rawOrder?.status === "DRAFT" || rawOrder?.status === "SUBMITTED") && (
        <IntakeBanner
          status={rawOrder.status}
          missingFields={intakeData?.missingFields ?? []}
        />
      )}

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
            <MetaStat icon={<Clock className="h-3.5 w-3.5" />} label="Due" value={order.dueLabel} />
            <MetaStat icon={<RefreshCw className="h-3.5 w-3.5" />} label="Revisions" value={`${order.revisionCount}`} />
            <MetaStat label="Priority" value={order.priority} />
            <MetaStat label="Status" value={statusLabel} capitalize />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        {/* Main */}
        <div className="grid gap-4">
          {/* Proof review — shown when proof is in review or client action needed */}
          {(rawOrder?.status === "PROOF_READY" ||
            proofStatus === "CLIENT_APPROVED" ||
            proofStatus === "REVISION_REQUESTED" ||
            proofStatus === "PENDING_ADMIN_PROOF_REVIEW") && (
            <Card className="rounded-[1.5rem] border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Proof review</CardTitle>
                <CardDescription>
                  Review your proof files below and approve or request changes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientProofReview
                  orderId={order.id}
                  proofStatus={proofStatus as "NOT_UPLOADED" | "UPLOADED" | "INTERNAL_REVIEW" | "SENT_TO_CLIENT" | "CLIENT_REVIEWING" | "CLIENT_APPROVED" | "REVISION_REQUESTED"}
                  orderStatus={rawOrder?.status ?? order.status}
                />
              </CardContent>
            </Card>
          )}

          {/* Delivery files */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery files</CardTitle>
              <CardDescription>
                {filesUnlocked
                  ? "Your files are ready to download."
                  : "Files will be available once payment is confirmed."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {order.orderFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No files yet. They will appear here once production is complete.
                </p>
              ) : !filesUnlocked ? (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <Lock className="h-4 w-4 shrink-0 text-amber-400" />
                  <p className="text-sm text-amber-300">
                    Files are locked. {proofStatus !== "CLIENT_APPROVED"
                      ? "Approve your proof to unlock payment and then download."
                      : "Submit payment to unlock your files."}
                    {hasInvoice && proofStatus === "CLIENT_APPROVED" && (
                      <>
                        {" "}
                        <Link
                          href={`/client/invoices/${invoice!.id}` as Route}
                          className="underline underline-offset-2"
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
                      className="flex items-center justify-between rounded-2xl border border-border/80 bg-secondary/60 px-4 py-3 text-sm"
                    >
                      <div>
                        <div className="font-medium">{file.fileName}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {formatBytes(file.sizeBytes)}
                          {file.uploadedByName ? ` · By ${file.uploadedByName}` : ""}
                        </div>
                      </div>
                      <ClientDownloadButton fileId={file.id} fileName={file.fileName} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reference files — client can view their uploads and add more */}
          <ClientReferenceFilesSection
            orderId={orderId}
            initialFiles={referenceFiles.map((f) => ({
              ...f,
              createdAt: f.createdAt.toISOString(),
            }))}
          />

          {/* Order specs */}
          <ClientSpecsCard production={order.production} />

          {/* Revision history */}
          {order.orderRevisions.length > 0 && (
            <Card className="rounded-[1.5rem] border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Revision history</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {order.orderRevisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl border border-border/80 bg-secondary/60 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{rev.versionLabel ?? "Revision"}</div>
                      <span className="shrink-0 rounded-full border border-border/80 bg-background px-2.5 py-0.5 text-[10px] font-medium capitalize">
                        {rev.status.toLowerCase().replace(/_/g, " ")}
                      </span>
                    </div>
                    {rev.clientNotes && (
                      <div className="mt-1 text-xs text-muted-foreground">{rev.clientNotes}</div>
                    )}
                    <div className="mt-1 text-[10px] text-muted-foreground/60">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Order timeline */}
          {order.events.length > 0 && (
            <Card className="rounded-[1.5rem] border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order timeline</CardTitle>
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
          {isCancelled && rawOrder?.cancelledAt && (
            <Card className="rounded-[1.5rem] border-red-500/20 bg-red-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-red-400">Order Cancelled</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Cancelled on</div>
                  <div className="mt-0.5 font-medium">
                    {new Date(rawOrder.cancelledAt).toLocaleString()}
                  </div>
                </div>
                {rawOrder.cancelledBy?.name && (
                  <div>
                    <div className="text-xs text-muted-foreground">Cancelled by</div>
                    <div className="mt-0.5 font-medium">{rawOrder.cancelledBy.name}</div>
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
              <CardTitle className="text-base">Order status</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowTimeline
                orderStatus={rawOrder?.status ?? order.status}
                quoteStatus={rawOrder?.quoteStatus ?? order.quoteStatus}
                proofStatus={proofStatus as "NOT_UPLOADED" | "UPLOADED" | "INTERNAL_REVIEW" | "SENT_TO_CLIENT" | "CLIENT_REVIEWING" | "CLIENT_APPROVED" | "REVISION_REQUESTED"}
                paymentStatus={paymentStatus as "NOT_REQUIRED" | "PAYMENT_PENDING" | "PAYMENT_SUBMITTED" | "PAYMENT_UNDER_REVIEW" | "PAID" | "PARTIALLY_PAID" | "REJECTED" | "REFUNDED"}
                filesUnlocked={filesUnlocked}
              />
            </CardContent>
          </Card>

          {/* Payment gate */}
          <Card className="rounded-[1.5rem] border-border/80">
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

          {/* Actions */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link
                href={"/client/orders" as Route}
                className="inline-flex h-9 items-center justify-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
              >
                Back to orders
              </Link>
              <ConversationLauncherButton
                mode="client"
                type="ORDER"
                orderId={order.id}
                label="Open conversation"
              />
              {(rawOrder?.status === "DRAFT" || rawOrder?.status === "SUBMITTED") && (
                <>
                  <div className="my-1 h-px bg-border/60" />
                  <ClientEditOrderModal
                    orderId={orderId}
                    status={rawOrder?.status ?? undefined}
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
              {!isCancelled && (
                canCancel ? (
                  <>
                    <div className="my-1 h-px bg-border/60" />
                    <CancelOrderButton orderId={order.id} />
                  </>
                ) : (
                  <>
                    <div className="my-1 h-px bg-border/60" />
                    <p className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs leading-snug text-amber-300">
                      Cancellation is no longer available — this order is already in production.
                    </p>
                  </>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MetaStat({
  icon,
  label,
  value,
  capitalize,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-sm font-medium ${capitalize ? "capitalize" : ""}`}>{value}</div>
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

function ClientSpecsCard({ production }: { production: OrderProduction }) {
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

  if (!hasAnySpec && !production.specialInstructions) return null;

  return (
    <Card className="rounded-[1.5rem] border-border/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Your order specs</CardTitle>
        <CardDescription>What you submitted with this order.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-2">
          <Chip label={`Qty: ${production.quantity}`} />
          {production.isFreeDesign && <Chip label="Free first design" color="emerald" />}
          {production.is3dPuffJacketBack && <Chip label="3D Puff Jacket Back" color="purple" />}
          {production.estimatedPrice != null && (
            <Chip label={`Est. $${production.estimatedPrice.toFixed(2)}`} color="blue" />
          )}
        </div>

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

/** Parse intake validation data embedded in order notes JSON. */
function parseIntakeFromNotes(
  notes: string | null
): { isComplete: boolean; missingFields: string[] } | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    const v = parsed?.intakeValidation;
    if (!v || typeof v.isComplete !== "boolean") return null;
    return {
      isComplete: v.isComplete,
      missingFields: Array.isArray(v.missingFields) ? v.missingFields : [],
    };
  } catch {
    return null;
  }
}

/** Banner shown on the client order detail page for DRAFT or SUBMITTED intake status. */
function IntakeBanner({
  status,
  missingFields,
}: {
  status: string;
  missingFields: string[];
}) {
  const isDraft = status === "DRAFT";

  if (isDraft) {
    return (
      <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-amber-300">
              Order needs details
            </div>
            <p className="mt-1 text-sm leading-relaxed text-amber-200/70">
              Your order is missing some required details before our team can review it.
              {missingFields.length > 0 && (
                <span>
                  {" "}Please provide: <strong className="text-amber-200">{missingFields.join(", ")}</strong>.
                </span>
              )}
            </p>
            <p className="mt-2 text-xs text-amber-200/50">
              Use the <strong>Edit order</strong> button in the sidebar to add the missing information.
              Once complete, the order will be automatically submitted for review.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // SUBMITTED
  return (
    <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/5 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-emerald-300">
            Order is ready
          </div>
          <p className="mt-1 text-sm leading-relaxed text-emerald-200/70">
            Your order has all the required details and is ready for our team to review.
            We will get back to you shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
