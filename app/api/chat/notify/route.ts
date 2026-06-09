// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { notifyUsers } from "@/lib/notify";

// POST /api/chat/notify — create notification + push for chat message recipient
export async function POST(req: NextRequest) {
  try {
    const { toUserId, fromName, body, orderId } = await req.json();
    if (!toUserId) return NextResponse.json({ error: "Missing toUserId" }, { status: 400 });

    await notifyUsers([toUserId], {
      type: "message",
      title: `New message from ${fromName || "Support Team"}`,
      body: (body || "You have a new message").slice(0, 120),
      action_url: `/client/messages`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[chat/notify]", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
