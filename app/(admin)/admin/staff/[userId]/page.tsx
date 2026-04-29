import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CommissionEditor } from "@/components/admin/commission-editor";
import { CommissionHistory } from "@/components/admin/commission-history";

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  return { title: buildTitle(user?.name ?? "Staff Member") };
}

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

export default async function StaffDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") redirect("/admin/dashboard");

  const { userId } = await params;

  const [member, commissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        staffProfile: true,
        assignedOrders: {
          where: { status: { in: ["SUBMITTED", "IN_PROGRESS", "PROOF_READY", "REVISION_REQUESTED"] } },
          select: { id: true, title: true, orderNumber: true, status: true },
        },
      },
    }),
    prisma.designerCommission.findMany({
      where: { designerId: userId },
      orderBy: { createdAt: "desc" },
      include: { order: { select: { orderNumber: true, title: true, estimatedPrice: true } } },
    }),
  ]);

  if (!member || member.role === "CLIENT") notFound();

  const pendingTotal = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((s, c) => s + Number(c.amount), 0);
  const paidTotal = commissions
    .filter((c) => c.status === "PAID")
    .reduce((s, c) => s + Number(c.amount), 0);

  const commissionRows = commissions.map((c) => ({
    id: c.id,
    orderId: c.orderId,
    orderNumber: c.order.orderNumber,
    orderTitle: c.order.title,
    estimatedPrice: c.order.estimatedPrice != null ? Number(c.order.estimatedPrice) : null,
    amount: Number(c.amount),
    rate: Number(c.rate),
    type: c.type as "PERCENTAGE" | "FLAT_RATE",
    status: c.status as "PENDING" | "PAID" | "CANCELLED",
    paidAt: c.paidAt?.toISOString() ?? null,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="grid gap-6">
      <section>
        <Link
          href={"/admin/staff" as Route}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Staff
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {member.staffProfile?.displayName ?? member.name ?? "Staff Member"}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{member.email}</span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                  ROLE_COLORS[member.role] ?? "border-border/80 bg-secondary/80 text-muted-foreground"
                }`}
              >
                {ROLE_LABELS[member.role] ?? member.role}
              </span>
              {member.staffProfile?.department && (
                <span className="text-xs text-muted-foreground">{member.staffProfile.department}</span>
              )}
            </div>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              member.isActive
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-400"
                : "border-border/80 bg-secondary/80 text-muted-foreground"
            }`}
          >
            {member.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </section>

      {/* Commission summary stats */}
      {member.role === "DESIGNER" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Active Jobs" value={String(member.assignedOrders.length)} />
          <StatCard label="Total Orders" value={String(commissions.length)} />
          <StatCard label="Pending Commission" value={`$${pendingTotal.toFixed(2)}`} accent="amber" />
          <StatCard label="Paid Commission" value={`$${paidTotal.toFixed(2)}`} accent="emerald" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        {/* Commission settings */}
        {member.role === "DESIGNER" && (
          <Card className="rounded-[1.5rem] border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Commission Rate</CardTitle>
              <CardDescription>
                Set how this designer earns per delivered order. A commission record is created automatically when
                an order is marked Delivered.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommissionEditor
                userId={userId}
                initialType={(member.staffProfile?.commissionType as "PERCENTAGE" | "FLAT_RATE") ?? "PERCENTAGE"}
                initialRate={Number(member.staffProfile?.commissionRate ?? 0)}
              />
            </CardContent>
          </Card>
        )}

        {/* Active jobs */}
        <Card className="rounded-[1.5rem] border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {member.assignedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active jobs.</p>
            ) : (
              <div className="grid gap-2">
                {member.assignedOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}` as Route}
                    className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/40 px-3 py-2.5 text-sm transition hover:bg-secondary/70"
                  >
                    <div>
                      <div className="font-medium">{o.title}</div>
                      <div className="text-xs text-muted-foreground">{o.orderNumber}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{o.status.replaceAll("_", " ")}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commission history */}
      {member.role === "DESIGNER" && (
        <CommissionHistory userId={userId} initialRows={commissionRows} />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "emerald";
}) {
  const valueClass =
    accent === "amber"
      ? "text-amber-400"
      : accent === "emerald"
      ? "text-emerald-400"
      : "text-foreground";
  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-card/70 px-4 py-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={`mt-1.5 text-2xl font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}
