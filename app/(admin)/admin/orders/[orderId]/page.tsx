import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
import { buildTitle } from "@/lib/site";
import { getAdminOrder } from "@/lib/workflow/repository";
import type { OrderProduction } from "@/lib/workflow/types";

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

  const [order, invoice, rawOrder, designers] = await Promise.all([
    getAdminOrder(orderId),
    prisma.invoice.findFirst({
      where: { orderId },
      select: { id: true, invoiceNumber: true, status: true, clientEmail: true },
    }),
    prisma.workflowOrder.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        cancelledAt: true,
        cancelReason: true,
        cancelledBy: { select: { name: true } },
        assignedToUserId: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "DESIGNER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!order) notFound();

  const invoiceHref = invoice
    ? (`/admin/invoices/${invoice.id}` as Route)
    : null;

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
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {order.title}
            </h1>
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
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Progress
            </div>
            <div className="text-sm font-medium">{order.progressPercent}%</div>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{
                width: `${Math.max(6, Math.min(order.progressPercent, 100))}%`,
              }}
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

          {/* File uploader (designer) */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery files</CardTitle>
              <CardDescription>
                Upload final embroidery files for this order.
                {!invoice?.id && " Files will be locked until payment is confirmed."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderFileUploader
                orderId={order.id}
                initialFiles={order.orderFiles}
              />
            </CardContent>
          </Card>

          {/* Proof versions */}
          {order.proofVersions.length > 0 && (
            <Card className="rounded-[1.5rem] border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Proofs</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {order.proofVersions.map((pv) => (
                  <div
                    key={pv.id}
                    className="rounded-2xl border border-border/80 bg-secondary/60 px-4 py-3 text-sm"
                  >
                    <div className="font-medium">{pv.versionLabel}</div>
                    {pv.note && (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {pv.note}
                      </div>
                    )}
                    <div className="mt-1 text-[10px] text-muted-foreground/60">
                      {new Date(pv.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {order.events.length > 0 && (
            <Card className="rounded-[1.5rem] border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {order.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-border/80 bg-secondary/60 px-4 py-3 text-sm"
                  >
                    <div className="font-medium">{ev.title}</div>
                    {ev.body && (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {ev.body}
                      </div>
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
          {/* Cancellation info */}
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

          {/* Invoice */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice ? (
                <div className="grid gap-3">
                  <div className="text-sm font-medium">{invoice.invoiceNumber}</div>
                  <div className="text-xs text-muted-foreground">
                    {invoice.clientEmail}
                  </div>
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
                <div className="text-sm text-muted-foreground">
                  No invoice yet.
                </div>
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
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
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
        {/* Summary row */}
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
            {production.threadBrand && (
              <SpecRow label="Thread brand" value={production.threadBrand} />
            )}
            {production.colorDetails && (
              <SpecRow label="Color details" value={production.colorDetails} />
            )}
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
