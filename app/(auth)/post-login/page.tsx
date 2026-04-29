import type { Route } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function PostLoginPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = session.user.role as Role | undefined;

  switch (role) {
    case "SUPER_ADMIN":
    case "MANAGER":
    case "DESIGNER":
    case "MARKETING":
      redirect("/admin/orders");
    case "CHAT_SUPPORT":
      redirect("/admin/support");
    case "CLIENT": {
      // Check onboarding state from DB
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboardingComplete: true },
      });
      if (dbUser && !dbUser.onboardingComplete) {
        redirect("/client/onboarding" as Route);
      }
      redirect("/client/dashboard");
    }
    default:
      redirect("/client/dashboard");
  }
}
