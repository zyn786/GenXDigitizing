import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/workflow/order-status-badge";
import { OrderStatusControls } from "@/components/workflow/order-status-controls";
import { ConversationLauncherButton } from "@/components/support/conversation-launcher-button";
import { OrderFileUploader } from "@/components/admin/order-file-uploader";
import { ProofSendPanel } from "@/components/workflow/proof-send-panel";
import { getOrderFiles } from "@/lib/payments/repository";
import { mapDbStatus } from "@/lib/workflow/repository";
import { ReferenceFilesViewer } from "@/components/shared/reference-files-viewer";
import type { ProofStatus } from "@/lib/workflow/types";

type Props = { params: Promise<{ orderId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return { title: buildTitle(`Job ${orderId}`) };
}

const PLACEMENT_LABELS: Record<string, string> = {
  LEFT_CHEST: "Left Chest", RIGHT_CHEST: "Right Chest", HAT_FRONT: "Hat Front", HAT_SIDE: "Hat Side", HAT_BACK: "Hat Back",
  LARGE_DESIGN: "Large Design", JACKET_BACK: "Jacket Back", JACKET_CHEST: "Jacket Chest", SLEEVE_LEFT: "Left Sleeve",
  SLEEVE_RIGHT: "Right Sleeve", FULL_BACK: "Full Back", FULL_FRONT: "Full Front", POCKET: "Pocket", LEG: "Leg",
  PUFF_LEFT_CHEST: "3D Puff Left Chest", PUFF_HAT: "3D Puff Hat", PUFF_JACKET_BACK: "3D Puff Jacket Back", OTHER: "Other",
};

const SERVICE_LABELS: Record<string, string> = {
  EMBROIDERY_DIGITIZING: "Embroidery Digitizing", VECTOR_ART: "Vector Art Conversion",
  COLOR_SEPARATION_DTF: "Color Separation / DTF", CUSTOM_PATCHES: "Custom Patches",
  VECTOR_REDRAW: "Vector Art Conversion", COLOR_SEPARATION: "Color Separation / DTF", DTF_SCREEN_PRINT: "Color Separation / DTF",
};

export default async function DesignerJobDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { orderId } = await params;

  const [job, orderFiles, referenceFiles, proofReviewSetting] = await Promise.all([
    prisma.workflowOrder.findFirst({
      where: { id: orderId, assignedToUserId: session.user.id },
      include: { clientUser: { select: { name: true, clientProfile: { select: { companyName: true } } } } },
    }),
    getOrderFiles(orderId),
    prisma.clientReferenceFile.findMany({
      where: { orderId }, orderBy: { createdAt: "asc" },
      select: { id: true, fileName: true, mimeType: true, sizeBytes: true, uploaderEmail: true, createdAt: true },
    }),
    prisma.pricingConfig.findUnique({ where: { key: "admin_proof_review_enabled" }, select: { value: true } }),
  ]);

  if (!job) notFound();

  const status = mapDbStatus(job.status);
  const requiresAdminReview = proofReviewSetting?.value !== "false";
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const due = job.dueAt ? job.dueAt.getTime() - now : null;
  const dueLabel = !job.dueAt ? "No due date" : due !== null && due < 0 ? "Overdue" : due !== null && due < 86_400_000 ? `Due in ${Math.round(due / 3_600_000)}h` : `Due ${job.dueAt.toLocaleDateString()}`;

  const placement = job.placement ? (PLACEMENT_LABELS[job.placement] ?? job.placement) : null;
  const hasSpecs = placement || job.designHeightIn || job.designWidthIn || job.stitchCount || job.fabricType || job.fileFormats.length > 0 || job.colorQuantity || job.threadBrand || job.colorDetails || job.trims || job.specialInstructions;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section>
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={"/admin/designer" as Route}>Designer Studio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={"/admin/designer" as Route}>My Jobs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{job.orderNumber}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{job.orderNumber}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{job.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{SERVICE_LABELS[job.serviceType] ?? job.serviceType}</span>
              <span>·</span>
              <span>{job.clientUser.name ?? "Client"}{job.clientUser.clientProfile?.companyName ? ` · ${job.clientUser.clientProfile.companyName}` : ""}</span>
              {job.quantity > 1 && <span className="rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[10px] font-medium">Qty: {job.quantity}</span>}
              {job.is3dPuffJacketBack && <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400">3D Puff Jacket Back</span>}
            </div>
          </div>
          <OrderStatusBadge status={status} />
        </div>
      </section>

      {/* Progress */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Production progress</p>
            <p className="text-sm font-medium">{job.progressPercent}%</p>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.max(4, Math.min(job.progressPercent, 100))}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Due" value={dueLabel} />
            <Stat label="Revisions" value={String(job.revisionCount)} />
            <Stat label="Priority" value={job.status === "CANCELLED" ? "—" : "Standard"} />
            <Stat label="Proof stage" value={job.proofStage ?? "—"} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        {/* Main column */}
        <div className="grid gap-4">
          {/* Production specs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Production Specs</CardTitle>
              <CardDescription>All requirements for this order.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                <Chip label={`Qty: ${job.quantity}`} />
                {job.isFreeDesign && <Chip label="Free design" variant="emerald" />}
                {job.is3dPuffJacketBack && <Chip label="3D Puff Jacket Back" variant="purple" />}
                {job.estimatedPrice != null && <Chip label={`Est. $${Number(job.estimatedPrice).toFixed(2)}`} variant="blue" />}
              </div>

              {!hasSpecs ? (
                <p className="text-sm text-muted-foreground">No production specs provided.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {placement && <SpecRow label="Placement" value={placement} />}
                  {(job.designHeightIn || job.designWidthIn) && <SpecRow label="Dimensions" value={`${job.designHeightIn != null ? Number(job.designHeightIn) : "?"}″ H × ${job.designWidthIn != null ? Number(job.designWidthIn) : "?"}″ W`} />}
                  {job.stitchCount && <SpecRow label="Stitch count" value={job.stitchCount.toLocaleString()} />}
                  {job.fabricType && <SpecRow label="Fabric" value={job.fabricType} />}
                  {job.fileFormats.length > 0 && <SpecRow label="File formats" value={job.fileFormats.join(", ")} />}
                  {job.colorQuantity && <SpecRow label="Thread colors" value={String(job.colorQuantity)} />}
                  {job.threadBrand && <SpecRow label="Thread brand" value={job.threadBrand} />}
                  {job.colorDetails && <SpecRow label="Color details" value={job.colorDetails} />}
                  {job.trims && <SpecRow label="Trims" value={job.trims} />}
                </div>
              )}

              {job.specialInstructions && (
                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">Special Instructions</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{job.specialInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order notes */}
          {job.notes && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Order Notes</CardTitle></CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-2xl bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                  {(() => { try { const parsed = JSON.parse(job.notes!) as Record<string, unknown>; return Object.entries(parsed).map(([k, v]) => `${k}: ${String(v)}`).join("\n"); } catch { return job.notes; } })()}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Reference files */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Client Reference Files</CardTitle>
              <CardDescription>Reference images and files uploaded by the client.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReferenceFilesViewer files={referenceFiles.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() }))} downloadRoute="designer" />
            </CardContent>
          </Card>

          {/* Design files + proof */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Design Files & Proof</CardTitle>
              <CardDescription>Upload proof previews and final production files. Files are locked until payment is approved.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <OrderFileUploader orderId={job.id} initialFiles={orderFiles} />

              <div className="border-t border-border/60 pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Proof submission</p>
                <ProofSendPanel orderId={job.id} proofStatus={job.proofStatus as ProofStatus} orderStatus={job.status} fileCount={orderFiles.filter((f) => f.fileType === "PROOF_PREVIEW").length} requiresAdminReview={requiresAdminReview} />
              </div>

              {job.proofStatus === "PROOF_REJECTED_BY_ADMIN" && job.proofReviewNote && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
                  <p className="mb-1 font-medium text-red-500">Admin feedback on your proof</p>
                  <p className="text-xs text-muted-foreground">{job.proofReviewNote}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="grid gap-4 self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Update Status</CardTitle>
              <CardDescription>Move this job to its next stage.</CardDescription>
            </CardHeader>
            <CardContent><OrderStatusControls orderId={job.id} status={status} /></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Communication</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              <ConversationLauncherButton mode="admin" type="ORDER" orderId={job.id} label="Message client" />
              <Button asChild variant="outline" shape="pill" size="sm" className="w-full">
                <Link href={"/admin/designer" as Route}>Back to my jobs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-2 text-sm">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

