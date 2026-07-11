// @ts-nocheck
/**
 * Resend inbound email webhook.
 * Receives emails forwarded to your Resend inbound address and stores them.
 *
 * SETUP:
 * 1. Resend dashboard → Domains → genxdigitizing.com → Inbound → configure MX records
 * 2. Resend dashboard → Webhooks → Add → event: email.received
 *    URL: https://www.genxdigitizing.com/api/admin/email-inbound
 * 3. Copy Signing Secret → set as RESEND_WEBHOOK_SECRET in Vercel env vars
 * 4. Create inbound addresses (e.g. support@, orders@, billing@)
 *
 * Docs: https://resend.com/docs/dashboard/emails/inbound
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notify-server";
import { createHmac } from "crypto";

var WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || "";

function verifyResendSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn("[email-inbound] RESEND_WEBHOOK_SECRET not set — skipping signature verification");
    return true;
  }
  if (!signatureHeader) {
    console.warn("[email-inbound] Missing resend-signature header");
    return false;
  }

  // Resend format: "t=1234567890,v1=abcdef..."
  var parts: Record<string, string> = {};
  signatureHeader.split(",").forEach(function (part) {
    var eq = part.indexOf("=");
    if (eq > 0) parts[part.slice(0, eq)] = part.slice(eq + 1);
  });

  var timestamp = parts["t"];
  var expectedSig = parts["v1"];

  if (!timestamp || !expectedSig) {
    console.warn("[email-inbound] Invalid signature format");
    return false;
  }

  // Verify timestamp is within 5 minutes to prevent replay
  var now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    console.warn("[email-inbound] Signature timestamp too old: " + timestamp);
    return false;
  }

  var signedPayload = timestamp + "." + rawBody;
  var computedSig = createHmac("sha256", WEBHOOK_SECRET)
    .update(signedPayload)
    .digest("hex");

  return computedSig === expectedSig;
}

export async function POST(request: NextRequest) {
  try {
    var rawBody = await request.text();

    // Verify webhook signature
    var sigHeader = request.headers.get("resend-signature");
    if (!verifyResendSignature(rawBody, sigHeader)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    var payload = JSON.parse(rawBody);

    console.log("[email-inbound] Received webhook:", JSON.stringify({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      resend_id: payload.resend_id,
    }));

    // Resend inbound webhook format
    var fromEmail  = payload.from || "";
    var toEmail    = (Array.isArray(payload.to) ? payload.to.join(", ") : payload.to) || "";
    var ccEmails   = (Array.isArray(payload.cc) ? payload.cc.join(", ") : payload.cc) || null;
    var subject    = payload.subject || "(no subject)";
    var bodyHtml   = payload.html || "";
    var bodyText   = payload.text || "";
    var resendId   = payload.resend_id || payload.id || null;
    var headers    = payload.headers || null;
    var attachments = payload.attachments || [];

    if (!fromEmail || !toEmail) {
      console.warn("[email-inbound] Missing from/to fields:", JSON.stringify(payload).slice(0, 300));
      return NextResponse.json({ error: "Missing from/to fields" }, { status: 400 });
    }

    var supabase = createAdminClient();

    // Deduplicate by resend_id — skip if already received
    if (resendId) {
      var { data: existing } = await supabase
        .from("received_emails")
        .select("id")
        .eq("resend_id", resendId)
        .maybeSingle();

      if (existing) {
        console.log("[email-inbound] Duplicate webhook — skipping resend_id:", resendId);
        return NextResponse.json({ success: true, duplicate: true });
      }
    }

    // Store attachment metadata as JSON
    var attachmentMeta = attachments.length > 0
      ? JSON.stringify(attachments.map(function (a: any) {
          return { filename: a.filename, content_type: a.content_type, size: a.size };
        }))
      : null;

    var { error, data: inserted } = await supabase
      .from("received_emails")
      .insert({
        from_email: fromEmail,
        to_email: toEmail,
        cc_emails: ccEmails,
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
        resend_id: resendId,
        headers: headers ? JSON.stringify(headers) : null,
        attachments_meta: attachmentMeta,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[email-inbound] DB insert error:", error);
      return NextResponse.json({ error: "Failed to store email" }, { status: 500 });
    }

    // Notify admins about new inbound email
    try {
      var { data: admins } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .eq("is_active", true);

      if (admins && admins.length > 0) {
        var snippet = (bodyText || subject).slice(0, 120);
        await notifyUsers(
          admins.map(function (a: any) { return a.id; }),
          {
            type: "system",
            title: "New email from " + fromEmail,
            body: subject + " — " + snippet,
            action_url: "/admin/email",
          }
        );
      }
    } catch (notifyErr) {
      console.error("[email-inbound] Notification error:", notifyErr);
      // Non-fatal — email already stored
    }

    console.log("[email-inbound] Stored email id:", inserted?.id, "from:", fromEmail);
    return NextResponse.json({ success: true, id: inserted?.id });
  } catch (err: any) {
    console.error("[email-inbound] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Resend verifies webhook with GET
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "GenXdigitizing inbound email webhook",
    webhook_secret_configured: !!process.env.RESEND_WEBHOOK_SECRET,
    time: new Date().toISOString(),
  });
}
