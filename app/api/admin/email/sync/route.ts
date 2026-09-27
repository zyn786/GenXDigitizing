// @ts-nocheck
/**
 * Import received email from the Resend API.
 *
 * Exists so the inbox does not depend solely on webhooks being configured
 * correctly: this pulls the most recent received mail and imports anything the
 * inbox doesn't already have. Idempotent — re-running skips what's stored.
 */
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { listReceivedEmails, importReceivedEmail } from "@/lib/resend-inbound";

const LIST_LIMIT = 100;

export async function POST() {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured on the server" },
        { status: 500 }
      );
    }

    const { emails, error } = await listReceivedEmails(LIST_LIMIT);
    if (error) {
      return NextResponse.json({ error: "Could not reach Resend: " + error }, { status: 502 });
    }

    const supabase = createAdminClient();
    let imported = 0;
    let skipped = 0;
    const failures: string[] = [];

    // Work out up front which messages are already fully imported (body and
    // thread both present). Without this, every sync re-fetches all 100
    // messages from Resend one at a time, which took ~90 seconds.
    const ids = emails.map((e: any) => e.id).filter(Boolean);
    const complete = new Set<string>();

    if (ids.length > 0) {
      const existing = await supabase
        .from("received_emails")
        .select("resend_id, thread_id, body_html, body_text")
        .in("resend_id", ids);

      // A missing thread_id column just means 038 isn't applied — then nothing
      // can be considered complete and everything goes through the slow path.
      if (!existing.error) {
        for (const row of existing.data || []) {
          if (row.resend_id && row.thread_id && (row.body_html || row.body_text)) {
            complete.add(row.resend_id);
          }
        }
      }
    }

    const pending = emails.filter((e: any) => !complete.has(e.id));
    skipped = emails.length - pending.length;

    // Only the pending ones cost a Resend round-trip each, so run a few at a
    // time rather than strictly one after another.
    const CONCURRENCY = 4;
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      const batch = pending.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map((meta: any) => importReceivedEmail(supabase, meta))
      );
      for (const result of results) {
        if (result.error) { failures.push(result.error); continue; }
        if (result.created) imported++;
        else skipped++;
      }
    }

    // A cascade of identical failures almost always means migration 037 is
    // missing — say so rather than returning a wall of raw Postgres errors.
    const distinct = Array.from(new Set(failures));
    if (distinct.length > 0) {
      console.error("[admin/email/sync] Import failures:", distinct.slice(0, 5));
    }

    return NextResponse.json({
      success: true,
      seen: emails.length,
      imported,
      skipped,
      failed: failures.length,
      // Surface the first reason so the UI can explain a total failure.
      error: distinct.length > 0
        ? distinct[0] + (distinct[0].includes("column") || distinct[0].includes("constraint")
            ? " — has migration 037 been applied?"
            : "")
        : null,
    });
  } catch (err: any) {
    console.error("[admin/email/sync] Unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Sync failed" }, { status: 500 });
  }
}
