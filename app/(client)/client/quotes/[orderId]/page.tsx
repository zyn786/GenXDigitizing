import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Clock, Send, RotateCcw } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { QuoteRespondPanel } from "@/components/client/quote-respond-panel";
import type { QuoteStatus } from "@/lib/workflow/types";

type Props = { params: Promise<{ orderId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return { title: buildTitle(`Quote ${orderId}`) };
}

const STATUS_CONFIG: Record<
  string,
  { label: string; desc: string; colorClass: string; Icon: React.ElementType }
> = {
  NEW:                { label: "Pending review",  desc: "We've received your request and will review it shortly.",             colorClass: "text-amber-400",   Icon: Clock         },
  UNDER_REVIEW:       { label: "Under review",    desc: "Our team is reviewing your request and preparing a quote.",           colorClass: "text-blue-400",    Icon: Clock         },
  PRICE_SENT:         { label: "Price ready",     desc: "We've reviewed your request and sent a price. Please respond below.", colorClass: "text-violet-400",  Icon: Send          },
  CLIENT_ACCEPTED:    { label: "Accepted",        desc: "You accepted this quote. We'll start production shortly.",             colorClass: "text-emerald-400", Icon: CheckCircle   },
  CLIENT_REJECTED:    { label: "Declined",        desc: "You declined this quote.",                                             colorClass: "text-red-400",     Icon: XCircle       },
  CONVERTED_TO_ORDER: { label: "Order created",  desc: "This quote has been converted to an active production order.",        colorClass: "text-teal-400",    Icon: CheckCircle   },
  CANCELLED:          { label: "Cancelled",       desc: "This quote has been cancelled.",                                      colorClass: "text-muted-foreground", Icon: XCircle   },
};

function parseServiceLabel(serviceType: string) {
  const map: Record<string, string> = {
    EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
    VECTOR_REDRAW:         "Vector Redraw",
    COLOR_SEPARATION:      "Color Separation",
    DTF_SCREEN_PRINT:      "DTF / Screen Print Setup",
  };
  return map[serviceType] ?? serviceType.replaceAll("_", " ");
}

function parseMeta(notes: string | null): {
  quantity?: number;
  description?: string;
  additionalNotes?: string;
  tierLabel?: string;
  addOns?: string[];
  preferredTurnaround?: string;
} {
  if (!notes) return {};
  try {
    return JSON.parse(notes);
  } catch {
    return {};
  }
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ClientQuoteDetailPage({ params }: Props) {
  const { orderId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/quotes");

  const quote = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    select: {
      id: true,
      orderNumber: true,
      title: true,
      serviceType: true,
      status: true,
      quoteStatus: true,
      quotedAmount: true,
      quoteCurrency: true,
      clientMessage: true,
      pricedAt: true,
      clientRespondedAt: true,
      quoteRejectionReason: true,
      notes: true,
      createdAt: true,
    },
  });

  if (!quote) notFound();

  const qs = (quote.quoteStatus as QuoteStatus | null) ?? "NEW";
  const cfg = STATUS_CONFIG[qs] ?? STATUS_CONFIG.NEW;
  const Icon = cfg.Icon;
  const meta = parseMeta(quote.notes);

  const canRespond = qs === "PRICE_SENT";
  const showPrice = quote.quotedAmount != null && (
    qs === "PRICE_SENT" ||
    qs === "CLIENT_ACCEPTED" ||
    qs === "CONVERTED_TO_ORDER"
  );

  return (
    <div className="grid gap-6">
      {/* Back */}
      <div>
        <Link
          href={"/client/quotes" as Route}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All quotes
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-muted-foreground">{quote.orderNumber}</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{quote.title}</h1>
            <div className="mt-1 text-sm text-muted-foreground">
              {parseServiceLabel(quote.serviceType)}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${cfg.colorClass}`}>
            <Icon className="h-4 w-4" />
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        {/* Main */}
        <div className="grid gap-4">
          {/* Status card */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardContent className="p-5">
              <p className="text-sm leading-6 text-muted-foreground">{cfg.desc}</p>
              {qs === "CLIENT_REJECTED" && quote.quoteRejectionReason && (
                <div className="mt-3 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm italic text-muted-foreground">
                  &ldquo;{quote.quoteRejectionReason}&rdquo;
                </div>
              )}
              {qs === "CONVERTED_TO_ORDER" && (
                <div className="mt-3">
                  <Link
                    href={"/client/orders" as Route}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    View my orders
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quoted price + respond */}
          {showPrice && (
            <Card className={`rounded-[1.5rem] ${canRespond ? "border-violet-500/30" : "border-border/80"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quoted price</CardTitle>
                {canRespond && (
                  <CardDescription>
                    Review this price and accept or decline below.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {quote.quoteCurrency ?? "USD"} {Number(quote.quotedAmount).toFixed(2)}
                  </span>
                </div>

                {quote.clientMessage && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-400">
                      Message from our team
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {quote.clientMessage}
                    </p>
                  </div>
                )}

                {canRespond && <QuoteRespondPanel quoteId={quote.id} />}

                {qs === "CLIENT_ACCEPTED" && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    You accepted this quote on {fmt(quote.clientRespondedAt?.toISOString())}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Original request details */}
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                {meta.tierLabel && <SpecRow label="Service tier" value={meta.tierLabel} />}
                {meta.quantity && <SpecRow label="Quantity" value={meta.quantity} />}
                {meta.preferredTurnaround && (
                  <SpecRow
                    label="Turnaround"
                    value={meta.preferredTurnaround.replaceAll("_", " ").toLowerCase()}
                  />
                )}
                {meta.addOns && meta.addOns.length > 0 && (
                  <SpecRow
                    label="Add-ons"
                    value={meta.addOns.map((a) => a.replaceAll("_", " ")).join(", ")}
                  />
                )}
              </div>
              {meta.description && (
                <div className="mt-3">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Description
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{meta.description}</p>
                </div>
              )}
              {meta.additionalNotes && (
                <div className="mt-3 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                  {meta.additionalNotes}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="grid gap-4 self-start">
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <TimelineRow
                label="Submitted"
                value={fmt(quote.createdAt.toISOString())}
              />
              {quote.pricedAt && (
                <TimelineRow label="Price sent" value={fmt(quote.pricedAt.toISOString())} />
              )}
              {quote.clientRespondedAt && (
                <TimelineRow
                  label={qs === "CLIENT_ACCEPTED" ? "Accepted" : "Declined"}
                  value={fmt(quote.clientRespondedAt.toISOString())}
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Help</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              <p className="leading-5">
                Questions about this quote? Open a support conversation and we&apos;ll
                get back to you within a few hours.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-sm">{value}</div>
    </div>
  );
}
