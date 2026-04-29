import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { CouponsManager } from "@/components/admin/coupons-manager";

export const metadata: Metadata = { title: buildTitle("Coupons") };

export default async function AdminCouponsPage() {
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

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true, role: true } },
      approvedBy: { select: { name: true } },
    },
  });

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Promotions
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Coupons</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Manage discount codes. Marketing-created codes require admin approval before going live.
        </p>
      </section>

      <CouponsManager
        initialCoupons={coupons}
        userRole={role ?? ""}
      />
    </div>
  );
}
