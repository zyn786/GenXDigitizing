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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("My Dashboard") };

const SERVICE_LABELS: Record<string, string> = {
  EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
  VECTOR_ART: "Vector Art Conversion",
  COLOR_SEPARATION_DTF: "Color Separation / DTF",
  CUSTOM_PATCHES: "Custom Patches",
  VECTOR_REDRAW: "Vector Art Conversion",
  COLOR_SEPARATION: "Color Separation / DTF",
  DTF_SCREEN_PRINT: "Color Separation / DTF",
};

export default async function DesignerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const designerId = session.user.id;

  const [activeJobs, commissions, staffProfile] = await Promise.all([
    prisma.workflowOrder.findMany({
      where: { assignedToUserId: designerId, status: { notIn: ["DRAFT", "CANCELLED", "CLOSED", "DELIVERED"] } },
      orderBy: { dueAt: "asc" },
      include: { clientUser: { select: { name: true, clientProfile: { select: { companyName: true } } } } },
    }),
    prisma.designerCommission.findMany({ where: { designerId }, select: { amount: true, status: true } }),
    prisma.staffProfile.findUnique({ where: { userId: designerId }, select: { displayName: true, commissionType: true, commissionRate: true } }),
  ]);

  const completedCount = await prisma.workflowOrder.count({ where: { assignedToUserId: designerId, status: { in: ["DELIVERED", "CLOSED"] } } });
  const pendingEarnings = commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + Number(c.amount), 0);
  const totalEarned = commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={"/admin/designer" as Route}>Designer Studio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>My Jobs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <section>
        <p className="section-eyebrow">Designer workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {staffProfile?.displayName ? `Welcome, ${staffProfile.displayName.split(" ")[0]}` : "Dashboard"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Your active jobs, production queue, and earnings at a glance.</p>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Briefcase className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Active Jobs</p>
              <p className="text-2xl font-semibold">{activeJobs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500"><CheckCircle2 className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-2xl font-semibold">{completedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500"><Clock className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Earnings</p>
              <p className="text-2xl font-semibold">${pendingEarnings.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-500"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Earned</p>
              <p className="text-2xl font-semibold">${totalEarned.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission rate */}
      {staffProfile && (
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Your commission rate:{" "}
          <span className="font-semibold text-foreground">
            {staffProfile.commissionType === "PERCENTAGE" ? `${Number(staffProfile.commissionRate)}% of order value` : `$${Number(staffProfile.commissionRate)} flat per order`}
          </span>
          {" · "}
          <Link href={"/admin/designer/earnings" as Route} className="text-primary hover:underline">View earnings →</Link>
        </div>
      )}

      {/* Active jobs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {activeJobs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No active jobs. Check back soon.</p>
          ) : (
            <div className="grid gap-3">
              {activeJobs.map((job) => {
                // eslint-disable-next-line react-hooks/purity
                const now = Date.now();
                const due = job.dueAt ? job.dueAt.getTime() - now : null;
                const dueLabel = !job.dueAt ? "No due date" : due !== null && due < 0 ? "Overdue" : due !== null && due < 86_400_000 ? `Due in ${Math.round(due / 3_600_000)}h` : `Due ${job.dueAt.toLocaleDateString()}`;
                const isOverdue = due !== null && due < 0;
                const isUrgent = due !== null && due >= 0 && due < 86_400_000;

                return (
                  <Link
                    key={job.id}
                    href={`/admin/designer/${job.id}` as Route}
                    className="grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 transition hover:bg-muted/60 sm:grid-cols-[2fr_1fr_1fr_1fr]"
                  >
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{job.orderNumber} · {SERVICE_LABELS[job.serviceType] ?? job.serviceType}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {job.clientUser.name ?? "—"}{job.clientUser.clientProfile?.companyName ? ` · ${job.clientUser.clientProfile.companyName}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center"><OrderStatusBadge status={mapDbStatus(job.status)} /></div>
                    <div className="flex flex-col justify-center">
                      <div className="h-1.5 rounded-full bg-secondary">
                        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${Math.max(4, job.progressPercent)}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{job.progressPercent}%</p>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-xs font-medium ${isOverdue ? "text-red-500" : isUrgent ? "text-amber-500" : "text-muted-foreground"}`}>{dueLabel}</span>
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
