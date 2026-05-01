import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createGetSignedUrl } from "@/lib/s3";
import { prisma } from "@/lib/db";

type RouteProps = { params: Promise<{ fileId: string }> };

export async function GET(_req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const isAdminOrManager = role === "SUPER_ADMIN" || role === "MANAGER";
  const isDesigner = role === "DESIGNER";

  if (!isAdminOrManager && !isDesigner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { fileId } = await params;
  const file = await prisma.clientReferenceFile.findUnique({
    where: { id: fileId },
    select: { id: true, orderId: true, bucket: true, objectKey: true, fileName: true },
  });
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  // Designers can only download reference files for orders assigned to them
  if (isDesigner && !isAdminOrManager) {
    const order = await prisma.workflowOrder.findFirst({
      where: { id: file.orderId, assignedToUserId: session.user.id },
      select: { id: true },
    });
    if (!order) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const downloadUrl = await createGetSignedUrl(file.bucket, file.objectKey, 300);
    return NextResponse.json({ ok: true, downloadUrl, fileName: file.fileName });
  } catch {
    return NextResponse.json({ error: "Failed to generate download link." }, { status: 500 });
  }
}
