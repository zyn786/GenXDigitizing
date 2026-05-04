import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { QuotePricingPanel } from "@/components/workflow/quote-pricing-panel";
import { WorkflowTimeline } from "@/components/workflow/workflow-timeline";
import { ConvertQuoteButton } from "@/components/workflow/convert-quote-button";

type Props = { params: Promise<{ quoteId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { quoteId } = await params;
  return { title: buildTitle(`Quote ${quoteId}`) };
}

const QUOTE_TONES: Record<string, string> = {
  NEW: "border-border/60 bg-muted/60 text-muted-foreground",
  UNDER_REVIEW: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PRICE_SENT: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  CLIENT_ACCEPTED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CLIENT_REJECTED: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
  CONVERTED_TO_ORDER: "border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400",
  CANCELLED: "border-border/60 bg-muted/60 text-muted-foreground",
};

const QUOTE_LABELS: Record<string, string> = {
  NEW: "Awaiting review",
  UNDER_REVIEW: "Under review",
  PRICE_SENT: "Price sent",
  CLIENT_ACCEPTED: "Accepted",
  CLIENT_REJECTED: "Rejected",
  CONVERTED_TO_ORDER: "Converted",
  CANCELLED: "Cancelled",
};

const SERVICE_LABELS: Record<string, string> = {
  EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
  VECTOR_ART: "Vector Art Conversion",
  COLOR_SEPARATION_DTF: "Color Separation / DTF",
  CUSTOM_PATCHES: "Custom Patches",
  VECTOR_REDRAW: "Vector Art Conversion",
  COLOR_SEPARATION: "Color Separation / DTF",
  DTF_SCREEN_PRINT: "Color Separation / DTF",
};

export default async function AdminQuoteDetailPage({ params }: Props) {
  const { quoteId } = await params;

  const quote = await prisma.workflowOrder.findUnique({
    where: { id: quoteId },
    include: { clientUser: { select: { id: true, name: true, email: true, clientProfile: { select: { companyName: true, whatsapp: true } } } } },
  });

  if (!quote || quote.status !== "DRAFT") notFound();

  let meta: Record<string, unknown> = {};
  try { meta = JSON.parse(quote.notes ?? "{}") as Record<string, unknown>; } catch { /* empty */ }

  const serviceLabel = SERVICE_LABELS[quote.serviceType] ?? quote.serviceType.replaceAll("_", " ");
  const quoteStatus = quote.quoteStatus ?? "NEW";

  return (
    <div className="grid gap-6">
      <Breadcrumb className="mb-1">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href={"/admin/quotes" as Route}>Quotes</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{quote.orderNumber}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{quote.orderNumber}</p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{quote.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{serviceLabel} · {quote.clientUser.name ?? "Client"}</p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${QUOTE_TONES[quoteStatus] ?? QUOTE_TONES.NEW}`}>
            {QUOTE_LABELS[quoteStatus] ?? quoteStatus}
          </span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Client Information</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <Row label="Name" value={quote.clientUser.name ?? "—"} />
              <Row label="Email" value={quote.clientUser.email ?? "—"} />
              {quote.clientUser.clientProfile?.companyName && <Row label="Company" value={quote.clientUser.clientProfile.companyName} />}
              {quote.clientUser.clientProfile?.whatsapp && <Row label="WhatsApp" value={quote.clientUser.clientProfile.whatsapp} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quote Specs</CardTitle>
              <CardDescription>What the client submitted.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <Row label="Service" value={serviceLabel} />
              {quote.placement && <Row label="Placement" value={quote.placement} />}
              {quote.quantity > 1 && <Row label="Quantity" value={String(quote.quantity)} />}
              {quote.colorQuantity && <Row label="Thread colors" value={String(quote.colorQuantity)} />}
              {quote.fabricType && <Row label="Fabric" value={quote.fabricType} />}
              {(quote.designHeightIn || quote.designWidthIn) && <Row label="Dimensions" value={`${quote.designHeightIn ?? "?"}″ H × ${quote.designWidthIn ?? "?"}″ W`} />}
              {typeof meta.deliverySpeed === "string" && <Row label="Turnaround" value={meta.deliverySpeed.replaceAll("_", " ")} />}
              {quote.specialInstructions && (
                <div className="mt-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">Special Instructions</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{quote.specialInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Set Price & Send Quote</CardTitle>
              <CardDescription>Only Super Admin / Manager can price quotes.</CardDescription>
            </CardHeader>
            <CardContent>
              <QuotePricingPanel orderId={quote.id} currentPrice={quote.quotedPrice ? Number(quote.quotedPrice) : null} quoteStatus={quote.quoteStatus} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Workflow</CardTitle></CardHeader>
            <CardContent>
              <WorkflowTimeline orderStatus={quote.status} quoteStatus={quoteStatus as "NEW" | "UNDER_REVIEW" | "PRICE_SENT" | "CLIENT_ACCEPTED" | "CLIENT_REJECTED" | "CONVERTED_TO_ORDER" | "CANCELLED"} proofStatus="NOT_UPLOADED" paymentStatus="NOT_REQUIRED" filesUnlocked={false} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Manual Conversion</CardTitle>
              <CardDescription>Bypass quote flow and convert directly to an order.</CardDescription>
            </CardHeader>
            <CardContent><ConvertQuoteButton orderId={quote.id} /></CardContent>
          </Card>

          <Button asChild variant="outline" shape="pill" size="sm" className="w-full">
            <Link href={`/admin/orders/${quote.id}` as Route}>Open full order view</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
