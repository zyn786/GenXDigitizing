// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/auth/auto-confirm — auto-confirm user email using service role
// Accepts userId (preferred, direct lookup) or email (fallback, paginated search)
export async function POST(req: NextRequest) {
  try {
    const { email, userId } = await req.json();
    if (!email && !userId) {
      return NextResponse.json({ error: "email or userId is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    let user: { id: string; email_confirmed_at?: string | null } | undefined;

    if (userId) {
      // Direct lookup by ID — fast, no pagination issue
      const { data, error } = await admin.auth.admin.getUserById(userId);
      if (error || !data?.user) {
        return NextResponse.json({ error: "User not found by ID" }, { status: 404 });
      }
      user = data.user;
    } else {
      // Fallback: search by email across all pages
      let page = 1;
      const perPage = 100;
      while (true) {
        const { data: { users }, error: lookupError } = await admin.auth.admin.listUsers({
          page,
          perPage,
        });
        if (lookupError) {
          return NextResponse.json({ error: lookupError.message }, { status: 500 });
        }
        user = users?.find((u) => u.email === email);
        if (user) break;
        if (!users || users.length < perPage) break; // last page
        page++;
      }
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
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
