// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notify-server";
import { buildStageChangeEvent, recordLeadEvent } from "@/lib/lead-events";
import { nextFollowUpAt } from "@/lib/follow-up";

// POST /api/message-notify — notify the recipient of a message the caller just sent.
//
// The caller supplies ONLY the message id. The recipient, the snippet and the
// action link are all derived from that row, and the caller must be its sender.
//
// Previously this route took `to_user` and `body` straight from the request
// body behind a middleware check that only required *some* authenticated role,
// so any logged-in account could push attacker-authored notifications
// ("Payment confirmed — open /client/invoices") to any user id, admins
// included. It could also be used to flood an admin's inbox.
//
// This route now also absorbs two calls the chat client used to make alongside it:
//   - /api/chat/notify   — produced a SECOND notification for every staff reply
//   - /api/crm/sync-lead — middleware returns 403 for clients, so a client's
//                          first reply never moved their lead out of `lead`
export async function POST(req: NextRequest) {
  try {
    const { message_id } = await req.json();
    if (!message_id) {
      return NextResponse.json({ error: "Missing message_id" }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: message } = await admin
      .from("messages")
      .select("id, from_user, to_user, body")
      .eq("id", message_id)
      .maybeSingle();

    // 404 rather than 403 so this cannot be used to probe for message ids.
    if (!message || message.from_user !== caller.id) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const { data: callerRow } = await admin
      .from("users")
      .select("role, email")
      .eq("id", caller.id)
      .maybeSingle();

    const { data: recipient } = await admin
      .from("users")
      .select("role")
      .eq("id", message.to_user)
      .maybeSingle();

    const recipientRole = recipient?.role || "client";
    const snippet = (message.body || "").slice(0, 80);

    await notifyUsers([message.to_user], {
      type: "message",
      title: "New message",
      body: snippet || "You have a new message",
      action_url: `/${recipientRole}/messages`,
    });

    // A client replying in chat means their lead is no longer untouched. This
    // replaces the /api/crm/sync-lead call that middleware rejected for clients.
    if (callerRow?.role === "client" && callerRow.email) {
      // Any lead of theirs, not just one still sitting in `lead` — a customer
      // who writes in twice should produce two timeline entries, and a failed
      // first move should not stop the second reply being recorded.
      const { data: lead } = await admin
        .from("crm_leads")
        .select("id, notes, stage")
        .eq("email", callerRow.email)
        .in("stage", ["lead", "contacted", "quote_sent", "negotiation"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lead) {
        const shouldAdvance = lead.stage === "lead" || lead.stage === "contacted";

        if (shouldAdvance) {
          const { error: stageErr } = await admin
            .from("crm_leads")
            .update({
              stage: "contacted",
              // They just replied. Chase nothing; give it the full contacted
              // window again from now.
              follow_up_at: nextFollowUpAt("contacted")?.toISOString() ?? null,
              notes:
                (lead.notes || "") +
                `\n[${new Date().toISOString()}] Client replied via chat — moved to Contacted`,
            })
            .eq("id", lead.id);

          if (stageErr) {
            // Unchecked before, so a failed move was invisible and the lead
            // stayed in `lead` — exactly the "nobody noticed" case.
            console.error("[message-notify] lead stage NOT advanced for", lead.id, stageErr.message);
          }
        }

        // The reply itself is the entry a human needs to see, whether or not the
        // stage moved.
        await recordLeadEvent(admin, {
          leadId: lead.id,
          type: "chat_reply",
          actorLabel: callerRow.email,
          summary: snippet
            ? `Customer replied in chat: "${snippet}"`
            : "Customer replied in chat",
          metadata: { messageId: message.id },
        });

        if (shouldAdvance && lead.stage !== "contacted") {
          await recordLeadEvent(
            admin,
            buildStageChangeEvent({
              leadId: lead.id,
              fromStage: lead.stage,
              toStage: "contacted",
              actorLabel: callerRow.email,
              metadata: { reason: "customer replied in chat" },
            })
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[message-notify]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
