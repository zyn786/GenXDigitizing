// @ts-nocheck
/**
 * Admin email compose endpoint.
 * Sends email via Resend with branded layout, logs to sent_emails.
 *
 * Attachments arrive as Supabase Storage paths (uploaded beforehand by
 * app/api/admin/email/upload) and are downloaded here — they are no longer
 * base64'd through the request body, which broke on Vercel's 4.5MB limit.
 */

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { resolveBucket } from "@/lib/storage";
import { Resend } from "resend";
import { baseLayout } from "@/lib/email/index";
import { isMissingColumn } from "@/lib/db-errors";
import { toHtmlBody } from "@/lib/email-text";
import { bareAddress, composeReplyTo, isAllowedSender } from "@/lib/email/address";

// Address handling lives in lib/email/address so this route, lib/email/index.ts
// and lib/email/subscription.ts cannot drift apart again.
var REPLY = composeReplyTo();

/** Only attachments written by the composer's upload route may be attached. */
var ATTACHMENT_PREFIX = "email-attachments/";

// Simple in-memory rate limiter: max 10 emails per minute per user
var rateLimit = new Map();
var RATE_WINDOW_MS = 60_000; // 1 minute
var RATE_MAX = 10;

function checkRateLimit(key: string): boolean {
  var now = Date.now();
  var entry = rateLimit.get(key);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimit.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Identity comes from the session, never from the request body — `sent_by`
    // and the rate-limit key were both previously client-supplied and spoofable.
    var user = await getAdminUser().catch(function () {
      return null;
    });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    var body = await request.json();
    var to = body.to;
    var subject = body.subject;
    var message = body.message;
    var from = body.from;
    var attachments = Array.isArray(body.attachments) ? body.attachments : [];

    // Threading: set by the composer when replying from a conversation.
    var inReplyTo = typeof body.inReplyTo === "string" ? body.inReplyTo : null;
    var references = typeof body.references === "string" ? body.references : null;
    var threadId = typeof body.threadId === "string" ? body.threadId : null;

    if (!to || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max " + RATE_MAX + " emails per minute." },
        { status: 429 }
      );
    }

    // Validate emails
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var recipients = to.split(",").map(function (e) {
      return e.trim();
    });
    for (var i = 0; i < recipients.length; i++) {
      if (!emailRe.test(recipients[i])) {
        return NextResponse.json({ error: "Invalid email: " + recipients[i] }, { status: 400 });
      }
    }

    // Validate from address — must be on the verified sending domain.
    // RESEND_FROM_EMAIL may carry a display name ("GenX Digitizing <…>"), so
    // normalise to the bare address before validating or composing From.
    var senderEmail = bareAddress(
      from || process.env.RESEND_FROM_EMAIL || "noreply@genxdigitizing.com"
    );
    if (!isAllowedSender(senderEmail)) {
      return NextResponse.json(
        { error: "Invalid sender address: " + senderEmail },
        { status: 400 }
      );
    }
    var senderName = process.env.RESEND_FROM_NAME || "GenXdigitizing";
    var fromAddr = senderName + " <" + senderEmail + ">";

    // Wrap body in branded email layout. Plain-text bodies are escaped and
    // their newlines converted — the layout has no `white-space: pre-wrap`, so
    // an unconverted body arrives as one run-on line, with any `<` in it (an
    // email address inside a quote) swallowed as a tag.
    var html = baseLayout(toHtmlBody(message), subject);

    var resend = new Resend(process.env.RESEND_API_KEY);

    // Resolve storage paths into Resend attachment payloads.
    var supabase = createAdminClient();
    var resendAttachments = [];
    var attachmentNames = [];

    for (var a = 0; a < attachments.length; a++) {
      var att = attachments[a];
      var path = att && att.path;
      var filename = (att && att.filename) || "attachment";

      // Guard against attaching arbitrary objects from other buckets/prefixes.
      if (
        typeof path !== "string" ||
        path.indexOf(ATTACHMENT_PREFIX) !== 0 ||
        path.indexOf("..") !== -1
      ) {
        return NextResponse.json({ error: "Invalid attachment reference" }, { status: 400 });
      }

      var bucket = resolveBucket(path);
      var dl = await supabase.storage.from(bucket).download(path);
      if (dl.error || !dl.data) {
        console.error("[admin/send-email] Attachment fetch failed:", path, dl.error?.message);
        return NextResponse.json(
          { error: 'Could not read attachment "' + filename + '". Re-attach it and try again.' },
          { status: 400 }
        );
      }

      resendAttachments.push({
        filename: filename,
        content: Buffer.from(await dl.data.arrayBuffer()),
        content_type: att.content_type || undefined,
      });
      attachmentNames.push(filename);
    }

    // Our own RFC Message-ID. Storing it is what lets a reply find its way
    // back into this conversation; sending it (plus In-Reply-To / References
    // on replies) is what lets the recipient's own mail client group the
    // exchange instead of showing it as a fresh message.
    var ourMessageId = "<" + randomUUID() + "@genxdigitizing.com>";
    var customHeaders: Record<string, string> = { "Message-ID": ourMessageId };
    if (inReplyTo) customHeaders["In-Reply-To"] = inReplyTo;
    if (references || inReplyTo) customHeaders["References"] = references || inReplyTo || "";

    var sendParams: any = {
      from: fromAddr,
      to: recipients,
      subject: subject,
      html: html,
      reply_to: REPLY,
      headers: customHeaders,
    };

    if (resendAttachments.length > 0) {
      sendParams.attachments = resendAttachments;
    }

    var result = await resend.emails.send(sendParams);

    if (result.error) {
      console.error("[admin/send-email] Resend error:", result.error);
      return NextResponse.json(
        { error: result.error.message || "Resend rejected the message" },
        { status: 502 }
      );
    }

    // Log to sent_emails. The mail has already gone out by this point, so a
    // logging failure must not fail the request — but it must not be silent
    // either, since it means the Sent list will be missing this message.
    try {
      var logRow: any = {
        to_email: to,
        from_email: senderEmail,
        subject: subject,
        body: message,
        sent_by: user.id,
        resend_id: result.data?.id || null,
        attachments_meta: attachmentNames.length ? attachmentNames.join(", ") : null,
        message_id: ourMessageId,
        in_reply_to: inReplyTo,
        references: references,
        // Replies carry the conversation explicitly rather than relying on
        // Resend echoing our Message-ID back in a future reply's References.
        thread_id: threadId,
      };

      var logged = await supabase.from("sent_emails").insert(logRow);

      // Migrations 037/038 may not be applied yet. The mail has already gone
      // out — never let a logging failure look like a send failure.
      if (isMissingColumn(logged.error)) {
        console.warn("[admin/send-email] Threading columns missing — logging with legacy columns");
        logged = await supabase.from("sent_emails").insert({
          to_email: to,
          from_email: senderEmail,
          subject: subject,
          body: message,
          sent_by: user.id,
          resend_id: result.data?.id || null,
        });
      }

      if (logged.error) {
        console.error(
          "[admin/send-email] Sent-log insert failed (email was still delivered):",
          logged.error.message
        );
      }
    } catch (e) {
      console.error("[admin/send-email] Sent-log insert threw (email was still delivered):", e);
    }

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (err: any) {
    // Surface the real reason — the previous bare catch returned the literal
    // string "Internal server error", which hid every failure cause.
    console.error("[admin/send-email] Unexpected error:", err);
    var msg = err?.message || "Unexpected error";
    var status = /too large|payload|entity too large/i.test(msg) ? 413 : 500;
    return NextResponse.json({ error: msg }, { status: status });
  }
}
