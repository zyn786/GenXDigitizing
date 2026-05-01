import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { PortfolioManager } from "@/components/admin/portfolio-manager";

export const metadata: Metadata = { title: buildTitle("Portfolio") };

export default async function AdminPortfolioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const items = await prisma.portfolioItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      createdBy:  { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
  });

  const pendingCount = items.filter((i) => i.approvalStatus === "PENDING_APPROVAL").length;

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Content management
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Add, edit, feature, hide, or delete portfolio items.
          {session.user.role !== "SUPER_ADMIN" &&
            " Uploaded items are sent for Super Admin review before appearing publicly."}
        </p>
        {pendingCount > 0 && session.user.role === "SUPER_ADMIN" && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            {pendingCount} item{pendingCount !== 1 ? "s" : ""} pending approval
          </div>
        )}
      </section>

      <PortfolioManager initialItems={items} userRole={session.user.role ?? "MANAGER"} />
    </div>
  );
}
