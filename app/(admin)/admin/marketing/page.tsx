import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = { title: buildTitle("Marketing Hub") };

export default async function AdminMarketingPage() {
  const [quotes, recentOrders, totalClients] = await Promise.all([
    prisma.workflowOrder.findMany({
      where: { status: "DRAFT" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        clientUser: {
          select: { name: true, email: true, clientProfile: { select: { companyName: true, whatsapp: true } } },
        },
      },
    }),
    prisma.workflowOrder.findMany({
      where: { status: { in: ["SUBMITTED", "IN_PROGRESS", "PROOF_READY"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, orderNumber: true, title: true, createdAt: true, status: true },
    }),
    prisma.user.count({ where: { role: "CLIENT" } }),
  ]);

  const conversionRate = totalClients > 0
    ? Math.round(((totalClients - quotes.length) / totalClients) * 100)
    : 0;

  return (
    <div className="grid gap-8">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Marketing
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Marketing Hub</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Quote pipeline, client follow-up, and conversion tracking for the sales team.
        </p>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Clients", value: totalClients, sub: "registered accounts" },
          { label: "Open Quotes", value: quotes.length, sub: "awaiting conversion" },
          { label: "Conversion Rate", value: `${conversionRate}%`, sub: "quote → order" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[1.75rem] border border-border/80 bg-card/70 p-5"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quote pipeline */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quote Pipeline</h2>
          <Link
            href={"/admin/quotes" as Route}
            className="text-xs text-muted-foreground transition hover:text-foreground"
          >
            View all →
          </Link>
        </div>

        {quotes.length === 0 ? (
          <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-10 text-center text-sm text-muted-foreground">
            No open quote requests.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
            <div className="hidden grid-cols-[2fr_1.5fr_1fr_1fr] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
              <div>Client</div>
              <div>Request</div>
              <div>Contact</div>
              <div>Date</div>
            </div>
            <div className="divide-y divide-border/80">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="grid grid-cols-1 gap-1 px-5 py-4 text-sm sm:grid-cols-[2fr_1.5fr_1fr_1fr] sm:items-center"
                >
                  <div>
                    <div className="font-medium">
                      {q.clientUser.name ?? "—"}
                      {q.clientUser.clientProfile?.companyName
                        ? ` · ${q.clientUser.clientProfile.companyName}`
                        : ""}
                    </div>
                    <div className="text-xs text-muted-foreground">{q.clientUser.email}</div>
                  </div>
                  <div className="text-muted-foreground">{q.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {q.clientUser.clientProfile?.whatsapp ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Recent orders (conversion wins) */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent Conversions</h2>
        {recentOrders.length === 0 ? (
          <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-10 text-center text-sm text-muted-foreground">
            No active orders yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-border/80 bg-card/70 px-5 py-4 text-sm"
              >
                <div>
                  <div className="font-medium">{o.title}</div>
                  <div className="text-xs text-muted-foreground">{o.orderNumber}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Campaign placeholder */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Campaigns</h2>
        <div className="rounded-[2rem] border border-dashed border-border/60 bg-card/40 px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Campaign management coming soon — discount codes, referral tracking, and client follow-ups.
          </p>
        </div>
      </section>
    </div>
  );
}
