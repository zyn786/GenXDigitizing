// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Called after a client/user sends a message to admin/support
// Creates notification for the recipient
export async function POST(req: NextRequest) {
  try {
    const { to_user, body } = await req.json();
    if (!to_user) return NextResponse.json({ error: "Missing to_user" }, { status: 400 });

    const supabase = createAdminClient();
    const snippet = (body || "").slice(0, 80);

    await supabase.from("notifications").insert({
      user_id: to_user,
      type: "message",
      title: "New message",
      body: snippet || "You have a new message",
      action_url: `/${await getRole(supabase, to_user)}/messages`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function getRole(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.from("users").select("role").eq("id", userId).single();
  return data?.role || "client";
}
