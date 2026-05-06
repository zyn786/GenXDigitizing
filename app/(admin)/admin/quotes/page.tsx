import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("Quote Requests") };

const QUOTE_STATUS_CONFIG: Record<string, { label: string; tone: string }> = {
  NEW: { label: "Awaiting review", tone: "border-border/60 bg-muted/60 text-muted-foreground" },
  UNDER_REVIEW: { label: "Under review", tone: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  PRICE_SENT: { label: "Price sent", tone: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  CLIENT_ACCEPTED: { label: "Accepted", tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  CLIENT_REJECTED: { label: "Rejected", tone: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400" },
  CONVERTED_TO_ORDER: { label: "Converted", tone: "border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400" },
  CANCELLED: { label: "Cancelled", tone: "border-border/60 bg-muted/60 text-muted-foreground" },
};

export default async function AdminQuotesPage() {
  const quotes = await prisma.workflowOrder.findMany({
    where: { status: "DRAFT" },
    orderBy: { createdAt: "desc" },
    include: {
      clientUser: {
        select: { name: true, email: true, clientProfile: { select: { companyName: true, whatsapp: true } } },
      },
    },
  });

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Quotes</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Sales pipeline</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Quote Requests</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review and price incoming quote requests. Only Super Admin and Manager can set prices and send quotes.
        </p>
      </section>

      {quotes.length === 0 ? (
        <div className="rounded-[2rem] border border-border/60 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          No quote requests yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-border/60 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:grid">
            <div>Request</div>
            <div>Client</div>
            <div>Service</div>
            <div>Contact</div>
            <div>Status</div>
            <div>Submitted</div>
          </div>

          <div className="divide-y divide-border/60">
            {quotes.map((q) => {
              const statusCfg = QUOTE_STATUS_CONFIG[q.quoteStatus ?? "NEW"] ?? QUOTE_STATUS_CONFIG.NEW;
              return (
                <Link
                  key={q.id}
                  href={`/admin/quotes/${q.id}` as Route}
                  className="grid grid-cols-1 gap-2 px-5 py-4 text-sm transition hover:bg-muted/30 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-medium">{q.title}</p>
                    <p className="text-xs text-muted-foreground">{q.orderNumber}</p>
                  </div>
                  <p className="text-muted-foreground">
                    {q.clientUser.name ?? "—"}{q.clientUser.clientProfile?.companyName ? ` · ${q.clientUser.clientProfile.companyName}` : ""}
                  </p>
                  <p className="text-muted-foreground capitalize">{q.serviceType.replaceAll("_", " ").toLowerCase()}</p>
                  <p className="truncate text-xs text-muted-foreground">{q.clientUser.clientProfile?.whatsapp ?? q.clientUser.email ?? "—"}</p>
                  <div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.tone}`}>{statusCfg.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
