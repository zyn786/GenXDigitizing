import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = { title: buildTitle("Quote Requests") };

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
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Sales pipeline
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Quote Requests</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Quote requests submitted by clients awaiting review and conversion to active orders.
        </p>
      </section>

      {quotes.length === 0 ? (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          No quote requests yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
            <div>Request</div>
            <div>Client</div>
            <div>Service</div>
            <div>Contact</div>
            <div>Submitted</div>
          </div>

          <div className="divide-y divide-border/80">
            {quotes.map((q) => {
              let meta: { tier?: string; deliverySpeed?: string } = {};
              try { meta = JSON.parse(q.notes ?? "{}") as typeof meta; } catch { /* empty */ }

              return (
                <Link
                  key={q.id}
                  href={`/admin/orders/${q.id}` as Route}
                  className="grid grid-cols-1 gap-2 px-5 py-4 text-sm transition hover:bg-secondary/30 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] sm:items-center"
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
