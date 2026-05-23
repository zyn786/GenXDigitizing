// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/crm/sync-lead — check if user has a lead, move to contacted
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const admin = createAdminClient();

    // Get user email
    const { data: user } = await admin.from("users").select("email").eq("id", userId).single();
    if (!user?.email) return NextResponse.json({ success: false, reason: "no email" });

    const { data: lead } = await admin
      .from("crm_leads")
      .select("id, notes")
      .eq("email", user.email)
      .eq("stage", "lead")
      .maybeSingle();

    if (lead) {
      const activityNote = `\n[${new Date().toISOString()}] Client replied via chat — auto moved to Contacted`;
      await admin.from("crm_leads").update({
        stage: "contacted",
        notes: (lead.notes || "") + activityNote,
      }).eq("id", lead.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[sync-lead]", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
