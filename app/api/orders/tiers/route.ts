// @ts-nocheck
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/orders/tiers — public list of active service tiers
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: tiers, error } = await admin
      .from("service_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw error;

    return NextResponse.json({ tiers: tiers || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, tiers: [] }, { status: 500 });
  }
}
