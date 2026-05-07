import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isAppAdminRole } from "@/lib/auth/session";
import { getOrderFileById, deleteOrderFile } from "@/lib/payments/repository";
import { prisma } from "@/lib/db";

type RouteProps = { params: Promise<{ fileId: string }> };

export async function DELETE(_req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!isAppAdminRole(session.user.role)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { fileId } = await params;
  const file = await getOrderFileById(fileId);
  if (!file) return NextResponse.json({ ok: false, error: "File not found." }, { status: 404 });

  // Designers may only delete files for orders assigned to them.
  if (session.user.role === "DESIGNER") {
    const order = await prisma.workflowOrder.findUnique({
      where: { id: file.orderId },
      select: { assignedToUserId: true },
    });
    if (!order || order.assignedToUserId !== session.user.id) {
      return NextResponse.json({ ok: false, error: "Not authorized for this order" }, { status: 403 });
    }
  }

  await deleteOrderFile(fileId);
  return NextResponse.json({ ok: true });
}
