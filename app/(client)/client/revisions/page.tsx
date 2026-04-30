import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Revisions"),
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED_BY_CLIENT: "Requested by you",
  CREATED_BY_ADMIN: "Created by admin",
  UNDER_ADMIN_REVIEW: "Under admin review",
  ASSIGNED_TO_DESIGNER: "Assigned to designer",
  IN_PROGRESS: "In progress",
  REVISED_PROOF_UPLOADED: "Revised proof uploaded",
  SENT_TO_CLIENT: "Sent to client",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export default async function ClientRevisionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/revisions");

  const revisions = await prisma.orderRevision.findMany({
    where: { clientId: session.user.id },
    include: {
      order: { select: { id: true, orderNumber: true, title: true } },
    },
    orderBy: { requestedAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Revisions
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Revision requests
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Track open revision requests across your orders. Request changes to a
          delivered proof directly from the order detail page.
        </p>
      </section>

      {revisions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border/80 bg-card/70 py-16 text-center">
          <RefreshCw className="h-8 w-8 text-muted-foreground/40" />
          <div className="mt-3 text-sm font-medium">No open revisions</div>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            When you request changes to a delivered proof, those requests will
            appear here so you can track their status.
          </p>
          <Link
            href="/client/orders"
            className="mt-6 inline-flex h-9 items-center rounded-full border border-border/80 px-5 text-xs font-semibold transition hover:bg-secondary"
          >
            View my orders
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {revisions.map((rev) => (
            <div key={rev.id} className="rounded-2xl border border-border/80 bg-card/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium">
                  {rev.order.orderNumber} · Revision #{rev.revisionNumber}
                </div>
                <span className="text-xs text-muted-foreground">{STATUS_LABEL[rev.status] ?? rev.status}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{rev.revisionInstructions}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                Requested {new Date(rev.requestedAt).toLocaleString()}
              </div>
              <Link
                href={`/client/orders/${rev.order.id}`}
                className="mt-3 inline-flex h-8 items-center rounded-full border border-border/70 px-3 text-xs hover:bg-secondary"
              >
                Open order
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
