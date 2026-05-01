import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const allowedAdminRoles = new Set([
  "SUPER_ADMIN",
  "MANAGER",
  "DESIGNER",
  "CHAT_SUPPORT",
  "MARKETING",
]);

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?next=/admin");
  }

  if (!allowedAdminRoles.has(String(session.user.role))) {
    redirect("/client/orders");
  }

  const role = session.user.role ?? null;
  const userId = session.user.id!;

  // Compute notification badge counts
  const badges: Record<string, number> = {};

  if (role === "SUPER_ADMIN" || role === "MANAGER") {
    const [submittedOrders, newQuotes] = await Promise.all([
      prisma.workflowOrder.count({ where: { status: "SUBMITTED" } }),
      prisma.workflowOrder.count({ where: { quoteStatus: "NEW" } }),
    ]);
    if (submittedOrders > 0) badges["/admin/orders"] = submittedOrders;
    if (newQuotes > 0) badges["/admin/quotes"] = newQuotes;
  }

  if (role === "DESIGNER") {
    const activeJobs = await prisma.workflowOrder.count({
      where: {
        assignedToUserId: userId,
        status: { in: ["IN_PROGRESS", "SUBMITTED"] },
      },
    });
    if (activeJobs > 0) badges["/admin/designer"] = activeJobs;
  }

  return (
    <DashboardShell
      mode="admin"
      role={role}
      user={{ name: session.user.name, email: session.user.email }}
      badges={badges}
    >
      {children}
    </DashboardShell>
  );
}
