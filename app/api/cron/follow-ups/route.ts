// @ts-nocheck
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Follow-up engine — chases leads that have gone quiet.
 *
 * This is the one thing in the app that emails customers without a person
 * deciding, so it is built to be boring and to be off until someone turns it
 * on.
 *
 * DISABLED BY DEFAULT. Set FOLLOW_UPS_ENABLED=true to send. With it unset the
 * route still runs and still writes nothing, but it reports exactly what it
 * would have sent — so the team can watch the queue before arming it, rather
 * than discovering the behaviour on a customer.
 *
 * What it will not do:
 *   - chase a lead that has been won or lost (decideFollowUp refuses)
 *   - send a third automated follow-up; it hands the lead to a human instead
 *   - email a lead that has no follow-up date set
 *   - send the same follow-up twice: lead_follow_ups.dedupe_key is UNIQUE, so a
 *     doubled or retried cron is a no-op rather than a second email
 *   - write anything when disabled
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { createCronMonitor } from "@/lib/cron-monitor";
import { notifyRole } from "@/lib/notify-helpers";
import { emailFollowUp } from "@/lib/email";
import {
  MAX_AUTOMATED_FOLLOW_UPS,
  decideFollowUp,
  followUpKey,
  nextFollowUpAt,
} from "@/lib/follow-up";
import { buildStageChangeEvent, recordLeadEvent } from "@/lib/lead-events";

export async function GET(req: NextRequest) {
  const monitor = createCronMonitor("follow-ups");

  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enabled = process.env.FOLLOW_UPS_ENABLED === "true";

  try {
    const db = createAdminClient();
    const now = Date.now();

    // Candidates: an open lead whose due date has arrived.
    const { data: leads, error } = await db
      .from("crm_leads")
      .select("id, contact_name, email, company, stage, notes, follow_up_at, updated_at")
      .in("stage", ["lead", "contacted", "quote_sent", "negotiation"])
      .not("follow_up_at", "is", null)
      .lte("follow_up_at", new Date(now).toISOString())
      .order("follow_up_at", { ascending: true })
      .limit(200);

    if (error) throw new Error(error.message);

    const sent: string[] = [];
    const skipped: string[] = [];
    const handedOver: string[] = [];
    const failed: string[] = [];

    for (const lead of leads ?? []) {
      // How many automated nudges this lead has already had.
      const { count: attempts } = await db
        .from("lead_follow_ups")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", lead.id)
        .eq("status", "sent");

      const decision = decideFollowUp({
        stage: lead.stage,
        followUpAt: lead.follow_up_at,
        attempts: count ?? 0,
        now,
      });

      if (decision.action === "wait") continue;

      if (decision.action === "skip") {
        skipped.push(`${lead.id}:${decision.reason}`);
        continue;
      }

      if (decision.action === "hand_to_human") {
        // Stop chasing, tell a person. This is a deliberate end state, not a
        // failure — the lead is now somebody's job.
        handedOver.push(lead.id);
        await db
          .from("crm_leads")
          .update({ follow_up_at: null })
          .eq("id", lead.id);
        await recordLeadEvent(db, {
          leadId: lead.id,
          type: "note",
          summary: `Automated follow-ups stopped after ${attempts} attempt(s) with no reply — needs a person`,
          metadata: { reason: decision.reason },
        });
        continue;
      }

      const sequence = (count ?? 0) + 1;
      const key = followUpKey(lead.id, sequence);

      if (!enabled) {
        // Dry run: report the queue, write nothing.
        sent.push(`${key} (dry run — FOLLOW_UPS_ENABLED is not "true")`);
        continue;
      }

      if (!lead.email) {
        skipped.push(`${lead.id}:no email address`);
        continue;
      }

      // Claim the slot first. If the UNIQUE constraint rejects it, another run
      // already claimed it and we must not send.
      const { error: claimErr } = await db.from("lead_follow_ups").insert({
        lead_id: lead.id,
        sequence,
        dedupe_key: key,
        status: "pending",
        stage_at_send: lead.stage,
        to_email: lead.email,
      });
      if (claimErr) {
        // 23505 = unique violation = already claimed. Any other error is real.
        if (claimErr.code === "23505") {
          skipped.push(`${key}:already claimed`);
          continue;
        }
        console.error("[follow-ups] could not claim", key, claimErr.message);
        failed.push(`${key}:claim failed`);
        continue;
      }

      const subject = subjectFromNotes(lead.notes);
      const reference = referenceFromNotes(lead.notes);

      const result = await emailFollowUp({
        to: lead.email,
        name: lead.contact_name,
        sequence,
        subject,
        reference,
      });

      if (!result.success) {
        await db
          .from("lead_follow_ups")
          .update({ status: "failed", error: String(result.error ?? "unknown"), attempts: 1 })
          .eq("dedupe_key", key);
        failed.push(key);
        continue;
      }

      await db
        .from("lead_follow_ups")
        .update({ status: "sent", sent_at: new Date().toISOString(), attempts: 1 })
        .eq("dedupe_key", key);

      // Reschedule from now rather than from the old due date — otherwise a
      // cron that ran late would fire the next nudge immediately.
      const next = nextFollowUpAt(lead.stage, now);
      await db
        .from("crm_leads")
        .update({ follow_up_at: next ? next.toISOString() : null })
        .eq("id", lead.id);

      await recordLeadEvent(db, {
        leadId: lead.id,
        type: "note",
        summary: `Follow-up ${sequence}/${MAX_AUTOMATED_FOLLOW_UPS} emailed automatically — no reply since the last contact`,
        metadata: { sequence, to: lead.email, dedupeKey: key },
      });

      sent.push(key);
    }

    if (handedOver.length) {
      await notifyRole("admin", {
        type: "system",
        title: `${handedOver.length} lead(s) need a person`,
        body: "Automated follow-ups are exhausted with no reply. These leads have stopped being chased by the system.",
        action_url: "/crm/leads",
      });
    }

    return monitor.success({
      enabled,
      scanned: leads?.length ?? 0,
      sent,
      handedOver: handedOver.length,
      skipped: skipped.length,
      failed: failed.length,
      timestamp: new Date(now).toISOString(),
    });
  } catch (err) {
    return monitor.error(err);
  }
}

/** "Service: Cap Digitizing" / "Design: Jaguar Head" → the customer's subject. */
function subjectFromNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const m = notes.match(/^(?:Service|Design):\s*(.+)$/m);
  return m ? m[1].trim().slice(0, 80) : null;
}

/** The customer's reference, written by lib/lead-reference. */
function referenceFromNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const m = notes.match(/Reference:\s*(GX-[A-Za-z0-9]{6})/i);
  return m ? m[1].toUpperCase() : null;
}
