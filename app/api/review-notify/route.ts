// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notify-server";

export async function POST(req: NextRequest) {
  try {
    const { orderId, orderNumber, stars, clientName } = await req.json();
    if (!orderId || !orderNumber) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Notify all admins
    const { data: admins } = await admin.from("users").select("id").eq("role", "admin").eq("is_active", true);
    if (admins?.length) {
      await admin.from("notifications").insert(
        admins.map((a: any) => ({
          user_id: a.id,
          type: "review",
          title: `New review — ${orderNumber}`,
          body: `${clientName || "Client"} left ${"★".repeat(stars||0)} review`,
          action_url: `/admin/reviews`,
        }))
      );
    }

    // Notify assigned designer
    const { data: order } = await admin.from("orders").select("designer_id, designers(users(id,full_name))").eq("id", orderId).single();
    const designerUserId = (order as any)?.designers?.users?.id;
    if (designerUserId) {
      await admin.from("notifications").insert({
        user_id: designerUserId,
        type: "review",
        title: `New review — ${orderNumber}`,
        body: `${clientName || "Client"} left ${"★".repeat(stars||0)} — check your completed work!`,
        action_url: `/designer/completed`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
