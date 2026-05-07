import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createGetSignedUrl } from "@/lib/s3";
import { getOrderFileById } from "@/lib/payments/repository";
import { prisma } from "@/lib/db";

type RouteProps = { params: Promise<{ fileId: string }> };

export async function GET(_req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { fileId } = await params;
  const file = await getOrderFileById(fileId);
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  // Look up fileType separately — getOrderFileById doesn't expose it.
  const fileMeta = await prisma.orderFile.findUnique({
    where: { id: fileId },
    select: { fileType: true },
  });
  if (!fileMeta || fileMeta.fileType !== "FINAL_FILE") {
    return NextResponse.json({ error: "File not available" }, { status: 403 });
  }

  const order = await prisma.workflowOrder.findFirst({
    where: { id: file.orderId, clientUserId: session.user.id },
    select: { invoice: { select: { filesUnlocked: true } } },
  });

  if (!order) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (!order.invoice?.filesUnlocked) {
    return NextResponse.json({ error: "Files are locked until your payment is approved." }, { status: 403 });
  }

  try {
    const downloadUrl = await createGetSignedUrl(file.bucket, file.objectKey, 300);
    return NextResponse.json({ ok: true, downloadUrl, fileName: file.fileName });
  } catch {
    return NextResponse.json({ error: "Failed to generate download link." }, { status: 500 });
  }
}
