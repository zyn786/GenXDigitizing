import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = { title: buildTitle("My Revisions") };

export default async function DesignerRevisionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/admin/designer/revisions");
  if (session.user.role !== "DESIGNER") redirect("/admin");

  const revisions = await prisma.orderRevision.findMany({
    where: { assignedDesignerId: session.user.id },
    include: {
      order: { select: { id: true, orderNumber: true, title: true } },
    },
    orderBy: { requestedAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Designer workspace</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">My revisions</h1>
      </section>
      <div className="grid gap-3">
        {revisions.map((rev) => (
          <div key={rev.id} className="rounded-2xl border border-border/80 bg-card/70 p-4">
            <div className="text-sm font-medium">
              {rev.order.orderNumber} · Revision #{rev.revisionNumber}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{rev.revisionInstructions}</p>
            <div className="mt-1 text-xs text-muted-foreground">{rev.status}</div>
            <Link
              href={`/admin/designer/${rev.order.id}`}
              className="mt-3 inline-flex h-8 items-center rounded-full border border-border/70 px-3 text-xs hover:bg-secondary"
            >
              Open task
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
