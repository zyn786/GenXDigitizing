// @ts-nocheck
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Log subscription (DB table may not exist yet — graceful fallback)
    try {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const supabase = createAdminClient();
      const { error } = await supabase
        .from("subscribers")
        .upsert(
          { email: email.toLowerCase().trim(), source: source || "website", subscribed_at: new Date().toISOString() },
          { onConflict: "email" }
        );
      if (error && error.code !== "23505") {
        console.log("[subscribe] DB insert failed (non-critical):", error.message);
      }
    } catch (dbErr: any) {
      // Table may not exist — log and continue. Email still captured via server logs.
      console.log("[subscribe] DB unavailable, email logged:", email.toLowerCase().trim());
    }

    // Always return success — email captured
    console.log("[subscribe] New subscriber:", email.toLowerCase().trim(), "| source:", source || "website");
    return NextResponse.json({ success: true, message: "Subscribed" });
  } catch (err) {
    console.error("[subscribe] Fatal error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
