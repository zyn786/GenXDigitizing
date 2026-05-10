import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { getPricingCatalog, filterApprovedCatalog } from "@/lib/pricing/catalog";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OrderWizard } from "@/components/orders/order-wizard";

export const metadata: Metadata = { title: buildTitle("Place Order") };
export const dynamic = "force-dynamic";

async function getUnreadSupportCount(userId: string): Promise<number> {
  try {
    const result = await prisma.chatParticipant.aggregate({
      where: { userId, unreadCount: { gt: 0 } },
      _sum: { unreadCount: true },
    });
    return result._sum.unreadCount ?? 0;
  } catch {
    return 0;
  }
}

export default async function OrdersPage() {
  const session = await auth();
  const catalog = filterApprovedCatalog(await getPricingCatalog());

  if (session?.user?.id) {
    const [dbUser, unreadCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, onboardingComplete: true },
      }),
      getUnreadSupportCount(session.user.id),
    ]);

    if (!dbUser?.onboardingComplete) redirect("/client/onboarding");

    let isFirstOrder = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = await (prisma as any).clientProfile?.findUnique({
        where: { userId: session.user.id },
        select: { totalOrderCount: true },
      });
      isFirstOrder = (profile?.totalOrderCount ?? 0) === 0;
    } catch {
      isFirstOrder = true;
    }

    const badges: Record<string, number> = {};
    if (unreadCount > 0) badges["/client/support"] = unreadCount;

    return (
      <DashboardShell
        mode="client"
        user={{ name: dbUser?.name ?? session.user.name, email: dbUser?.email ?? session.user.email }}
        badges={badges}
      >
        <div className="mx-auto w-full max-w-[760px] px-2 py-8">
          <div className="rounded-[1.75rem] border border-white/[0.06] bg-[#0e0f1c]/95 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-8">
            <OrderWizard
              user={{ name: session.user.name, email: session.user.email }}
              isFirstOrder={isFirstOrder}
              catalog={catalog}
            />
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Guest — full-page dark wrapper
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#06071a] via-[#0a0c1e] to-[#06071a]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(124,58,237,0.12),transparent_60%)]" />
      <div className="relative mx-auto w-full max-w-[760px] px-4 py-10 md:py-16">
        <div className="rounded-[1.75rem] border border-white/[0.06] bg-[#0e0f1c]/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl md:p-8">
          <OrderWizard catalog={catalog} />
        </div>
      </div>
    </div>
  );
}
