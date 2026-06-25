// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 subscriptions per IP per 15 minutes
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit("subscribe", ip, 5)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

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
      console.log("[subscribe] DB unavailable, email logged:", email.toLowerCase().trim());
    }

    console.log("[subscribe] New subscriber:", email.toLowerCase().trim(), "| source:", source || "website");
    return NextResponse.json({ success: true, message: "Subscribed" });
  } catch (err) {
    console.error("[subscribe] Fatal error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
