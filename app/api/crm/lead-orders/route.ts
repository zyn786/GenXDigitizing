// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/crm/lead-orders?email=client@email.com
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const admin = createAdminClient();

    // Find user by email
    const { data: user } = await admin.from("users").select("id, full_name").eq("email", email).maybeSingle();
    if (!user) return NextResponse.json({ orders: [] });

    // Find client record
    const { data: client } = await admin.from("clients").select("id").eq("user_id", user.id).maybeSingle();
    if (!client) return NextResponse.json({ orders: [] });

    // Get orders
    const { data: orders } = await admin
      .from("orders")
      .select("id, order_number, status, price, turnaround, stitch_count, design_name, created_at, service_tiers(label,category)")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({ orders: (orders || []).map(o => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      price: o.price,
      turnaround: o.turnaround,
      stitches: o.stitch_count,
      designName: o.design_name,
      service: Array.isArray(o.service_tiers) ? o.service_tiers[0]?.label : o.service_tiers?.label || "—",
      createdAt: o.created_at,
    }))});
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
