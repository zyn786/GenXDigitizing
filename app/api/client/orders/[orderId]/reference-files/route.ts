import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type RouteProps = { params: Promise<{ orderId: string }> };

const refFileSchema = z.object({
  fileName: z.string().min(1),
  objectKey: z.string().min(1),
  bucket: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

const schema = z.object({
  files: z.array(refFileSchema).min(1).max(10),
});

export async function POST(req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { orderId } = await params;

  // Verify the order belongs to this client
  const order = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    select: { id: true },
  });
  if (!order) return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid file data." }, { status: 400 });
  }

  await prisma.clientReferenceFile.createMany({
    data: parsed.data.files.map((f) => ({
      orderId,
      uploaderUserId: session.user.id,
      fileName: f.fileName,
      objectKey: f.objectKey,
      bucket: f.bucket,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
    })),
  });

  return NextResponse.json({ ok: true, message: "Files saved." });
}
