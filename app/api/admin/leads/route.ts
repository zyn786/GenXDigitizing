import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const ALLOWED_ROLES = new Set(["SUPER_ADMIN", "MANAGER"]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET() {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.has(String(session.user.role))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const [profileSources, orderSources, recentClients] = await Promise.all([
      // Aggregate lead sources from client profiles
      db.clientProfile.groupBy({
        by: ["leadSource"],
        _count: { leadSource: true },
      }),
      // Aggregate lead sources from orders
      db.workflowOrder.groupBy({
        by: ["leadSource"],
        _count: { leadSource: true },
      }),
      // Recent clients with source info
      prisma.user.findMany({
        where: { role: "CLIENT", isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          clientProfile: {
            select: {
              companyName: true,
              totalOrderCount: true,
              leadSource: true,
            } as Record<string, boolean>,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      profileSources,
      orderSources,
      recentClients,
    });
  } catch {
    // Gracefully handle if migration hasn't run yet
    const recentClients = await prisma.user.findMany({
      where: { role: "CLIENT", isActive: true },
      select: { id: true, name: true, email: true, createdAt: true, clientProfile: { select: { companyName: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      ok: true,
      profileSources: [],
      orderSources: [],
      recentClients,
    });
  }
}
