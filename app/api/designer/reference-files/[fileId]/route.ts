import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ fileId: string }> };

export async function DELETE(_req: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== "DESIGNER") return NextResponse.json({ ok: false }, { status: 403 });

  const { fileId } = await params;

  const deleted = await prisma.clientReferenceFile.deleteMany({
    where: { id: fileId },
  });

  if (deleted.count === 0) return NextResponse.json({ ok: false, message: "File not found." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
