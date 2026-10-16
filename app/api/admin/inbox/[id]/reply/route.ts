// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import {
  assertInboxStaff,
  getReplyTarget,
  recordOutbound,
  recordReplySentEvent,
  NotInboxStaffError,
} from "@/lib/inbox/queries";
import { describeSendFailure, replyContext, validateReplyBody } from "@/lib/inbox/reply";
import { sendWhatsAppText } from "@/lib/whatsapp/send";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/inbox/[id]/reply — send a reply to the customer.
 *
 * The only endpoint in the inbox that reaches a customer, so it fails closed at
 * every step: staff, then a channel with a send path, then an address, then an
 * open window, then the body. Anything that would leave the outcome uncertain
 * stops before the send rather than after it.
 *
 * ORDER MATTERS at the end: send first, store second. A row in
 * `conversation_messages` means the customer was messaged, so writing before
 * the provider accepts would show staff a reply that never arrived. The reverse
 * — sent but unrecorded — is the honest failure, and it is reported as such
 * instead of being rounded to success or to failure.
 *
 * Not idempotent, and it cannot be: Meta has no dedupe key, so two POSTs are
 * two messages. The client disables the button while a send is in flight; that
 * is the whole of the protection and it is worth knowing it is only that.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await assertInboxStaff();
  } catch (error: any) {
    if (error instanceof NotInboxStaffError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[inbox] reply auth failed:", error?.message ?? error);
    return NextResponse.json({ error: "Failed to send the reply" }, { status: 500 });
  }

  try {
    const { id } = await params;

    const target = await getReplyTarget(id);
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ── Can this thread be replied to at all? ────────────────
    const context = replyContext({ channel: target.channel, lastInboundAt: target.lastInboundAt });
    if (!context.allowed) {
      return NextResponse.json({ error: context.message, reason: context.reason }, { status: 409 });
    }

    if (!target.externalId) {
      // The contact row has no address for this channel. Cannot happen for a
      // thread created by the inbound path, but a thread is not a promise that
      // the identity map is intact, and sending needs the address.
      return NextResponse.json(
        { error: "This contact has no address on this channel.", reason: "no_address" },
        { status: 409 }
      );
    }

    const payload = await req.json().catch(() => ({}));
    const parsed = validateReplyBody(payload.body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.message }, { status: 400 });
    }

    // ── Send ─────────────────────────────────────────────────
    const sent = await sendWhatsAppText(target.externalId, parsed.body);
    if (!sent.ok) {
      return NextResponse.json(
        { error: describeSendFailure(sent.error ?? "WhatsApp refused the reply", sent.code) },
        { status: 502 }
      );
    }

    // ── Record ───────────────────────────────────────────────
    // This try covers the message row and NOTHING else. The warning it produces
    // says the reply is missing from the thread history, so anything else that
    // throws inside it would be reported as a lost message that is not lost.
    let message;
    try {
      message = await recordOutbound(id, {
        body: parsed.body,
        provider: target.channel,
        externalId: sent.messageId ?? null,
        sentBy: user.id,
      });
    } catch (error: any) {
      // The customer HAS been messaged. Saying otherwise would be a lie that
      // costs someone a duplicate reply, so this is a success with a caveat.
      console.error(
        "[inbox] reply sent but not recorded:",
        id,
        sent.messageId ?? "(no provider id)",
        error?.message ?? error
      );
      return NextResponse.json(
        {
          ok: true,
          recorded: false,
          warning:
            "The reply was sent, but it could not be saved to the thread. It will not appear in this history.",
        },
        { status: 200 }
      );
    }

    // The lead timeline: secondary, and after the fact. `recordReplySentEvent`
    // swallows its own errors, but this does not lean on that — the reply is
    // already delivered and nothing below may turn it into a failure.
    if (target.leadId) {
      try {
        await recordReplySentEvent({
          leadId: target.leadId,
          channel: target.channel,
          body: parsed.body,
          actorId: user.id,
          actorLabel: user.full_name ?? null,
          conversationId: id,
        });
      } catch (error: any) {
        console.error("[inbox] reply sent, timeline event not written:", error?.message ?? error);
      }
    }

    return NextResponse.json({ ok: true, recorded: true, message }, { status: 201 });
  } catch (error: any) {
    console.error("[inbox] reply failed:", error?.message ?? error);
    return NextResponse.json({ error: "Failed to send the reply" }, { status: 500 });
  }
}
