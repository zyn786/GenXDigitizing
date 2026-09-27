// @ts-nocheck
/**
 * Send subscription emails server-side (Resend key never touches the browser).
 * Auth: middleware.ts enforces admin role for all /api/admin/* routes.
 *
 * Body: { kind: "payment_link", email, planLabel, price, designs, link }
 *    or { kind: "approved", email, planLabel, price, designs, link?, features?, invoiceNumber? }
 */
import { NextRequest, NextResponse } from "next/server";
import {
  emailPaymentLinkSent,
  emailSubscriptionApproved,
  emailSubscriptionReceipt,
} from "@/lib/email/subscription";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kind } = body;

    if (kind === "payment_link") {
      const { email, planLabel, price, designs, link } = body;
      if (!email || !planLabel || !link) {
        return NextResponse.json({ error: "email, planLabel and link required" }, { status: 400 });
      }
      await emailPaymentLinkSent(email, planLabel, Number(price) || 0, Number(designs) || 0, link);
      return NextResponse.json({ success: true });
    }

    if (kind === "approved") {
      const { email, planLabel, price, designs, link, features, invoiceNumber } = body;
      if (!email || !planLabel) {
        return NextResponse.json({ error: "email and planLabel required" }, { status: 400 });
      }
      await Promise.all([
        emailSubscriptionApproved(email, planLabel, Number(price) || 0, Number(designs) || 0, link || undefined, features),
        emailSubscriptionReceipt(email, planLabel, invoiceNumber || "N/A", Number(price) || 0, Number(designs) || 0, features),
      ]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown kind: " + kind }, { status: 400 });
  } catch (err: any) {
    console.error("[subscriptions/email]", err);
    return NextResponse.json({ error: err?.message ?? "Email send failed" }, { status: 500 });
  }
}
