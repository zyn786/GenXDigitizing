// @ts-nocheck
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/health — invariant report for the order chain.
 *
 * Admin-only (enforced by middleware for /api/admin/*).
 *
 * Answers the questions the admin dashboard has never been able to:
 *   which orders have no notification, what is overdue and unescalated,
 *   what artwork never arrived, what email failed, and whether transactional
 *   mail is going out at all.
 *
 * Returns 503 when any check fails, so an uptime monitor can alert on it
 * without parsing the body. `?window=<hours>` widens or narrows the lookback.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runInvariantChecks, summarise } from "@/lib/invariants";

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("window");
    const windowHours = Math.min(Math.max(Number(raw) || 24, 1), 24 * 30);

    const report = await runInvariantChecks(createAdminClient(), {
      windowHours,
      staleSubmittedHours: Math.min(Math.max(windowHours / 6, 2), 24),
    });

    return NextResponse.json(
      { ...report, summary: summarise(report) },
      {
        status: report.ok ? 200 : 503,
        headers: {
          // Never let a CDN or proxy serve a stale health result.
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err: any) {
    console.error("[admin/health]", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Health check failed", summary: "check itself failed" },
      { status: 503 }
    );
  }
}
