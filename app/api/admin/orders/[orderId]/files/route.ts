import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createOrderFile, getOrderFiles } from "@/lib/payments/repository";
import { prisma } from "@/lib/db";

type RouteProps = { params: Promise<{ orderId: string }> };

const DESIGNER_ROLES = ["SUPER_ADMIN", "MANAGER", "DESIGNER"];

export async function GET(_req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (!DESIGNER_ROLES.includes(String(session.user.role ?? ""))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { orderId } = await params;
  const files = await getOrderFiles(orderId);
  return NextResponse.json({ ok: true, files });
}

export async function POST(req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (!DESIGNER_ROLES.includes(String(session.user.role ?? ""))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { orderId } = await params;

  const order = await prisma.workflowOrder.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });

  const body = await req.json().catch(() => null) as {
    fileName?: string;
    objectKey?: string;
    bucket?: string;
    mimeType?: string;
    sizeBytes?: number;
  } | null;

  if (!body?.fileName || !body?.objectKey || !body?.bucket || !body?.mimeType || typeof body?.sizeBytes !== "number") {
    return NextResponse.json({ ok: false, message: "Missing required fields." }, { status: 400 });
  }

  try {
    const file = await createOrderFile({
      orderId,
      uploadedByUserId: session.user.id,
      fileName: body.fileName,
      objectKey: body.objectKey,
      bucket: body.bucket,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
    });
    return NextResponse.json({ ok: true, file }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
