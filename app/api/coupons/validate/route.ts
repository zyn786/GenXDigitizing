import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, visitorId, fileCount = 0, email, orderTotal } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, error: "Coupon code is required" }, { status: 400 });
    }

    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json({ valid: false, error: "Visitor ID is required" }, { status: 400 });
    }

    const result = await validateCoupon(code, {
      visitorId,
      fileCount: Number(fileCount) || 0,
      email,
      orderTotal: orderTotal ? Number(orderTotal) : undefined,
    });

    if (!result.valid) {
      return NextResponse.json(result, { status: 200 }); // 200 even for invalid — client handles
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[coupons/validate] Error:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate coupon. Please try again." },
      { status: 500 },
    );
  }
}
