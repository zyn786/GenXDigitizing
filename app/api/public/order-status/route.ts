import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const number = (searchParams.get("number") ?? "").trim().toUpperCase();
  const email  = (searchParams.get("email")  ?? "").trim().toLowerCase();

  if (!number || !email) {
    return NextResponse.json({ ok: false, message: "Order number and email are required." }, { status: 400 });
  }

  // Require both fields to match — prevents enumeration by order number alone
  const order = await prisma.workflowOrder.findFirst({
    where: {
      orderNumber: number,
      clientUser: { email: { equals: email, mode: "insensitive" } },
    },
    select: {
      id:             true,
      orderNumber:    true,
      title:          true,
      serviceType:    true,
      status:         true,
      proofStatus:    true,
      quantity:       true,
      createdAt:      true,
      updatedAt:      true,
      deliveredAt:    true,
      progressPercent: true,
      revisionCount:  true,
    },
  });

  if (!order) {
    // Same message whether wrong number or wrong email — no information leak
    return NextResponse.json(
      { ok: false, message: "No order found. Check your order number and email." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, order });
}
