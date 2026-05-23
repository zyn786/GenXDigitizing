// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }   from "@/lib/supabase/server";
import { getAdminUser }        from "@/lib/supabase/get-user";
import { emailOrderSubmitted } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderNumber, service, price, turnaround } = await req.json();
    if (!orderNumber) {
      return NextResponse.json({ error: "Missing orderNumber" }, { status: 400 });
    }

    // Use service role client to bypass RLS
    const supabase = createAdminClient();

    // Use authenticated user's info, not a client-supplied userId
    const email = user.email;
    const name  = user.full_name;
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true);

    if (admins?.length) {
      await supabase.from("notifications").insert(
        admins.map((a: any) => ({
          user_id: a.id,
          type: "order_update",
          title: `New order — ${orderNumber}`,
          body: `${service} · $${Number(price).toFixed(0)} · ${turnaround}`,
          action_url: "/admin/orders",
        }))
      );
    }

    const TURNAROUND_LABEL: Record<string, string> = {
      standard: "Standard (12–24h)",
      rush:     "Rush (6h) ⚡ FREE",
      urgent:   "Urgent (3h) 🔥 FREE",
    };

    const estimated = turnaround === "urgent" ? "3 hours"
      : turnaround === "rush" ? "6 hours"
      : "12–24 hours";

    await emailOrderSubmitted({
      to:                email,
      clientName:        name ?? "there",
      orderNumber,
      serviceName:       service ?? "Digitizing",
      price:             Number(price),
      turnaround:        TURNAROUND_LABEL[turnaround] ?? turnaround,
      estimatedDelivery: estimated,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[order-confirm]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
