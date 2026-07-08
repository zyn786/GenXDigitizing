// @ts-nocheck
/**
 * Resend inbound email webhook.
 * Receives emails forwarded to your Resend inbound address and stores them.
 *
 * SETUP:
 * 1. In Resend dashboard → Domains → your domain → Inbound
 * 2. Configure MX records as instructed by Resend
 * 3. Set webhook URL to: https://yourdomain.com/api/admin/email-inbound
 * 4. Create an inbound email address (e.g. admin@genxdigitizing.com)
 * 5. Set RESEND_WEBHOOK_SECRET env var (from Resend → Webhooks → Signing Secret)
 *
 * Resend sends JSON with: from, to, subject, html, text, headers, etc.
 * Docs: https://resend.com/docs/dashboard/emails/inbound
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createHmac } from "crypto";

var WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || "";

function verifyResendSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    // Secret not configured — allow but warn
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
    // Clone request to read raw body for signature verification
    var rawBody = await request.text();

    // Verify webhook signature
    var sigHeader = request.headers.get("resend-signature");
    if (!verifyResendSignature(rawBody, sigHeader)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    var payload = JSON.parse(rawBody);

    // Resend inbound webhook format
    var fromEmail  = payload.from || "";
    var toEmail    = (Array.isArray(payload.to) ? payload.to.join(", ") : payload.to) || "";
    var subject    = payload.subject || "(no subject)";
    var bodyHtml   = payload.html || "";
    var bodyText   = payload.text || "";
    var resendId   = payload.resend_id || payload.id || null;

    if (!fromEmail || !toEmail) {
      console.warn("[email-inbound] Missing from/to fields:", JSON.stringify(payload).slice(0, 200));
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

    var { error } = await supabase.from("received_emails").insert({
      from_email: fromEmail,
      to_email: toEmail,
      subject,
      body_html: bodyHtml,
      body_text: bodyText,
      resend_id: resendId,
    });

    if (error) {
      console.error("[email-inbound] DB insert error:", error);
      return NextResponse.json({ error: "Failed to store email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[email-inbound] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Resend verifies webhook with GET
export async function GET() {
  return NextResponse.json({ status: "ok", service: "GenXdigitizing inbound email webhook" });
}
