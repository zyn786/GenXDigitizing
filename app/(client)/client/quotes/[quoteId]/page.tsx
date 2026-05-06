import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClientQuoteRespond } from "@/components/workflow/client-quote-respond";
import { WorkflowTimeline } from "@/components/workflow/workflow-timeline";

type Props = { params: Promise<{ quoteId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { quoteId } = await params;
  return { title: buildTitle(`Quote ${quoteId}`) };
}

export default async function ClientQuoteDetailPage({ params }: Props) {
  const { quoteId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/quotes");

  const quote = await prisma.workflowOrder.findFirst({
    where: { id: quoteId, clientUserId: session.user.id },
  });

  if (!quote) notFound();

  const serviceLabel = {
    EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
    VECTOR_REDRAW: "Vector Redraw",
    COLOR_SEPARATION: "Color Separation",
    DTF_SCREEN_PRINT: "DTF / Screen Print",
  }[quote.serviceType] ?? quote.serviceType.replaceAll("_", " ");

  const isActive = quote.status !== "DRAFT";

  return (
    <div className="grid gap-6">
      <section>
        <Link
          href={"/client/quotes" as Route}
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
            <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl lg:text-3xl">{quote.title}</h1>
            <div className="mt-2 text-sm text-muted-foreground">{serviceLabel}</div>
          </div>
          <QuoteStatusBadge status={quote.quoteStatus ?? "NEW"} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="grid gap-4">
          {/* Quote response */}
          {!isActive && (
            <Card className="rounded-[1.5rem] border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quote response</CardTitle>
                <CardDescription>Review the pricing and accept or decline.</CardDescription>
              </CardHeader>
              <CardContent>
                <ClientQuoteRespond
                  orderId={quote.id}
                  quotedPrice={quote.quotedPrice ? Number(quote.quotedPrice) : 0}
                  quoteStatus={quote.quoteStatus ?? "NEW"}
                />
              </CardContent>
            </Card>
          )}

          {isActive && (
            <Card className="rounded-[1.5rem] border-border/80">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">This quote has been converted to an active order.</p>
                <Link
                  href={`/client/orders/${quote.id}` as Route}
                  className="mt-4 inline-flex h-9 items-center rounded-full bg-primary px-5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                >
                  View order
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quote details */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quote details</CardTitle>
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
              <Row label="Submitted" value={new Date(quote.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />

              {quote.quoteClientNotes && (
                <div className="mt-2 rounded-2xl border border-border/60 bg-secondary/40 p-3">
                  <div className="mb-1 text-xs text-muted-foreground">Notes</div>
                  <p className="text-sm">{quote.quoteClientNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 self-start">
          {/* Timeline */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Workflow status</CardTitle>
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

          <Link
            href={"/client/quotes" as Route}
            className="inline-flex h-9 items-center justify-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
          >
            Back to quotes
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
    NEW: "border-amber-400/30 bg-amber-500/10 text-amber-300",
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
    PRICE_SENT: "Price ready",
    CLIENT_ACCEPTED: "Accepted",
    CLIENT_REJECTED: "Declined",
    CONVERTED_TO_ORDER: "Order placed",
    CANCELLED: "Cancelled",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${map[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}
