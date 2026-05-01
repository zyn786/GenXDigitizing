import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuotePricingPanel } from "@/components/workflow/quote-pricing-panel";
import { WorkflowTimeline } from "@/components/workflow/workflow-timeline";
import { ConvertQuoteButton } from "@/components/workflow/convert-quote-button";

type Props = { params: Promise<{ quoteId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { quoteId } = await params;
  return { title: buildTitle(`Quote ${quoteId}`) };
}

export default async function AdminQuoteDetailPage({ params }: Props) {
  const { quoteId } = await params;

  const quote = await prisma.workflowOrder.findUnique({
    where: { id: quoteId },
    include: {
      clientUser: {
        select: {
          id: true,
          name: true,
          email: true,
          clientProfile: { select: { companyName: true, whatsapp: true } },
        },
      },
    },
  });

  if (!quote || quote.status !== "DRAFT") notFound();

  let meta: Record<string, unknown> = {};
  try { meta = JSON.parse(quote.notes ?? "{}") as Record<string, unknown>; } catch { /* empty */ }

  const serviceLabel = ({
    EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
    VECTOR_ART: "Vector Art Conversion",
    COLOR_SEPARATION_DTF: "Color Separation / DTF Screen Setup",
    CUSTOM_PATCHES: "Custom Patches",
    VECTOR_REDRAW: "Vector Art Conversion",
    COLOR_SEPARATION: "Color Separation / DTF Screen Setup",
    DTF_SCREEN_PRINT: "Color Separation / DTF Screen Setup",
  } as Record<string, string>)[quote.serviceType] ?? quote.serviceType.replaceAll("_", " ");

  return (
    <div className="grid gap-6">
      <section>
        <Link
          href={"/admin/quotes" as Route}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quote requests
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {quote.orderNumber}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{quote.title}</h1>
            <div className="mt-2 text-sm text-muted-foreground">
              {serviceLabel} · {quote.clientUser.name ?? "Client"}
            </div>
          </div>
          <QuoteStatusBadge status={quote.quoteStatus ?? "NEW"} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="grid gap-4">
          {/* Client info */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Client information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <Row label="Name" value={quote.clientUser.name ?? "—"} />
              <Row label="Email" value={quote.clientUser.email ?? "—"} />
              {quote.clientUser.clientProfile?.companyName && (
                <Row label="Company" value={quote.clientUser.clientProfile.companyName} />
              )}
              {quote.clientUser.clientProfile?.whatsapp && (
                <Row label="WhatsApp" value={quote.clientUser.clientProfile.whatsapp} />
              )}
            </CardContent>
          </Card>

          {/* Order specs */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quote specifications</CardTitle>
              <CardDescription>What the client submitted.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <Row label="Service" value={serviceLabel} />
              {quote.placement && <Row label="Placement" value={quote.placement} />}
              {quote.quantity > 1 && <Row label="Quantity" value={String(quote.quantity)} />}
              {quote.colorQuantity && <Row label="Thread colors" value={String(quote.colorQuantity)} />}
              {quote.fabricType && <Row label="Fabric" value={quote.fabricType} />}
              {(quote.designHeightIn || quote.designWidthIn) && (
                <Row
                  label="Dimensions"
                  value={`${quote.designHeightIn ?? "?"}″ H × ${quote.designWidthIn ?? "?"}″ W`}
                />
              )}
              {typeof meta.deliverySpeed === "string" && (
                <Row label="Turnaround" value={meta.deliverySpeed.replaceAll("_", " ")} />
              )}
              {quote.specialInstructions && (
                <div className="mt-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-400">
                    Special instructions
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {quote.specialInstructions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 self-start">
          {/* Pricing panel */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Set price & send quote</CardTitle>
              <CardDescription>Only Super Admin / Manager can price quotes.</CardDescription>
            </CardHeader>
            <CardContent>
              <QuotePricingPanel
                orderId={quote.id}
                currentPrice={quote.quotedPrice ? Number(quote.quotedPrice) : null}
                quoteStatus={quote.quoteStatus}
              />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Workflow timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowTimeline
                orderStatus={quote.status}
                quoteStatus={(quote.quoteStatus as "NEW" | "UNDER_REVIEW" | "PRICE_SENT" | "CLIENT_ACCEPTED" | "CLIENT_REJECTED" | "CONVERTED_TO_ORDER" | "CANCELLED") ?? "NEW"}
                proofStatus="NOT_UPLOADED"
                paymentStatus="NOT_REQUIRED"
                filesUnlocked={false}
              />
            </CardContent>
          </Card>

          {/* Convert button always available on draft quotes as fallback */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Manual conversion</CardTitle>
              <CardDescription>Bypass quote flow and convert directly to an order.</CardDescription>
            </CardHeader>
            <CardContent>
              <ConvertQuoteButton orderId={quote.id} />
            </CardContent>
          </Card>

          <Link
            href={`/admin/orders/${quote.id}` as Route}
            className="inline-flex h-9 items-center justify-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
          >
            Open full order view
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: "border-white/10 bg-white/5 text-white/60",
    UNDER_REVIEW: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    PRICE_SENT: "border-blue-400/30 bg-blue-500/10 text-blue-300",
    CLIENT_ACCEPTED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    CLIENT_REJECTED: "border-red-400/30 bg-red-500/10 text-red-300",
    CONVERTED_TO_ORDER: "border-teal-400/30 bg-teal-500/10 text-teal-300",
    CANCELLED: "border-white/10 bg-white/5 text-white/40",
  };
  const labels: Record<string, string> = {
    NEW: "Awaiting review",
    UNDER_REVIEW: "Under review",
    PRICE_SENT: "Price sent",
    CLIENT_ACCEPTED: "Accepted",
    CLIENT_REJECTED: "Rejected",
    CONVERTED_TO_ORDER: "Converted",
    CANCELLED: "Cancelled",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${map[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}
