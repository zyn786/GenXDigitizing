import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { updatePaymentAccountSchema } from "@/lib/payments/schemas";
import { deletePaymentAccount, updatePaymentAccount } from "@/lib/payments/repository";

type RouteProps = { params: Promise<{ accountId: string }> };

function isApprover(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export async function PATCH(req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isApprover(session.user.role)) return NextResponse.json({ ok: false }, { status: 403 });

  const { accountId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updatePaymentAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const account = await updatePaymentAccount(accountId, parsed.data, {
      userId: session.user.id,
      email: session.user.email,
      role: String(session.user.role ?? ""),
    });
    return NextResponse.json({ ok: true, account });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    const status = message === "Payment account not found." ? 404 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isApprover(session.user.role)) return NextResponse.json({ ok: false }, { status: 403 });

  const { accountId } = await params;

  try {
    await deletePaymentAccount(accountId, {
      userId: session.user.id,
      email: session.user.email,
      role: String(session.user.role ?? ""),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    const status = message === "Payment account not found." ? 404 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
