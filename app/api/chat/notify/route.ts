// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToUsers } from "@/lib/push-notifications-server";

// POST /api/chat/notify — create notification for chat message recipient
export async function POST(req: NextRequest) {
  try {
    const { toUserId, fromName, body, orderId } = await req.json();
    if (!toUserId) return NextResponse.json({ error: "Missing toUserId" }, { status: 400 });

    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: toUserId,
      type: "message",
      title: `New message from ${fromName || "Support Team"}`,
      body: (body || "You have a new message").slice(0, 120),
      action_url: `/client/messages`,
    });

    // Push notification
    sendPushToUsers([toUserId], {
      title: `New message from ${fromName || "Support Team"}`,
      body: (body || "You have a new message").slice(0, 120),
      url: `/client/messages`,
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[chat/notify]", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
