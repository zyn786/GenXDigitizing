// @ts-nocheck
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Outbox worker — delivers the internal alerts that could not be sent inline.
 *
 * Runs on the existing Vercel cron. Every pass is safe to repeat and safe to
 * run concurrently with itself: rows are claimed with `FOR UPDATE SKIP LOCKED`
 * (migration 065), so two overlapping runs never send the same alert twice.
 *
 * There is no "enabled" flag here, deliberately. This worker delivers internal
 * alerts to staff, not marketing to customers, and the queue it drains is
 * filled by events that have already happened. Leaving it off would mean every
 * alert sits undelivered with nothing to notice — the exact failure the outbox
 * exists to remove. The customer-facing engine (follow-ups) keeps its own flag.
 *
 * A run that dies midway leaves rows in `sending`; the sweep at the top of
 * `processOutbox` returns them to the queue as `unknown` rather than assuming
 * they were delivered.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { createCronMonitor } from "@/lib/cron-monitor";
import { defaultSend, processOutbox } from "@/lib/outbox";

export async function GET(req: NextRequest) {
  const monitor = createCronMonitor("outbox");

  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = createAdminClient();

    const summary = await processOutbox(db, {
      send: (row) => defaultSend(db, row),
      limit: 25,
    });

    return monitor.success({
      ...summary,
      // Nothing claimed is the normal steady state, not a fault. Say so, so a
      // quiet queue is not read as a broken worker.
      note: summary.claimed === 0 ? "queue empty" : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return monitor.error(err);
  }
}
