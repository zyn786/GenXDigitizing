// @ts-nocheck
/**
 * Resend event webhook — bounce, complaint, delivery tracking.
 * Configure in Resend dashboard → Webhooks → Add:
 *   URL:  https://www.genxdigitizing.com/api/webhooks/resend
 *   Events: email.bounced, email.complained, email.delivered, email.clicked, email.opened
 *   Signing Secret: copy to RESEND_WEBHOOK_SECRET env var
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyResendWebhook } from "@/lib/resend-webhook";

export async function POST(request: NextRequest) {
  try {
    var rawBody = await request.text();

    // Shared Svix verification — this route previously used a `resend-signature`
    // / hex scheme Resend never sends, so every delivery was rejected with 401
    // and the email_events table stayed empty.
    if (!verifyResendWebhook(rawBody, request.headers)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    var payload = JSON.parse(rawBody);
    var eventType = payload.type || "";
    var eventData = payload.data || {};

    console.log("[resend-webhook] Event:", eventType, "| email:", eventData.email_id);

    var supabase = createAdminClient();

    // Log all events
    await supabase.from("email_events").insert({
      event_type: eventType,
      email_id: eventData.email_id || null,
      from_email: eventData.from || null,
      to_email: Array.isArray(eventData.to) ? eventData.to[0] : (eventData.to || null),
      subject: eventData.subject || null,
      payload: payload,
      created_at: new Date().toISOString(),
    }).catch(function (e) { console.error("[resend-webhook] Event log error:", e); });

    // Handle bounce — mark email as bounced
    if (eventType === "email.bounced") {
      var email = Array.isArray(eventData.to) ? eventData.to[0] : eventData.to;
      if (email) {
        await supabase.from("email_bounces").upsert({
          email: email.toLowerCase().trim(),
          bounced_at: new Date().toISOString(),
          reason: eventData.reason || "unknown",
        }, { onConflict: "email" }).catch(function (e) { console.error("[resend-webhook] Bounce log error:", e); });
      }
      console.warn("[resend-webhook] BOUNCE:", email, "| reason:", eventData.reason);
    }

    // Handle complaint — mark as spam complaint
    if (eventType === "email.complained") {
      var complainedEmail = Array.isArray(eventData.to) ? eventData.to[0] : eventData.to;
      if (complainedEmail) {
        await supabase.from("email_complaints").insert({
          email: complainedEmail.toLowerCase().trim(),
          complained_at: new Date().toISOString(),
        }).catch(function (e) { console.error("[resend-webhook] Complaint log error:", e); });
      }
      console.warn("[resend-webhook] COMPLAINT:", complainedEmail);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[resend-webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "GenXdigitizing Resend event webhook",
    secret_configured: !!process.env.RESEND_WEBHOOK_SECRET,
    time: new Date().toISOString(),
  });
}
