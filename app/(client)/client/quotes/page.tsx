import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { FileQuestion, ArrowRight } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { Card, CardContent } from "@/components/ui/card";
import { QuickOrderModal } from "@/components/client/quick-order-modal";

export const metadata: Metadata = { title: buildTitle("Quote Requests") };
export const dynamic = "force-dynamic";

const QUOTE_STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  NEW: { label: "Awaiting review", classes: "border-amber-400/30 bg-amber-500/10 text-amber-300" },
  UNDER_REVIEW: { label: "Under review", classes: "border-amber-400/30 bg-amber-500/10 text-amber-300" },
  PRICE_SENT: { label: "Price ready — action needed", classes: "border-blue-400/30 bg-blue-500/10 text-blue-300" },
  CLIENT_ACCEPTED: { label: "Accepted", classes: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" },
  CLIENT_REJECTED: { label: "Declined", classes: "border-red-400/30 bg-red-500/10 text-red-300" },
  CONVERTED_TO_ORDER: { label: "Order placed", classes: "border-teal-400/30 bg-teal-500/10 text-teal-300" },
  CANCELLED: { label: "Cancelled", classes: "border-white/10 bg-white/5 text-white/65" },
};

function parseServiceLabel(serviceType: string): string {
  const map: Record<string, string> = {
    EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
    VECTOR_ART: "Vector Art Conversion",
    COLOR_SEPARATION_DTF: "Color Separation / DTF Screen Setup",
    CUSTOM_PATCHES: "Custom Patches",
    // legacy values
    VECTOR_REDRAW: "Vector Art Conversion",
    COLOR_SEPARATION: "Color Separation / DTF Screen Setup",
    DTF_SCREEN_PRINT: "Color Separation / DTF Screen Setup",
  };
  return map[serviceType] ?? serviceType.replaceAll("_", " ");
}

export default async function QuoteRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/quotes");

  const quotes = await prisma.workflowOrder.findMany({
    where: { clientUserId: session.user.id, status: "DRAFT" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Client portal</div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Quote Requests</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Track pricing quotes for your design requests. Our team reviews each one and responds within 1 business day.
          </p>
        </div>
        <QuickOrderModal
          mode="quote"
          userName={session.user.name ?? ""}
          userEmail={session.user.email ?? ""}
          triggerLabel="New Quote"
        />
      </section>

      {quotes.length === 0 ? (
        <Card className="rounded-[1.5rem] border-border/80">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-secondary/60">
              <FileQuestion className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div className="text-sm font-medium">No quote requests yet</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Submit a quote and our team will respond with pricing within 1 business day.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <QuickOrderModal
                mode="quote"
                userName={session.user.name ?? ""}
                userEmail={session.user.email ?? ""}
                triggerLabel="Request a Quote"
                triggerClassName="inline-flex h-10 items-center rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
              />
              <Link
                href={"/client/dashboard" as Route}
                className="inline-flex h-10 items-center rounded-full border border-border/80 bg-secondary/60 px-5 text-xs font-medium transition hover:bg-secondary"
              >
                Go to Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {quotes.map((quote) => {
            const statusKey = quote.quoteStatus ?? "NEW";
            const statusCfg = QUOTE_STATUS_CONFIG[statusKey] ?? QUOTE_STATUS_CONFIG.NEW;
            const needsAction = statusKey === "PRICE_SENT";

            return (
              <Link
                key={quote.id}
                href={`/client/quotes/${quote.id}` as Route}
                className={`block rounded-[1.5rem] border bg-card/70 p-5 transition hover:bg-card ${needsAction ? "border-blue-400/30" : "border-border/80"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{quote.orderNumber}</span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.classes}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="mt-1.5 text-base font-semibold">{quote.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{parseServiceLabel(quote.serviceType)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {quote.quotedPrice != null && (
                      <div className="text-lg font-semibold">${Number(quote.quotedPrice).toFixed(2)}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(quote.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  </div>
                </div>

                {needsAction && (
                  <div className="mt-3 rounded-xl border border-blue-400/20 bg-blue-500/5 px-3 py-2 text-xs text-blue-300">
                    Your quote is ready — click to review and accept or decline.
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
