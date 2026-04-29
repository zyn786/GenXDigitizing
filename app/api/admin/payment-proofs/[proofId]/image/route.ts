import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createGetSignedUrl } from "@/lib/s3";
import { getPaymentProofById } from "@/lib/payments/repository";

type RouteProps = { params: Promise<{ proofId: string }> };

function isApprover(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export async function GET(_req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isApprover(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { proofId } = await params;
  const proof = await getPaymentProofById(proofId);
  if (!proof) return NextResponse.json({ error: "Proof not found." }, { status: 404 });

  try {
    const viewUrl = await createGetSignedUrl(proof.proofImageBucket, proof.proofImageKey, 300);
    return NextResponse.json({ ok: true, viewUrl });
  } catch {
    return NextResponse.json({ error: "Failed to generate image link." }, { status: 500 });
  }
}
