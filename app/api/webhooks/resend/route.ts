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
import { isMissingColumn } from "@/lib/db-errors";

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

    // ── Why these check `.error` instead of using `.catch()` ──
    // PostgREST reports API-level failures (missing table, bad column, RLS
    // denial) in the RESOLVED value as `{ error }`. It only rejects on transport
    // failure. So the `.catch()` this used to hang off each insert never fired
    // for the actual failure mode, and every event was discarded in silence —
    // which is why email_events stayed empty even once the signature check was
    // fixed.
    var failures: string[] = [];

    /** Missing tables are a configuration problem, not a delivery one — retrying
     *  will not create them, and a 500 makes Resend retry then disable the
     *  webhook. Only genuinely transient failures should ask for a retry. */
    var misconfigured: string[] = [];

    async function record(label: string, query: PromiseLike<{ error: unknown }>) {
      try {
        var { error } = await query;
        if (error) {
          if (isMissingColumn(error)) {
            misconfigured.push(label);
            console.error(
              "[resend-webhook] " + label + " skipped — table missing. Apply migration 046."
            );
            return;
          }
          failures.push(label);
          console.error("[resend-webhook] " + label + " failed:", error);
        }
      } catch (e) {
        failures.push(label);
        console.error("[resend-webhook] " + label + " threw:", e);
      }
    }

    // Log all events
    await record(
      "event log",
      supabase.from("email_events").insert({
        event_type: eventType,
        email_id: eventData.email_id || null,
        from_email: eventData.from || null,
        to_email: Array.isArray(eventData.to) ? eventData.to[0] : eventData.to || null,
        subject: eventData.subject || null,
        payload: payload,
        created_at: new Date().toISOString(),
      })
    );

    // Handle bounce — mark email as bounced
    if (eventType === "email.bounced") {
      var email = Array.isArray(eventData.to) ? eventData.to[0] : eventData.to;
      if (email) {
        await record(
          "bounce log",
          supabase.from("email_bounces").upsert(
            {
              email: email.toLowerCase().trim(),
              bounced_at: new Date().toISOString(),
              reason: eventData.reason || "unknown",
            },
            { onConflict: "email" }
          )
        );
      }
      console.warn("[resend-webhook] BOUNCE:", email, "| reason:", eventData.reason);
    }

    // Handle complaint — mark as spam complaint
    if (eventType === "email.complained") {
      var complainedEmail = Array.isArray(eventData.to) ? eventData.to[0] : eventData.to;
      if (complainedEmail) {
        await record(
          "complaint log",
          supabase.from("email_complaints").insert({
            email: complainedEmail.toLowerCase().trim(),
            complained_at: new Date().toISOString(),
          })
        );
      }
      console.warn("[resend-webhook] COMPLAINT:", complainedEmail);
    }

    // Surface a transient failure to Resend so it retries, rather than returning
    // 200 for an event we dropped on the floor.
    if (failures.length) {
      return NextResponse.json({ received: true, failed: failures }, { status: 500 });
    }

    return NextResponse.json({
      received: true,
      ...(misconfigured.length ? { skipped_no_table: misconfigured } : {}),
    });
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
