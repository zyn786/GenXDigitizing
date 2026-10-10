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
    const messages = extractMessagingEvents(payload);

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

/**
 * Reduce a Graph webhook to our shape.
 *
 * Two things are deliberately skipped rather than guessed at:
 *
 *   - `message.is_echo` events. Those are messages WE sent, delivered back to
 *     us for confirmation. Recording one as inbound would show the customer's
 *     own thread a reply from them that they never wrote.
 *   - Anything without a numeric sender id. A missing id means we cannot say
 *     who this is, and inventing one merges two customers.
 */
export function extractMessagingEvents(payload: any) {
  const out: any[] = [];
  const channel = payload?.object === "instagram" ? "instagram" : "facebook";

  for (const entry of payload?.entry ?? []) {
    for (const event of entry?.messaging ?? []) {
      // Our own outgoing message, echoed back. Never inbound.
      if (event?.message?.is_echo) continue;

      const senderId = event?.sender?.id;
      if (!/^\d{5,}$/.test(String(senderId ?? ""))) {
        console.warn(`[meta] skipping a ${channel} event with an unusable sender id`);
        continue;
      }

      const body =
        event?.message?.text ??
        (event?.message?.attachments?.length
          ? `[${event.message.attachments[0]?.type ?? "attachment"}]`
          : "") ??
        "";

      // A postback is a button tap — a deliberate action, so it counts as a
      // message even though the customer typed nothing.
      const postback = event?.postback?.title ?? event?.postback?.payload ?? null;

      const text = body || postback;
      if (!text) continue; // read receipts, reactions, deliveries

      out.push({
        channel,
        externalId: String(senderId),
        displayName: null,
        email: null,
        body: String(text),
        providerMessageId: event?.message?.mid ?? null,
        attachments: event?.message?.attachments ? { raw: event.message.attachments } : null,
        receivedAt: event?.timestamp
          ? new Date(Number(event.timestamp)).toISOString()
          : new Date().toISOString(),
      });
    }
  }

  return out;
}
