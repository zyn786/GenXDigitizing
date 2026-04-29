import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { Briefcase, CheckCircle2, Clock, DollarSign } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/workflow/order-status-badge";
import { mapDbStatus } from "@/lib/workflow/repository";

export const metadata: Metadata = { title: buildTitle("My Dashboard") };

export default async function DesignerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const designerId = session.user.id;

  const [activeJobs, allJobs, commissions, staffProfile] = await Promise.all([
    prisma.workflowOrder.findMany({
      where: {
        assignedToUserId: designerId,
        status: { notIn: ["DRAFT", "CANCELLED", "CLOSED", "DELIVERED"] },
      },
      orderBy: { dueAt: "asc" },
      include: {
        clientUser: { select: { name: true, clientProfile: { select: { companyName: true } } } },
      },
    }),
    prisma.workflowOrder.count({ where: { assignedToUserId: designerId } }),
    prisma.designerCommission.findMany({
      where: { designerId },
      select: { amount: true, status: true },
    }),
    prisma.staffProfile.findUnique({
      where: { userId: designerId },
      select: { displayName: true, commissionType: true, commissionRate: true },
    }),
  ]);

  const completedCount = await prisma.workflowOrder.count({
    where: { assignedToUserId: designerId, status: { in: ["DELIVERED", "CLOSED"] } },
  });

  const pendingEarnings = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((s, c) => s + Number(c.amount), 0);

  const totalEarned = commissions
    .filter((c) => c.status === "PAID")
    .reduce((s, c) => s + Number(c.amount), 0);

  const SERVICE_LABELS: Record<string, string> = {
    EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
    VECTOR_REDRAW: "Vector Redraw",
    COLOR_SEPARATION: "Color Separation",
    DTF_SCREEN_PRINT: "DTF / Screen Print",
  };

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Designer workspace
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          {staffProfile?.displayName ? `Welcome, ${staffProfile.displayName.split(" ")[0]}` : "Dashboard"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Your active jobs, production queue, and earnings at a glance.
        </p>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Briefcase className="h-4 w-4" />}
          label="Active Jobs"
          value={String(activeJobs.length)}
          color="primary"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Completed"
          value={String(completedCount)}
          color="emerald"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Pending Earnings"
          value={`$${pendingEarnings.toFixed(2)}`}
          color="amber"
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total Earned"
          value={`$${totalEarned.toFixed(2)}`}
          color="violet"
        />
      </div>

      {/* Commission rate info */}
      {staffProfile && (
        <div className="rounded-2xl border border-border/80 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
          Your commission rate:{" "}
          <span className="font-semibold text-foreground">
            {staffProfile.commissionType === "PERCENTAGE"
              ? `${Number(staffProfile.commissionRate)}% of order value`
              : `$${Number(staffProfile.commissionRate)} flat per order`}
          </span>
          {" · "}
          <Link href={"/admin/designer/earnings" as Route} className="text-primary hover:underline">
            View earnings →
          </Link>
        </div>
      )}

      {/* Active jobs */}
      <Card className="rounded-[1.5rem] border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {activeJobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No active jobs. Check back soon.
            </p>
          ) : (
            <div className="grid gap-3">
              {activeJobs.map((job) => {
                const now = Date.now();
                const due = job.dueAt ? job.dueAt.getTime() - now : null;
                const dueLabel = !job.dueAt
                  ? "No due date"
                  : due !== null && due < 0
                  ? "Overdue"
                  : due !== null && due < 86_400_000
                  ? `Due in ${Math.round(due / 3_600_000)}h`
                  : `Due ${job.dueAt.toLocaleDateString()}`;
                const isOverdue = due !== null && due < 0;
                const isUrgent = due !== null && due >= 0 && due < 86_400_000;

                return (
                  <Link
                    key={job.id}
                    href={`/admin/designer/${job.id}` as Route}
                    className="group grid gap-3 rounded-2xl border border-border/80 bg-card/70 p-4 transition hover:border-border hover:bg-card sm:grid-cols-[2fr_1fr_1fr_1fr]"
                  >
                    <div>
                      <div className="font-medium">{job.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {job.orderNumber} · {SERVICE_LABELS[job.serviceType] ?? job.serviceType}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {job.clientUser.name ?? "—"}
                        {job.clientUser.clientProfile?.companyName
                          ? ` · ${job.clientUser.clientProfile.companyName}`
                          : ""}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <OrderStatusBadge status={mapDbStatus(job.status)} />
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="h-1.5 rounded-full bg-secondary">
                        <div
                          className="h-1.5 rounded-full bg-primary transition-all"
                          style={{ width: `${Math.max(4, job.progressPercent)}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{job.progressPercent}%</div>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`text-xs font-medium ${
                          isOverdue
                            ? "text-red-400"
                            : isUrgent
                            ? "text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {dueLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "primary" | "emerald" | "amber" | "violet";
}) {
  const iconColors = {
    primary: "text-primary bg-primary/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    violet: "text-violet-400 bg-violet-500/10",
  };
  const valueColors = {
    primary: "text-foreground",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    violet: "text-violet-400",
  };
  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-card/70 p-4">
      <div className={`mb-2 inline-flex rounded-xl p-2 ${iconColors[color]}`}>{icon}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${valueColors[color]}`}>{value}</div>
    </div>
  );
}
