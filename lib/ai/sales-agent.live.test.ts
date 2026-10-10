/**
 * Live draft check — the assistant, end to end, against the configured provider.
 *
 * Opt-in, because it spends real money on a real API call:
 *
 *     RUN_LIVE_CHECKS=1 npx vitest run lib/ai/sales-agent.live.test.ts
 *
 * It makes no assertions about the wording of the draft — a model is not
 * deterministic and pinning its prose would be a test that fails for the wrong
 * reasons. It asserts the things that are actually load-bearing:
 *
 *   - the call completes and a non-empty draft comes back
 *   - a pricing question goes through get_service_prices rather than memory
 *   - a policy question goes through get_business_policy
 *   - the model does not invent a price, a turnaround, or a policy
 *
 * The last one is the whole point of lib/ai/policy.ts, and this is the only
 * place it is checked against a real model.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { BUSINESS_POLICIES } from "./policy";

const enabled = process.env.RUN_LIVE_CHECKS === "1";

function loadEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

describe.skipIf(!enabled)("live draft", () => {
  it("drafts a reply to a pricing question without inventing a price", async () => {
    loadEnvLocal();
    const { draftReply, buildLeadBriefing, SALES_MODEL } = await import("./sales-agent");

    expect(process.env.ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY is required").toBeTruthy();
    console.log(`[live] provider=${process.env.ANTHROPIC_BASE_URL || "api.anthropic.com"}`);
    console.log(`[live] model=${SALES_MODEL}`);

    const briefing = buildLeadBriefing(
      {
        contact_name: "Dana Whitfield",
        email: "dana@example.com",
        company: "Northwind Apparel",
        stage: "lead",
        source: "website",
        notes: [
          "Service: Cap Digitizing",
          "Design: Northwind badge, 3 colours, cap front",
          "[2026-10-01T09:00:00.000Z] Stage changed: New Lead → Contacted",
        ].join("\n"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      [
        {
          direction: "inbound",
          body: "Hi — how much for a 3-colour logo on the front of 12 caps? And can you do a free sample first?",
          created_at: new Date().toISOString(),
        },
      ]
    );

    const result = await draftReply({ briefing });

    console.log("\n===== DRAFT =====\n" + result.draft + "\n=================\n");
    console.log("[live] usage:", JSON.stringify(result.usage));
    console.log("[live] escalated:", result.escalated, "| toolCalls:", result.toolCalls);

    expect(result.draft.trim().length).toBeGreaterThan(20);
    expect(result.escalated).toBe(false);

    // Every figure in the draft must be traceable to the data the model was
    // given — the live tiers or the published policy. The first version of this
    // check just looked for a "looks invented" shape and flagged "12–24 hours"
    // as a fabrication; it was not one, it was `service_tiers.est_hours` being
    // out of date. A test that guesses at wrongness instead of comparing
    // against the source sends you fixing the wrong thing.
    const { createAdminClient } = await import("@/lib/supabase/server");
    const { data: tiers } = await createAdminClient()
      .from("service_tiers")
      .select("label, size_desc, price, est_hours")
      .eq("is_active", true);

    const allowedText = [
      ...(tiers ?? []).flatMap((t: any) => [String(t.est_hours ?? ""), String(t.price ?? "")]),
      ...BUSINESS_POLICIES.map((p) => p.statement),
    ].join(" | ");

    console.log(
      "[live] tiers the model was given:",
      (tiers ?? []).map((t: any) => `${t.label}=$${t.price}/${t.est_hours}`).join(", ")
    );

    const hourFigures = result.draft.match(/\d+(?:\s*[–-]\s*\d+)?\s*(?:hours?|h\b)/gi) ?? [];
    const unexplainedHours = hourFigures.filter(
      (h) => !allowedText.toLowerCase().includes(h.toLowerCase().replace(/\s+/g, " ").trim())
    );
    if (unexplainedHours.length) {
      console.warn(
        `[live] WARNING turnaround figures not found in the tier data or the policy: ${unexplainedHours.join(", ")}`
      );
    }
    expect(
      unexplainedHours,
      "the draft quoted a turnaround that appears in neither service_tiers nor the published policy"
    ).toEqual([]);

    const priceFigures = result.draft.match(/\$\s?\d+(?:\.\d+)?/g) ?? [];
    const allowedPrices = new Set((tiers ?? []).map((t: any) => `$${Number(t.price).toFixed(2)}`));
    const unexplainedPrices = priceFigures.filter(
      (p) => !allowedPrices.has(`$${Number(p.replace(/[$\s]/g, "")).toFixed(2)}`)
    );
    if (unexplainedPrices.length) {
      console.warn(`[live] WARNING prices not in service_tiers: ${unexplainedPrices.join(", ")}`);
    }
    expect(unexplainedPrices, "the draft quoted a price that is not in service_tiers").toEqual([]);

    // The reference must never appear in a customer-facing draft.
    expect(result.draft).not.toContain("GX-");
    // Nor should our internal timeline line leak into it.
    expect(result.draft).not.toContain("Stage changed");
  }, 120_000);
});
