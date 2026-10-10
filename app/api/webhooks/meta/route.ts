// @ts-nocheck
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Instagram Messaging and Facebook Messenger inbound webhook.
 *
 * One route, because Meta delivers both through the same Graph webhook: the
 * same `object` envelope, the same `entry[].messaging[]` shape, the same
 * X-Hub-Signature-256 signature. The only difference is the `object` value
 * ("instagram" or "page"), which is what decides the channel each message is
 * filed under.
 *
 * Dormant until META_* environment variables are set. Refuses verification and
 * every delivery without them.
 *
 * Nothing here replies to the customer. Instagram and Messenger both enforce a
 * 24-hour messaging window and require app review for anything beyond it, so
 * outbound is a product decision with a policy attached, not a code change.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { handleInboundMessage } from "@/lib/channels/inbound";
import { extractMetaMessages } from "@/lib/channels/meta";
import { readRawBody, verifyMetaSignature } from "@/lib/channels/meta-signature";

/** GET — Meta's verification handshake, shared with the WhatsApp route's token. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const expected = process.env.META_VERIFY_TOKEN;

  if (!expected) {
    console.error("[meta] META_VERIFY_TOKEN is not set — refusing the verification handshake.");
    return NextResponse.json({ error: "Meta messaging is not configured" }, { status: 503 });
  }

  if (mode === "subscribe" && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[meta] verification handshake rejected (bad mode or token)");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** POST — an inbound DM, or an echo of one we sent. */
export async function POST(req: NextRequest) {
  const secret = process.env.META_APP_SECRET;
  const raw = await readRawBody(req);

  if (!secret) {
    console.error("[meta] META_APP_SECRET is not set — refusing the delivery (fail closed).");
    return NextResponse.json({ error: "Meta messaging is not configured" }, { status: 503 });
  }

  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), secret)) {
    console.warn("[meta] rejected a delivery with an invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true, ignored: "invalid json" });
  }

  try {
    const messages = extractMetaMessages(payload);

    if (!messages.length) {
      // Read receipts, deliveries and reactions arrive on the same endpoint.
      return NextResponse.json({ ok: true, ignored: "no inbound messages" });
    }

    const db = createAdminClient();

    for (const msg of messages) {
      const result = await handleInboundMessage(db, msg);
      if (!result.ok) {
        console.error("[meta] failed to record a message:", result.error);
        return NextResponse.json({ error: "Could not record the message" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, handled: messages.length });
  } catch (err) {
    console.error("[meta] delivery failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
