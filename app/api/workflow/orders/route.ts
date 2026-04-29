import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAppAdminRole } from "@/lib/auth/session";
import { getAdminOrders } from "@/lib/workflow/repository";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (!isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const orders = await getAdminOrders();

  return NextResponse.json({ ok: true, orders });
}