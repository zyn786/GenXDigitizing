import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { FileQuestion, Clock, CheckCircle, XCircle, Send, ArrowRight } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { Card, CardContent } from "@/components/ui/card";
import type { QuoteStatus } from "@/lib/workflow/types";

export const metadata: Metadata = { title: buildTitle("Quote Requests") };
export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<
  string,
  { label: string; classes: string; Icon: React.ElementType }
> = {
  NEW:                { label: "Pending review",   classes: "border-amber-400/30 bg-amber-500/10 text-amber-300",   Icon: Clock         },
  UNDER_REVIEW:       { label: "Under review",     classes: "border-blue-400/30 bg-blue-500/10 text-blue-300",     Icon: Clock         },
  PRICE_SENT:         { label: "Price ready",      classes: "border-violet-400/30 bg-violet-500/10 text-violet-300", Icon: Send         },
  CLIENT_ACCEPTED:    { label: "Accepted",         classes: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300", Icon: CheckCircle },
  CLIENT_REJECTED:    { label: "Declined",         classes: "border-red-400/30 bg-red-500/10 text-red-300",        Icon: XCircle       },
  CONVERTED_TO_ORDER: { label: "Order created",   classes: "border-teal-400/30 bg-teal-500/10 text-teal-300",      Icon: CheckCircle   },
  CANCELLED:          { label: "Cancelled",        classes: "border-border/60 bg-secondary/40 text-muted-foreground", Icon: XCircle    },
};

function QuoteStatusBadge({ status }: { status: QuoteStatus | null }) {
  const cfg = STATUS_CONFIG[status ?? "NEW"] ?? STATUS_CONFIG.NEW;
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.classes}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function parseServiceLabel(serviceType: string): string {
  const map: Record<string, string> = {
    EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
    VECTOR_REDRAW:         "Vector Redraw",
    COLOR_SEPARATION:      "Color Separation",
    DTF_SCREEN_PRINT:      "DTF / Screen Print Setup",
  };
  return map[serviceType] ?? serviceType.replaceAll("_", " ");
}

function parseMeta(notes: string | null): { description?: string } {
  if (!notes) return {};
  try {
    return JSON.parse(notes) as { description?: string };
  } catch {
    return {};
  }
}

export default async function QuoteRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/quotes");

  const quotes = await prisma.workflowOrder.findMany({
    where: {
      clientUserId: session.user.id,
      OR: [
        { quoteStatus: { not: null } },
        { status: "DRAFT", notes: { contains: '"type":"quote"' } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      title: true,
      serviceType: true,
      quoteStatus: true,
      quotedAmount: true,
      quoteCurrency: true,
      pricedAt: true,
      notes: true,
      createdAt: true,
    },
  });

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Client portal</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Quote Requests</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Track pricing quotes you have requested. Our team reviews each one and responds within 1 business day.
        </p>
      </section>

      {quotes.length === 0 ? (
        <Card className="rounded-[1.5rem] border-border/80">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-secondary/60">
              <FileQuestion className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div className="text-sm font-medium">No quote requests yet</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Request a quote from your dashboard and our team will respond with pricing.
            </p>
            <Link
              href="/client/dashboard"
              className="mt-5 inline-flex h-10 items-center rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Go to Dashboard
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {quotes.map((quote) => {
            const meta = parseMeta(quote.notes);
            const isPriceSent = quote.quoteStatus === "PRICE_SENT";
            return (
              <Link
                key={quote.id}
                href={`/client/quotes/${quote.id}` as Route}
                className="block"
              >
                <Card
                  className={`rounded-[1.5rem] border-border/80 transition hover:border-primary/40 hover:bg-card/90 ${
                    isPriceSent ? "border-violet-500/30 bg-violet-500/5" : ""
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{quote.orderNumber}</span>
                          <QuoteStatusBadge status={quote.quoteStatus as QuoteStatus | null} />
                          {isPriceSent && (
                            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
                              Action required
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 text-base font-semibold">{quote.title}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {parseServiceLabel(quote.serviceType)}
                        </div>
                        {meta.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {meta.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          {quote.quotedAmount != null ? (
                            <div className="text-lg font-semibold">
                              {quote.quoteCurrency ?? "USD"} {Number(quote.quotedAmount).toFixed(2)}
                            </div>
                          ) : null}
                          <div className="mt-1 text-xs text-muted-foreground">
                            {new Date(quote.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
