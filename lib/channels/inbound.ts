/**
 * The one path every inbound channel message takes.
 *
 * WhatsApp, Instagram and Facebook each deliver a different JSON shape, but
 * once a provider payload has been reduced to an InboundMessage the work is
 * identical: find the contact, find or open the thread, append, record an
 * event, tell the team. Doing that in one place is the difference between five
 * channels and five lead systems.
 *
 * Design rules, all of them load-bearing:
 *
 *   - Idempotent. Webhooks are delivered at least once and Meta retries on any
 *     non-2xx. `conversation_messages.external_id` is UNIQUE per conversation,
 *     so a redelivery is a no-op rather than the customer's message appearing
 *     twice in someone's inbox.
 *   - Read-mostly. It creates leads and threads. It never sends anything back.
 *   - Attribution-safe. If an existing lead matches the inbound email, the
 *     contact is attached to it rather than a duplicate lead being created —
 *     the same person emailing and then messaging is one customer.
 *   - Loud on failure. A message that cannot be recorded returns an error the
 *     webhook turns into a 5xx, so the provider retries rather than the message
 *     being silently dropped.
 */

import type { Channel, InboundMessage } from "@/lib/channels";
import { conversationKey } from "@/lib/channels";
import { recordLeadEvent } from "@/lib/lead-events";
import { notifyUsers } from "@/lib/notify-server";
import { nextFollowUpAt } from "@/lib/follow-up";

type AnyClient = { from: (table: string) => any };

export interface InboundResult {
  ok: boolean;
  /** created | appended | duplicate | error */
  outcome: "created" | "appended" | "duplicate" | "error";
  leadId?: string;
  conversationId?: string;
  error?: string;
}

/**
 * Record one inbound message.
 *
 * Returns a result rather than throwing, so the caller decides the HTTP status:
 * a duplicate is a 200 (the provider should stop retrying) while a storage
 * failure is a 5xx (it should retry).
 */
