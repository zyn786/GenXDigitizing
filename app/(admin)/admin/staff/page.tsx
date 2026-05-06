import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { buildTitle } from "@/lib/site";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("Staff") };

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", MANAGER: "Admin", DESIGNER: "Designer", CHAT_SUPPORT: "Support", MARKETING: "Marketing",
};

const ROLE_TONES: Record<string, string> = {
  SUPER_ADMIN: "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  MANAGER: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  DESIGNER: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CHAT_SUPPORT: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  MARKETING: "border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

export default async function AdminStaffPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") redirect("/admin/dashboard");

  const staff = await prisma.user.findMany({
    where: { role: { not: "CLIENT" } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: {
      staffProfile: { select: { displayName: true, department: true } },
      assignedOrders: { where: { status: { in: ["SUBMITTED", "IN_PROGRESS", "PROOF_READY", "REVISION_REQUESTED"] } }, select: { id: true } },
    },
  });

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Staff</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">Team management</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Staff</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            All staff accounts with their roles and active job counts.
          </p>
        </div>
        <Button asChild variant="default" shape="pill">
          <Link href={"/admin/staff/new" as Route}>
            <UserPlus className="h-4 w-4" />Add staff
          </Link>
        </Button>
      </section>

      {staff.length === 0 ? (
        <div className="rounded-[2rem] border border-border/60 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          No staff members yet. Add your first staff account.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
          <div className="hidden grid-cols-[2fr_1.5fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-border/60 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:grid">
            <div>Name</div><div>Email</div><div>Role</div><div>Department</div><div>Active Jobs</div><div>Status</div>
          </div>
          <div className="divide-y divide-border/60">
            {staff.map((member) => (
              <Link key={member.id} href={`/admin/staff/${member.id}` as Route} className="grid grid-cols-1 gap-2 px-5 py-4 text-sm transition hover:bg-muted/30 sm:grid-cols-[2fr_1.5fr_1fr_0.8fr_0.8fr_0.8fr] sm:items-center">
                <div>
                  <p className="font-medium">{member.staffProfile?.displayName ?? member.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground sm:hidden">{member.email}</p>
                </div>
                <p className="hidden truncate text-muted-foreground sm:block">{member.email}</p>
                <div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${ROLE_TONES[member.role] ?? "border-border/60 bg-muted/60 text-muted-foreground"}`}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{member.staffProfile?.department ?? "—"}</p>
                <p className={`text-sm font-medium ${member.assignedOrders.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                  {member.assignedOrders.length}
                </p>
                <div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${member.isActive ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-border/60 bg-muted/60 text-muted-foreground"}`}>
                    {member.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
