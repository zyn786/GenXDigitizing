import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { verifyTotp } from "@/lib/auth/totp";
import { createAuditToken } from "@/lib/admin/audit-token";

const schema = z.object({ code: z.string().length(6).regex(/^\d+$/) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ ok: false, message: "SUPER_ADMIN only." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "6-digit code required." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { auditTotpEnabled: true, auditTotpSecret: true },
  });

  if (!user?.auditTotpEnabled || !user.auditTotpSecret) {
    return NextResponse.json({ ok: false, message: "Audit TOTP not configured on this account." }, { status: 403 });
  }

  if (!verifyTotp(user.auditTotpSecret, parsed.data.code)) {
    return NextResponse.json({ ok: false, message: "Invalid authenticator code." }, { status: 401 });
  }

  const token = createAuditToken(session.user.id!);
  return NextResponse.json({ ok: true, token });
}
