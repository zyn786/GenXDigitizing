// @ts-nocheck
/**
 * Resend inbound email webhook.
 *
 * Resend webhooks carry METADATA ONLY — the docs are explicit: "Webhooks do not
 * include the email body, headers, or attachments, only their metadata." The
 * body is fetched from the received-emails API after the webhook arrives.
 * (The previous version read `email.html` / `email.text` off the payload, so
 * bodies would have been empty even once it got past the signature check.)
 *
 * SETUP (Resend dashboard):
 * 1. Domains → genxdigitizing.com → Inbound → configure the MX records
 * 2. Webhooks → Add → event: email.received
 *    URL: https://www.genxdigitizing.com/api/admin/email-inbound
 * 3. Copy the `whsec_…` signing secret → RESEND_WEBHOOK_SECRET
 * 4. Create inbound addresses (support@, orders@, billing@, …)
 *
 * If the webhook is misconfigured or never fires, the admin panel's
 * "Sync from Resend" button imports the same mail via app/api/admin/email/sync.
 */

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notify-server";
import { verifyResendWebhook } from "@/lib/resend-webhook";
import { importReceivedEmail } from "@/lib/resend-inbound";

export async function POST(request: NextRequest) {
  try {
    var rawBody = await request.text();

    if (!verifyResendWebhook(rawBody, request.headers)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    var payload = JSON.parse(rawBody);
    var eventType = payload.type || "";
    var email = payload.data || payload;

    // Only inbound mail belongs here. Other event types are handled by
    // /api/webhooks/resend; ack so Resend doesn't retry them forever.
    if (eventType && eventType !== "email.received") {
      return NextResponse.json({ received: true, ignored: eventType });
    }

    var fromEmail = email.from || "";
    var toEmail = (Array.isArray(email.to) ? email.to.join(", ") : email.to) || "";

    if (!fromEmail || !toEmail) {
      console.warn("[email-inbound] Missing from/to:", rawBody.slice(0, 300));
      return NextResponse.json({ error: "Missing from/to fields" }, { status: 400 });
    }

    var supabase = createAdminClient();
    var result = await importReceivedEmail(supabase, email);

    if (result.error) {
      console.error("[email-inbound] Store failed:", result.error,
        "— if this mentions a missing column or unique constraint, apply migration 037.");
      return NextResponse.json({ error: "Failed to store email" }, { status: 500 });
    }

    // Only notify for genuinely new mail, not webhook redeliveries.
    if (result.created) {
      try {
        var { data: admins } = await supabase
          .from("users")
          .select("id")
          .eq("role", "admin")
          .eq("is_active", true);

        if (admins && admins.length > 0) {
          await notifyUsers(
            admins.map(function (a: any) { return a.id; }),
            {
              type: "system",
              title: "New email from " + fromEmail,
              body: email.subject || "(no subject)",
              action_url: "/admin/email",
            }
          );
        }
      } catch (notifyErr) {
        console.error("[email-inbound] Notification error:", notifyErr);
        // Non-fatal — email already stored
      }
    }

    console.log("[email-inbound] Stored:", result.id, "created:", result.created, "from:", fromEmail);
    return NextResponse.json({ success: true, id: result.id, created: result.created });
  } catch (err: any) {
    console.error("[email-inbound] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Resend verifies webhook endpoints with a GET
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "GenXdigitizing inbound email webhook",
    webhook_secret_configured: !!process.env.RESEND_WEBHOOK_SECRET,
    resend_api_key_configured: !!process.env.RESEND_API_KEY,
    time: new Date().toISOString(),
  });
}
