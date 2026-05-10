import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ fileId: string }> };

export async function DELETE(_req: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== "DESIGNER") return NextResponse.json({ ok: false }, { status: 403 });

  const { fileId } = await params;

  // Verify the file belongs to an order assigned to this designer
  const file = await prisma.clientReferenceFile.findUnique({
    where: { id: fileId },
    select: { order: { select: { assignedToUserId: true } } },
  });
  if (!file) return NextResponse.json({ ok: false, message: "File not found." }, { status: 404 });
  if (file.order.assignedToUserId !== session.user.id) {
    return NextResponse.json({ ok: false, message: "Forbidden. This order is not assigned to you." }, { status: 403 });
  }

  await prisma.clientReferenceFile.delete({ where: { id: fileId } });

  return NextResponse.json({ ok: true });
}
