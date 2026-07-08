// @ts-nocheck
/**
 * POST /api/auth/send-welcome
 * Sends the professional welcome email after registration.
 * Called client-side after successful sign-up + sign-in.
 */

import { NextRequest, NextResponse } from "next/server";
import { emailWelcome } from "@/lib/email/index";

export async function POST(request: NextRequest) {
  try {
    var body = await request.json();
    var email = body.email;
    var name = body.name;
    var company = body.company;

    if (!email || !name) {
      return NextResponse.json({ error: "Missing email or name" }, { status: 400 });
    }

    var result = await emailWelcome({
      to: email,
      clientName: name,
      companyName: company || "Your Business",
    });

    if (!result.success) {
      console.error("[send-welcome] Failed to send:", result.error);
      return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (err: any) {
    console.error("[send-welcome] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
