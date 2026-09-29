/**
 * Live invariant run against the configured database.
 *
 * Opt-in, because it talks to a real project:
 *
 *     RUN_LIVE_CHECKS=1 npx vitest run lib/invariants.live.test.ts
 *
 * Read-only — it never writes, so it is safe against production. It asserts
 * nothing about the data (a failing invariant is a finding, not a test bug);
 * it prints the report and fails only if the check machinery itself breaks.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const enabled = process.env.RUN_LIVE_CHECKS === "1";

function loadEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

describe.skipIf(!enabled)("live invariant report", () => {
  it("runs against the configured database and prints the report", async () => {
    loadEnvLocal();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    }

    // Imported after the env is loaded — lib/supabase/server reads it on use.
    const { createClient } = await import("@supabase/supabase-js");
    const { runInvariantChecks, summarise } = await import("./invariants");

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const report = await runInvariantChecks(db, {
      windowHours: Number(process.env.INVARIANT_WINDOW_HOURS) || 168, // a week by default
    });

    const line = "─".repeat(72);
    console.log(`\n${line}\nINVARIANT REPORT  ${report.generatedAt}\n${line}`);
    for (const c of report.checks) {
      const mark = c.skipped ? "SKIP" : c.ok ? "PASS" : "FAIL";
      console.log(`${mark}  [${c.severity}] ${c.id}  (${c.count})`);
      console.log(`      ${c.skipped ?? c.detail}`);
      for (const s of c.samples) console.log(`        · ${s}`);
    }
    console.log(`${line}\n${summarise(report)}\n${line}\n`);

    // The machinery must produce a well-formed report. A failing invariant is
    // reported, not thrown — that is the point of the tool.
    expect(report.checks.length).toBeGreaterThan(0);
    expect(report.generatedAt).toBeTruthy();
  }, 60_000);
});
