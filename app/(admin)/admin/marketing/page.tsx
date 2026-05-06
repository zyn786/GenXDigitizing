import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("Marketing Hub") };

export default async function AdminMarketingPage() {
  const [quotes, recentOrders, totalClients] = await Promise.all([
    prisma.workflowOrder.findMany({ where: { status: "DRAFT" }, orderBy: { createdAt: "desc" }, take: 10, include: { clientUser: { select: { name: true, email: true, clientProfile: { select: { companyName: true, whatsapp: true } } } } } }),
    prisma.workflowOrder.findMany({ where: { status: { in: ["SUBMITTED", "IN_PROGRESS", "PROOF_READY"] } }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, orderNumber: true, title: true, createdAt: true, status: true } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
  ]);

  const conversionRate = totalClients > 0 ? Math.round(((totalClients - quotes.length) / totalClients) * 100) : 0;

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Marketing Hub</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Marketing</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Marketing Hub</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Quote pipeline, client follow-up, and conversion tracking for the sales team.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
        {[
          { label: "Total Clients", value: totalClients, sub: "registered accounts" },
          { label: "Open Quotes", value: quotes.length, sub: "awaiting conversion" },
          { label: "Conversion Rate", value: `${conversionRate}%`, sub: "quote → order" },
        ].map((s) => (
          <div key={s.label} className="rounded-[1.75rem] border border-border/60 bg-card/70 p-3 md:p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground md:text-xs md:tracking-[0.18em]">{s.label}</p>
            <p className="mt-1.5 text-xl font-semibold tracking-tight md:mt-2 md:text-3xl">{s.value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground md:mt-1 md:text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quote Pipeline</h2>
          <Link href={"/admin/quotes" as Route} className="text-xs text-muted-foreground transition hover:text-foreground">View all →</Link>
        </div>
        {quotes.length === 0 ? (
          <div className="rounded-[2rem] border border-border/60 bg-card/70 px-5 py-10 text-center text-sm text-muted-foreground">No open quote requests.</div>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
            <div className="hidden grid-cols-[2fr_1.5fr_1fr_1fr] gap-4 border-b border-border/60 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:grid">
              <div>Client</div><div>Request</div><div>Contact</div><div>Date</div>
            </div>
            <div className="divide-y divide-border/60">
              {quotes.map((q) => (
                <div key={q.id} className="grid grid-cols-1 gap-1 px-5 py-4 text-sm sm:grid-cols-[2fr_1.5fr_1fr_1fr] sm:items-center">
                  <div>
                    <p className="font-medium">{q.clientUser.name ?? "—"}{q.clientUser.clientProfile?.companyName ? ` · ${q.clientUser.clientProfile.companyName}` : ""}</p>
                    <p className="text-xs text-muted-foreground">{q.clientUser.email}</p>
                  </div>
                  <p className="text-muted-foreground">{q.title}</p>
                  <p className="text-xs text-muted-foreground">{q.clientUser.clientProfile?.whatsapp ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent Conversions</h2>
        {recentOrders.length === 0 ? (
          <div className="rounded-[2rem] border border-border/60 bg-card/70 px-5 py-10 text-center text-sm text-muted-foreground">No active orders yet.</div>
        ) : (
          <div className="grid gap-3">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-border/60 bg-card/70 px-5 py-4 text-sm">
                <div>
                  <p className="font-medium">{o.title}</p>
                  <p className="text-xs text-muted-foreground">{o.orderNumber}</p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Campaigns</h2>
        <div className="rounded-[2rem] border border-dashed border-border/60 bg-card/40 px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground">Campaign management coming soon — discount codes, referral tracking, and client follow-ups.</p>
        </div>
      </section>
    </div>
  );
}
