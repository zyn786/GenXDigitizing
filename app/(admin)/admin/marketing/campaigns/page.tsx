import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { CampaignsManager } from "@/components/admin/campaigns-manager";

export const metadata: Metadata = { title: buildTitle("Campaigns") };

export default async function AdminCampaignsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (
    role !== "SUPER_ADMIN" &&
    role !== "MANAGER" &&
    role !== "MARKETING"
  ) {
    redirect("/admin/dashboard");
  }

  const isAdmin = role === "SUPER_ADMIN" || role === "MANAGER";

  const campaigns = await prisma.marketingCampaign.findMany({
    where: isAdmin ? undefined : { createdByUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
  });

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Marketing
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Campaigns</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          {isAdmin
            ? "Review, approve, and manage all marketing campaigns."
            : "Create campaigns and track their approval status."}
        </p>
      </section>

      <CampaignsManager
        initialCampaigns={campaigns}
        userRole={role ?? ""}
      />
    </div>
  );
}
