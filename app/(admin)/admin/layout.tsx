import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
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

  return (
    <DashboardShell
      mode="admin"
      role={role}
      user={{ name: session.user.name, email: session.user.email }}
    >
      {children}
    </DashboardShell>
  );
}
