import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPaymentProofs } from "@/lib/payments/repository";

function isApprover(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isApprover(session.user.role)) return NextResponse.json({ ok: false }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as "PENDING" | "APPROVED" | "REJECTED" | null;

  const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
  const filter = status && validStatuses.includes(status) ? status : undefined;

  const proofs = await getPaymentProofs(filter);
  return NextResponse.json({ ok: true, proofs });
}
