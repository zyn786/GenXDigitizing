import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { TURNAROUND_RANGE_LABEL } from "./site-config";
import { TURNAROUND_HOURS } from "./sla";

/**
 * Guards the turnaround claim in shipped copy.
 *
 * The site said "12-hour turnaround" in about twenty places while the
 * scheduler allowed 24, and after that was reconciled, two more surfaces still
 * carried the old wording for a day: the structured data Google reads, and the
 * root layout's global description — which appears in search results and on
 * every share card. Both were found only by fetching production and reading it,
 * which is not a repeatable check.
 *
 * These tests read the files instead. They are deliberately narrow: the exact
 * string "12-hour" / "12hr turnaround" in shipped source is always wrong now,
 * because the published claim is a range. A big design's "~12h" is a different
 * statement and is matched by neither pattern.
 */

const ROOTS = ["app", "components", "lib"];
const SKIP = [/\.test\./, /node_modules/, /\.next/];

/**
 * Every shape the retired claim ships in.
 *
 * The range form is the one the original guard missed. It matched "12-hour"
 * and "12hr" — but the wording that actually survived was "12–24h", with an
 * en dash between the numbers, on four service pages and in the terms and
 * conditions. Those drifted for as long as the guard existed and were only
 * found by fetching production and reading it, which is the thing this file
 * exists to avoid.
 */
const RETIRED_TURNAROUND = /\b12\s*[–—-]\s*24\s*(?:h|hour)|\b12[-\s]?hour\b|\b12hr\b/i;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (SKIP.some((re) => re.test(full))) continue;
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(full)) out.push(full);
  }
  return out;
}

/** Strip comments so a file explaining the old claim is not flagged for it. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("published turnaround claim", () => {
  it("is the range the tiers actually cover", () => {
    expect(TURNAROUND_RANGE_LABEL).toBe("3–24h");
    expect(Object.values(TURNAROUND_HOURS)).toContain(24);
  });

  it("appears nowhere in shipped source as a flat 12-hour claim", () => {
    const offenders: string[] = [];
    for (const root of ROOTS) {
      for (const file of sourceFiles(root)) {
        const src = stripComments(readFileSync(file, "utf8"));
        // The retired wording, in the shapes it actually shipped in.
        if (RETIRED_TURNAROUND.test(src)) {
          offenders.push(file);
        }
      }
    }
    expect(
      offenders,
      "these files still claim a 12-hour turnaround; the published figure is a range"
    ).toEqual([]);
  });

  it("still allows a big design to be described as about 12 hours", () => {
    // Not a contradiction: BIG_DESIGN_HOURS is 12 by design, and the copy that
    // says so must keep passing. Verified against the real strings in the repo.
    const legitimate = [
      "Complex design — ~12h",
      "12 hours regardless of the speed",
      "Jumbo / Full Back and Complex Vector: ~12 hours",
    ];
    for (const s of legitimate) {
      expect(RETIRED_TURNAROUND.test(s), s).toBe(false);
    }
  });

  it("catches every shape the retired claim shipped in", () => {
    // Named so that removing one of these is a deliberate act rather than an
    // accident of editing the regex.
    const retired = [
      "12-hour turnaround",
      "12hr turnaround",
      "12–24h delivery", // en dash — the form that survived the original guard
      "12-24h delivery", // hyphen
      "Standard 12–24h, Rush 6h", // as written in the terms
      "delivered in 12–24 hours",
    ];
    for (const s of retired) {
      expect(RETIRED_TURNAROUND.test(s), s).toBe(true);
    }
  });

  it("is honest about what it does not catch", () => {
    // A bare "12 hours" is still allowed through, because the big-design copy
    // uses that phrasing legitimately — so a plain "12 hours turnaround" would
    // slip past. Naming the gap beats implying coverage the check does not have.
    expect(RETIRED_TURNAROUND.test("12 hours turnaround")).toBe(false);
  });
});
