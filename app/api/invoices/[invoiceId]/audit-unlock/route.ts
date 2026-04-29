import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { verifyTotp } from "@/lib/auth/totp";
import { auditCodeInputSchema } from "@/lib/billing/schemas";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, message: "Forbidden. SUPER_ADMIN only." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = auditCodeInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid authenticator code." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { auditTotpEnabled: true, auditTotpSecret: true },
  });

  if (!user?.auditTotpEnabled || !user.auditTotpSecret) {
    return NextResponse.json(
      { ok: false, message: "Audit TOTP is not configured for this account." },
      { status: 403 }
    );
  }

  const valid = verifyTotp(user.auditTotpSecret, parsed.data.code);

  if (!valid) {
    return NextResponse.json({ ok: false, message: "Invalid authenticator code." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    message: "Audit access unlocked for SUPER_ADMIN flow.",
  });
}