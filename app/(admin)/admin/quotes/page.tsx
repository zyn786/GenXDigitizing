import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { Clock, CheckCircle, XCircle, Send, RefreshCw, AlertCircle } from "lucide-react";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import type { QuoteStatus } from "@/lib/workflow/types";

export const metadata: Metadata = { title: buildTitle("Quote Requests") };
export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<
  string,
  { label: string; classes: string; Icon: React.ElementType }
> = {
  NEW:                { label: "New",              classes: "border-amber-400/30 bg-amber-500/10 text-amber-300",   Icon: AlertCircle   },
  UNDER_REVIEW:       { label: "Under Review",     classes: "border-blue-400/30 bg-blue-500/10 text-blue-300",     Icon: Clock         },
  PRICE_SENT:         { label: "Price Sent",        classes: "border-violet-400/30 bg-violet-500/10 text-violet-300", Icon: Send         },
  CLIENT_ACCEPTED:    { label: "Accepted",          classes: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300", Icon: CheckCircle },
  CLIENT_REJECTED:    { label: "Declined",          classes: "border-red-400/30 bg-red-500/10 text-red-300",       Icon: XCircle       },
  CONVERTED_TO_ORDER: { label: "Converted",         classes: "border-teal-400/30 bg-teal-500/10 text-teal-300",    Icon: CheckCircle   },
  CANCELLED:          { label: "Cancelled",         classes: "border-border/60 bg-secondary/40 text-muted-foreground", Icon: XCircle    },
};

function QuoteStatusBadge({ status }: { status: QuoteStatus | null }) {
  const cfg = STATUS_CONFIG[status ?? "NEW"] ?? STATUS_CONFIG.NEW;
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${cfg.classes}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function parseServiceLabel(serviceType: string) {
  const map: Record<string, string> = {
    EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
    VECTOR_REDRAW:         "Vector Redraw",
    COLOR_SEPARATION:      "Color Separation",
    DTF_SCREEN_PRINT:      "DTF / Screen Print",
  };
  return map[serviceType] ?? serviceType.replaceAll("_", " ");
}

export default async function AdminQuotesPage() {
  const quotes = await prisma.workflowOrder.findMany({
    where: {
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
      status: true,
      quoteStatus: true,
      quotedAmount: true,
      quoteCurrency: true,
      pricedAt: true,
      clientRespondedAt: true,
      createdAt: true,
      clientUser: {
        select: {
          name: true,
          email: true,
          clientProfile: { select: { companyName: true, whatsapp: true } },
        },
      },
    },
  });

  const pending = quotes.filter(
    (q) => !q.quoteStatus || q.quoteStatus === "NEW" || q.quoteStatus === "UNDER_REVIEW"
  );
  const active = quotes.filter(
    (q) => q.quoteStatus === "PRICE_SENT" || q.quoteStatus === "CLIENT_ACCEPTED"
  );
  const closed = quotes.filter(
    (q) =>
      q.quoteStatus === "CLIENT_REJECTED" ||
      q.quoteStatus === "CONVERTED_TO_ORDER" ||
      q.quoteStatus === "CANCELLED"
  );

  return (
    <div className="grid gap-8">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Sales pipeline</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Quote Requests</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Review incoming quote requests, set pricing, and send quotes to clients.
        </p>
      </section>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Needs Review", count: pending.length, color: "amber" },
          { label: "Awaiting Client", count: active.filter((q) => q.quoteStatus === "PRICE_SENT").length, color: "violet" },
          { label: "Client Accepted", count: active.filter((q) => q.quoteStatus === "CLIENT_ACCEPTED").length, color: "emerald" },
          { label: "Total", count: quotes.length, color: "default" },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-border/80 bg-card/70 px-4 py-3"
          >
            <div className="text-2xl font-semibold">{count}</div>
            <div className={`mt-0.5 text-xs ${color === "default" ? "text-muted-foreground" : `text-${color}-400`}`}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          No quote requests yet.
        </div>
      ) : (
        <div className="grid gap-6">
          {[
            { title: "Needs attention", rows: pending },
            { title: "Active quotes", rows: active },
            { title: "Closed", rows: closed },
          ]
            .filter(({ rows }) => rows.length > 0)
            .map(({ title, rows }) => (
              <div key={title}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {title}
                </h2>
                <div className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/70">
                  <div className="hidden grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
                    <div>Request</div>
                    <div>Client</div>
                    <div>Service</div>
                    <div>Quoted</div>
                    <div>Status</div>
                    <div>Submitted</div>
                  </div>
                  <div className="divide-y divide-border/80">
                    {rows.map((q) => (
                      <Link
                        key={q.id}
                        href={`/admin/orders/${q.id}` as Route}
                        className="grid grid-cols-1 gap-2 px-5 py-4 text-sm transition hover:bg-secondary/30 sm:grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr] sm:items-center"
                      >
                        <div>
                          <div className="font-medium">{q.title}</div>
                          <div className="text-xs text-muted-foreground">{q.orderNumber}</div>
                        </div>
                        <div className="text-muted-foreground">
                          <div>{q.clientUser.name ?? "—"}</div>
                          {q.clientUser.clientProfile?.companyName && (
                            <div className="text-xs">{q.clientUser.clientProfile.companyName}</div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {parseServiceLabel(q.serviceType)}
                        </div>
                        <div className="font-medium">
                          {q.quotedAmount != null
                            ? `${q.quoteCurrency ?? "USD"} ${Number(q.quotedAmount).toFixed(2)}`
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                        <div>
                          <QuoteStatusBadge status={q.quoteStatus as QuoteStatus | null} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
