import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPaymentAccounts } from "@/lib/payments/repository";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

  const accounts = await getPaymentAccounts(true);
  return NextResponse.json({ ok: true, accounts });
}
