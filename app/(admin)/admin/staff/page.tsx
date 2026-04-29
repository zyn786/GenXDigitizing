import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = { title: buildTitle("Staff") };

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Admin",
  DESIGNER: "Designer",
  CHAT_SUPPORT: "Support",
  MARKETING: "Marketing",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300",
  MANAGER: "border-blue-400/30 bg-blue-500/10 text-blue-300",
  DESIGNER: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  CHAT_SUPPORT: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  MARKETING: "border-teal-400/30 bg-teal-500/10 text-teal-300",
};

export default async function AdminStaffPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") {
    redirect("/admin/dashboard");
  }

  const staff = await prisma.user.findMany({
    where: { role: { not: "CLIENT" } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: {
      staffProfile: { select: { displayName: true, department: true } },
      assignedOrders: {
        where: { status: { in: ["SUBMITTED", "IN_PROGRESS", "PROOF_READY", "REVISION_REQUESTED"] } },
        select: { id: true },
      },
    },
  });

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
            Team management
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Staff</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            All staff accounts with their roles and active job counts.
          </p>
        </div>
        {(role === "SUPER_ADMIN" || role === "MANAGER") && (
          <Link
            href={"/admin/staff/new" as Route}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Add staff
          </Link>
        )}
      </section>

      {staff.length === 0 ? (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          No staff members yet. Add your first staff account.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="hidden grid-cols-[2fr_1.5fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Department</div>
            <div>Active Jobs</div>
            <div>Status</div>
          </div>

          <div className="divide-y divide-border/80">
            {staff.map((member) => (
              <Link
                key={member.id}
                href={`/admin/staff/${member.id}` as Route}
                className="grid grid-cols-1 gap-2 px-5 py-4 text-sm transition hover:bg-secondary/30 sm:grid-cols-[2fr_1.5fr_1fr_0.8fr_0.8fr_0.8fr] sm:items-center"
              >
                <div>
                  <div className="font-medium">
                    {member.staffProfile?.displayName ?? member.name ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground sm:hidden">{member.email}</div>
                </div>
                <div className="hidden truncate text-muted-foreground sm:block">
                  {member.email}
                </div>
                <div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                      ROLE_COLORS[member.role] ?? "border-border/80 bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {member.staffProfile?.department ?? "—"}
                </div>
                <div className="text-sm font-medium">
                  {member.assignedOrders.length > 0 ? (
                    <span className="text-amber-400">{member.assignedOrders.length}</span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </div>
                <div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                      member.isActive
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-400"
                        : "border-border/80 bg-secondary/80 text-muted-foreground"
                    }`}
                  >
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
