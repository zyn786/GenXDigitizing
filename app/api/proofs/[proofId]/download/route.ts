import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createGetSignedUrl } from "@/lib/s3";

type RouteProps = { params: Promise<{ proofId: string }> };

export async function GET(_req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { proofId } = await params;

  const proof = await prisma.designProof.findUnique({
    where: { id: proofId },
    select: {
      id: true,
      fileName: true,
      objectKey: true,
      bucket: true,
      sentAt: true,
      order: {
        select: {
          clientUserId: true,
          proofStatus: true,
          assignedToUserId: true,
        },
      },
    },
  });

  if (!proof) return NextResponse.json({ error: "Proof not found." }, { status: 404 });

  const role = session.user.role;
  const isStaff = ["SUPER_ADMIN", "MANAGER", "DESIGNER"].includes(String(role ?? ""));
  const isClient = proof.order.clientUserId === session.user.id;
  const isAssignedDesigner = role === "DESIGNER" && proof.order.assignedToUserId === session.user.id;

  if (!isStaff && !isClient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Clients can only view proofs that have been sent
  if (isClient && !proof.sentAt) {
    return NextResponse.json({ error: "Proof not available yet." }, { status: 403 });
  }

  // Designers can only access their own order's proofs
  if (role === "DESIGNER" && !isAssignedDesigner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const downloadUrl = await createGetSignedUrl(proof.bucket, proof.objectKey, 1800);
    return NextResponse.json({ ok: true, downloadUrl, fileName: proof.fileName });
  } catch {
    return NextResponse.json({ error: "Failed to generate download link." }, { status: 500 });
  }
}
