// @ts-nocheck
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WhatsApp Cloud API inbound webhook.
 *
 * Dormant until configured. With no WHATSAPP_* environment variables set, the
 * verification handshake and every delivery are refused — the route exists so
 * the architecture is in place, not because it is live.
 *
 * Meta's contract, which shapes everything here:
 *
 *   GET  — a one-time verification handshake. Meta sends hub.mode,
 *          hub.verify_token and hub.challenge; the route must echo the challenge
 *          ONLY if the token matches.
 *   POST — deliveries. Meta retries on any non-2xx, so anything that is not a
 *          genuine failure must return 200, and anything we failed to store must
 *          return 5xx so it is redelivered rather than lost.
 *
 * Two things this deliberately does not do: it never replies to the customer,
 * and it never trusts the payload's shape. A malformed body is acknowledged and
 * discarded rather than crashing the endpoint into a retry loop.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { handleInboundMessage } from "@/lib/channels/inbound";
import { extractWhatsAppMessages } from "@/lib/channels/whatsapp";
import { verifyMetaSignature, readRawBody } from "@/lib/channels/meta-signature";

/** GET — Meta's one-time verification handshake. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!expected) {
    // Fail closed. A missing token must not mean "accept anyone".
    console.error(
      "[whatsapp] WHATSAPP_VERIFY_TOKEN is not set — refusing the verification handshake."
    );
    return NextResponse.json({ error: "WhatsApp is not configured" }, { status: 503 });
  }

  if (mode === "subscribe" && token === expected && challenge) {
    // Meta expects the raw challenge string, not JSON.
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[whatsapp] verification handshake rejected (bad mode or token)");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** POST — an inbound message or status update. */
export async function POST(req: NextRequest) {
  const secret = process.env.WHATSAPP_APP_SECRET;

  // Read the raw body BEFORE parsing: the signature is over the exact bytes.
  const raw = await readRawBody(req);

  if (!secret) {
    console.error(
      "[whatsapp] WHATSAPP_APP_SECRET is not set — refusing the delivery (fail closed)."
    );
    return NextResponse.json({ error: "WhatsApp is not configured" }, { status: 503 });
  }

  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), secret)) {
    // 401, not 5xx: a bad signature must NOT be retried.
    console.warn("[whatsapp] rejected a delivery with an invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    // Acknowledge malformed JSON: retrying will not fix it.
    console.warn("[whatsapp] delivery was not valid JSON — acknowledged and discarded");
    return NextResponse.json({ ok: true, ignored: "invalid json" });
  }

  try {
    const messages = extractWhatsAppMessages(payload);

    if (!messages.length) {
      // Status callbacks (sent/delivered/read) arrive on the same endpoint.
      // Acknowledging them is correct; there is nothing to store.
      return NextResponse.json({ ok: true, ignored: "no inbound messages" });
    }

    const db = createAdminClient();
    const results = [];

    for (const msg of messages) {
      const result = await handleInboundMessage(db, msg);
      results.push(result);

      // A storage failure must be retried by Meta rather than dropped.
      if (!result.ok) {
        console.error("[whatsapp] failed to record a message:", result.error);
        return NextResponse.json({ error: "Could not record the message" }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      handled: results.length,
      outcomes: results.map((r) => r.outcome),
    });
  } catch (err) {
    console.error("[whatsapp] delivery failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
