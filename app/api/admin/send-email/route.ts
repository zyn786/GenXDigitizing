// @ts-nocheck
/**
 * Admin email compose endpoint.
 * Sends email via Resend with branded layout, logs to sent_emails.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { baseLayout } from "@/lib/email/index";

var REPLY = process.env.RESEND_REPLY_TO || "support@genxdigitizing.com";

// Allowed sender addresses — must match FROM_OPTIONS in EmailComposer
var ALLOWED_FROM = [
  "support@genxdigitizing.com",
  "noreply@genxdigitizing.com",
  "orders@genxdigitizing.com",
  "billing@genxdigitizing.com",
];

// Simple in-memory rate limiter: max 10 emails per minute per user
var rateLimit = new Map();
var RATE_WINDOW_MS = 60_000; // 1 minute
var RATE_MAX = 10;

function checkRateLimit(userId: string): boolean {
  var now = Date.now();
  var entry = rateLimit.get(userId);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimit.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    var body = await request.json();
    var to = body.to;
    var subject = body.subject;
    var message = body.message;
    var userId = body.userId;
    var from = body.from;
    var attachments = body.attachments || [];

    if (!to || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Rate limit
    if (!checkRateLimit(userId || "anonymous")) {
      return NextResponse.json({ error: "Rate limit exceeded. Max " + RATE_MAX + " emails per minute." }, { status: 429 });
    }

    // Validate emails
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var recipients = to.split(",").map(function (e) { return e.trim(); });
    for (var i = 0; i < recipients.length; i++) {
      if (!emailRe.test(recipients[i])) {
        return NextResponse.json({ error: "Invalid email: " + recipients[i] }, { status: 400 });
      }
    }

    // Validate from address — only whitelisted senders
    var senderEmail = from || process.env.RESEND_FROM_EMAIL || "noreply@genxdigitizing.com";
    if (ALLOWED_FROM.indexOf(senderEmail) === -1) {
      return NextResponse.json({ error: "Invalid sender address: " + senderEmail }, { status: 400 });
    }
    var senderName = process.env.RESEND_FROM_NAME || "GenXdigitizing";
    var fromAddr = senderName + " <" + senderEmail + ">";

    // Wrap body in branded email layout
    var html = baseLayout(message, subject);

    var resend = new Resend(process.env.RESEND_API_KEY);

    // Build attachment payload
    var resendAttachments = attachments.map(function (a) {
      return {
        filename: a.filename,
        content: a.content, // base64 string
        content_type: a.content_type || undefined,
      };
    });

    var sendParams: any = {
      from: fromAddr,
      to: recipients,
      subject: subject,
      html: html,
      reply_to: REPLY,
    };

    if (resendAttachments.length > 0) {
      sendParams.attachments = resendAttachments;
    }

    var result = await resend.emails.send(sendParams);

    if (result.error) {
      console.error("[admin/send-email] Resend error:", result.error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    // Log to sent_emails
    try {
      var supabase = createAdminClient();
      await supabase.from("sent_emails").insert({
        to_email: to,
        from_email: senderEmail,
        subject: subject,
        body: message,
        sent_by: userId || null,
        resend_id: result.data?.id || null,
      });
    } catch (e) {
      console.error("[admin/send-email] Log error:", e);
    }

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (err) {
    console.error("[admin/send-email] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
