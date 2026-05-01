import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = { title: buildTitle("Quote Requests") };

const QUOTE_STATUS_CONFIG: Record<string, { label: string; tone: string }> = {
  NEW: { label: "Awaiting review", tone: "border-white/10 bg-white/5 text-white/60" },
  UNDER_REVIEW: { label: "Under review", tone: "border-amber-400/30 bg-amber-500/10 text-amber-300" },
  PRICE_SENT: { label: "Price sent", tone: "border-blue-400/30 bg-blue-500/10 text-blue-300" },
  CLIENT_ACCEPTED: { label: "Accepted", tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" },
  CLIENT_REJECTED: { label: "Rejected", tone: "border-red-400/30 bg-red-500/10 text-red-300" },
  CONVERTED_TO_ORDER: { label: "Converted", tone: "border-teal-400/30 bg-teal-500/10 text-teal-300" },
  CANCELLED: { label: "Cancelled", tone: "border-white/10 bg-white/5 text-white/40" },
};

export default async function AdminQuotesPage() {
  const quotes = await prisma.workflowOrder.findMany({
    where: { status: "DRAFT" },
    orderBy: { createdAt: "desc" },
    include: {
      clientUser: {
        select: {
          name: true,
          email: true,
          clientProfile: { select: { companyName: true, whatsapp: true } },
        },
      },
    },
  });

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Sales pipeline</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Quote Requests</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Review and price incoming quote requests. Only Super Admin and Manager can set prices and send quotes.
        </p>
      </section>

      {quotes.length === 0 ? (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          No quote requests yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
            <div>Request</div>
            <div>Client</div>
            <div>Service</div>
            <div>Contact</div>
            <div>Status</div>
            <div>Submitted</div>
          </div>

          <div className="divide-y divide-border/80">
            {quotes.map((q) => {
              const statusCfg = QUOTE_STATUS_CONFIG[q.quoteStatus ?? "NEW"] ?? QUOTE_STATUS_CONFIG.NEW;
              return (
                <Link
                  key={q.id}
                  href={`/admin/quotes/${q.id}` as Route}
                  className="grid grid-cols-1 gap-2 px-5 py-4 text-sm transition hover:bg-secondary/30 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="font-medium">{q.title}</div>
                    <div className="text-xs text-muted-foreground">{q.orderNumber}</div>
                  </div>
                  <div className="text-muted-foreground">
                    {q.clientUser.name ?? "—"}
                    {q.clientUser.clientProfile?.companyName
                      ? ` · ${q.clientUser.clientProfile.companyName}`
                      : ""}
                  </div>
                  <div className="text-muted-foreground capitalize">
                    {q.serviceType.replaceAll("_", " ").toLowerCase()}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {q.clientUser.clientProfile?.whatsapp ?? q.clientUser.email ?? "—"}
                  </div>
                  <div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.tone}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
