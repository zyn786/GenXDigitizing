import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createPaymentAccountSchema } from "@/lib/payments/schemas";
import { createPaymentAccount, getPaymentAccounts } from "@/lib/payments/repository";

function isApprover(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isApprover(session.user.role)) return NextResponse.json({ ok: false }, { status: 403 });

  const accounts = await getPaymentAccounts();
  return NextResponse.json({ ok: true, accounts });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isApprover(session.user.role)) return NextResponse.json({ ok: false }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createPaymentAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const account = await createPaymentAccount(parsed.data, {
      userId: session.user.id,
      email: session.user.email,
      role: String(session.user.role ?? ""),
    });
    return NextResponse.json({ ok: true, account }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
