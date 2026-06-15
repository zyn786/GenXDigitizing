export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/health — Platform health check
 * Returns DB status, uptime, version
 */
export async function GET() {
  const checks: Record<string, { status: string; ms?: number }> = {};

  // DB check
  const t0 = Date.now();
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("users").select("id").limit(1);
    checks.db = { status: data ? "ok" : "degraded", ms: Date.now() - t0 };
  } catch {
    checks.db = { status: "error", ms: Date.now() - t0 };
  }

  const allOk = Object.values(checks).every(c => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
