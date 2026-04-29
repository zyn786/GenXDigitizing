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
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Content management
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Add, edit, feature, hide, or delete portfolio items. Changes reflect on the public
          portfolio page immediately.
        </p>
      </section>

      <PortfolioManager initialItems={items} />
    </div>
  );
}
