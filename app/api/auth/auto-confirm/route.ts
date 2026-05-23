// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/auth/auto-confirm — auto-confirm user email using service role
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Find the user by email
    const { data: { users }, error: lookupError } = await admin.auth.admin.listUsers();
    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    const user = users?.find((u) => u.email === email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Auto-confirm the user's email
    if (!user.email_confirmed_at) {
      const { error: confirmError } = await admin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

      if (confirmError) {
        return NextResponse.json({ error: confirmError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    console.error("Auto-confirm error:", error);
    return NextResponse.json({ error: error.message || "Auto-confirm failed" }, { status: 500 });
  }
}
