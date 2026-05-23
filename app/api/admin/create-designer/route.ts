// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }         from "@/lib/supabase/server";
import { getAdminUser }              from "@/lib/supabase/get-user";

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user || !["admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, full_name, password } = body;

    if (!email || !full_name || !password) {
      return NextResponse.json({ error: "email, full_name, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if user already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    // Create auth user via Supabase Auth Admin REST API
    // (@supabase/ssr createServerClient does not expose .auth.admin)
    // The handle_new_user trigger will auto-create public.users + public.designers rows
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role: "designer" },
      }),
    });

    if (!authRes.ok) {
      const err = await authRes.json().catch(() => ({}));
      console.error("[create-designer] Auth API error:", err);
      return NextResponse.json({
        error: (err as any).msg ?? (err as any).message ?? "Failed to create auth user",
      }, { status: 500 });
    }

    const authUser = await authRes.json();
    const userId = authUser.id;

    // The handle_new_user trigger creates public.users + public.designers rows.
    // Wait briefly then verify the designer row exists.
    await new Promise(r => setTimeout(r, 500));

    const { data: designerRow } = await supabase
      .from("designers")
      .select("id, avg_turnaround_h, avg_rating, revision_rate, total_orders, completed_orders")
      .eq("user_id", userId)
      .maybeSingle();

    if (!designerRow) {
      // Trigger may not have fired yet — create the row manually
      const { data: newDesigner, error: insErr } = await supabase
        .from("designers")
        .insert({
          user_id: userId,
          avg_turnaround_h: 0,
          avg_rating: 0,
          revision_rate: 0,
          total_orders: 0,
          completed_orders: 0,
        })
        .select("id")
        .single();

      if (insErr) {
        // Clean up auth user
        await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
          method: "DELETE",
          headers: {
            "apikey": serviceKey,
            "Authorization": `Bearer ${serviceKey}`,
          },
        });
        return NextResponse.json({ error: "Failed to create designer profile" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        designer_id: newDesigner.id,
        user_id: userId,
      });
    }

    // Ensure public.users has correct full_name
    await supabase.from("users")
      .update({ full_name, role: "designer" })
      .eq("id", userId);

    return NextResponse.json({
      success: true,
      designer_id: designerRow.id,
      user_id: userId,
    });

  } catch (err: any) {
    console.error("[create-designer] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
