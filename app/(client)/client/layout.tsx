import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InactivityLogout } from "@/components/auth/inactivity-logout";

const getCachedUserVerification = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      emailVerified: true,
      onboardingComplete: true,
      accounts: { where: { type: "oauth" }, select: { id: true }, take: 1 },
    },
  });
});

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

export default async function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?next=/client/dashboard");
  }

  const [dbUser, unreadCount] = await Promise.all([
    getCachedUserVerification(session.user.id),
    getUnreadSupportCount(session.user.id),
  ]);

  const hasOAuthAccount = (dbUser?.accounts?.length ?? 0) > 0;
  const isEmailVerified = Boolean(dbUser?.emailVerified) || hasOAuthAccount;

  if (!isEmailVerified) {
    const email = encodeURIComponent(session.user.email ?? "");
    redirect(`/verify-email?pending=1&email=${email}`);
  }

  // Block portal access until profile setup is complete (skip if already on onboarding page)
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isOnboarding = pathname.startsWith("/client/onboarding");
  if (!dbUser?.onboardingComplete && !isOnboarding) {
    redirect("/client/onboarding");
  }

  // Onboarding page renders standalone (no sidebar shell)
  if (isOnboarding) {
    return <>{children}</>;
  }

  const badges: Record<string, number> = {};
  if (unreadCount > 0) badges["/client/support"] = unreadCount;

  return (
    <DashboardShell
      mode="client"
      user={{ name: dbUser?.name ?? session.user.name, email: dbUser?.email ?? session.user.email }}
      badges={badges}
    >
      <InactivityLogout />
      {children}
    </DashboardShell>
  );
}