export async function handleInboundMessage(
  db: AnyClient,
  msg: InboundMessage
): Promise<InboundResult> {
  try {
    // ── 1. The thread ────────────────────────────────────────
    // Idempotency first, and cheaply: if this provider message id is already
    // stored anywhere on this channel, we have seen this delivery.
    if (msg.providerMessageId) {
      const { data: seen } = await db
        .from("conversation_messages")
        .select("id, conversation_id, conversations!inner(contact_id)")
        .eq("external_id", msg.providerMessageId)
        .eq("provider", msg.channel)
        .maybeSingle();

      if (seen) {
        return {
          ok: true,
          outcome: "duplicate",
          conversationId: seen.conversation_id,
        };
      }
    }

    // ── 2. Who is this? ──────────────────────────────────────
    const { data: existingContact } = await db
      .from("contact_channels")
      .select("id, lead_id, display_name")
      .eq("channel", msg.channel)
      .eq("external_id", msg.externalId)
      .maybeSingle();

    let contactId = existingContact?.id as string | undefined;
    let leadId = (existingContact?.lead_id as string | null) ?? null;

    // An identity we have never seen. Try to attach it to a lead we already
    // hold by email before creating a new one — someone who emailed us last
    // week and messages today is the same customer.
    if (!contactId) {
      if (!leadId && msg.email) {
        const { data: leadByEmail } = await db
          .from("crm_leads")
          .select("id")
          .eq("email", msg.email)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        leadId = (leadByEmail?.id as string | null) ?? null;
      }

      const { data: created, error: contactErr } = await db
        .from("contact_channels")
        .insert({
          channel: msg.channel,
          external_id: msg.externalId,
          display_name: msg.displayName ?? null,
          email: msg.email ?? null,
          lead_id: leadId,
        })
        .select("id")
        .single();

      if (contactErr) {
        // 23505 = unique violation = a concurrent delivery created it first.
        // Re-read rather than failing the message.
        if (contactErr.code === "23505") {
          const { data: raced } = await db
            .from("contact_channels")
            .select("id, lead_id")
            .eq("channel", msg.channel)
            .eq("external_id", msg.externalId)
            .maybeSingle();
          contactId = raced?.id;
          leadId = (raced?.lead_id as string | null) ?? leadId;
        }
        if (!contactId) {
          console.error("[channels] could not create contact:", contactErr.message);
          return { ok: false, outcome: "error", error: contactErr.message };
        }
      } else {
        contactId = created.id;
      }
    } else {
      // Known identity — keep the "last seen" useful for the inbox sort order.
      await db
        .from("contact_channels")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", contactId);
    }

    // ── 3. A lead to hang it on ──────────────────────────────
    // Every conversation is a lead from the first message. The brief's chain is
    // Contact → Conversation → Messages → Lead, and a message that produced no
    // lead is exactly the enquiry that goes unnoticed.
    if (!leadId) {
      const { data: newLead, error: leadErr } = await db
        .from("crm_leads")
        .insert({
          contact_name: msg.displayName || msg.externalId,
          email: msg.email ?? null,
          source: msg.channel,
          stage: "lead",
          follow_up_at: nextFollowUpAt("lead")?.toISOString() ?? null,
          notes: [`${msg.channel} contact: ${msg.externalId}`].join("\n"),
        })
        .select("id")
        .single();

      if (leadErr) {
        console.error("[channels] could not create lead:", leadErr.message);
        return { ok: false, outcome: "error", error: leadErr.message };
      }
      // `newLead` comes back from an untyped client; the insert selected `id`,
      // so it is present. Asserted rather than left as `any`, so the rest of
      // this function narrows to a real string.
      leadId = newLead.id as string;

      await db.from("contact_channels").update({ lead_id: leadId }).eq("id", contactId);

      await recordLeadEvent(db, {
        leadId,
        type: "created",
        actorLabel: msg.displayName || msg.externalId,
        summary: `First contact on ${msg.channel}`,
        toStage: "lead",
        metadata: { channel: msg.channel, externalId: msg.externalId },
      });
    }

    // Unreachable by construction — every branch above either sets leadId or
    // returns — but stated explicitly so the rest of the function works on a
    // non-null id instead of carrying `string | null` to the end.
    if (!leadId) {
      return { ok: false, outcome: "error", error: "no lead for this conversation" };
    }

    // ── 4. Find or open the thread ───────────────────────────
    let conversationId: string | undefined;
    const { data: existingConv } = await db
      .from("conversations")
      .select("id, status")
      .eq("contact_id", contactId)
      .eq("channel", msg.channel)
      .maybeSingle();

    if (existingConv) {
      conversationId = existingConv.id;
      // A reply reopens a closed thread — otherwise the message lands in a
      // thread nobody is looking at.
      if (existingConv.status === "closed") {
        await db.from("conversations").update({ status: "open" }).eq("id", conversationId);
      }
    } else {
      const { data: newConv, error: convErr } = await db
        .from("conversations")
        .insert({
          contact_id: contactId,
          channel: msg.channel,
          status: "open",
        })
        .select("id")
        .single();
      if (convErr) {
        console.error("[channels] could not open conversation:", convErr.message);
        return { ok: false, outcome: "error", error: convErr.message };
      }
      conversationId = newConv.id;
    }

    // ── 5. Append the message ────────────────────────────────
    const receivedAt = msg.receivedAt ?? new Date().toISOString();
    const { error: msgErr } = await db.from("conversation_messages").insert({
      conversation_id: conversationId,
      direction: "inbound",
      body: msg.body,
      attachments: msg.attachments ?? null,
      external_id: msg.providerMessageId ?? null,
      provider: msg.channel,
      created_at: receivedAt,
    });

    if (msgErr) {
      if (msgErr.code === "23505") {
        // The unique index caught a concurrent duplicate delivery. Not an error.
        return { ok: true, outcome: "duplicate", leadId, conversationId };
      }
      console.error("[channels] could not store message:", msgErr.message);
      return { ok: false, outcome: "error", error: msgErr.message };
    }

    // ── 6. Counters the inbox sorts on ───────────────────────
    const { data: conv } = await db
      .from("conversations")
      .select("unread_count")
      .eq("id", conversationId)
      .maybeSingle();
    await db
      .from("conversations")
      .update({
        last_message_at: receivedAt,
        unread_count: (conv?.unread_count ?? 0) + 1,
      })
      .eq("id", conversationId);

    // ── 7. The lead timeline ─────────────────────────────────
    await recordLeadEvent(db, {
      leadId,
      type: "chat_reply",
      actorLabel: msg.displayName || msg.externalId,
      summary: `${msg.channel} message: "${String(msg.body).slice(0, 80)}"`,
      metadata: {
        channel: msg.channel,
        conversationId,
        providerMessageId: msg.providerMessageId ?? null,
      },
    });

    // ── 8. Tell the people who work leads ────────────────────
    const { data: staff } = await db
      .from("users")
      .select("id")
      .in("role", ["admin", "crm"])
      .eq("is_active", true);

    if (staff?.length) {
      await notifyUsers(
        staff.map((u: any) => u.id),
        {
          type: "message",
          title: `New ${msg.channel} message`,
          body: `${msg.displayName || msg.externalId}: ${String(msg.body).slice(0, 100)}`,
          action_url: "/crm/messages",
        }
      );
    }

    return { ok: true, outcome: "appended", leadId, conversationId };
  } catch (err) {
    // A thrown error means the client itself failed. Report it so the webhook
    // returns a 5xx and the provider retries, rather than dropping the message.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[channels] inbound failed:", message);
    return { ok: false, outcome: "error", error: message };
  }
}

/** Exported for the webhook routes so the key is built in exactly one place. */
export { conversationKey };
