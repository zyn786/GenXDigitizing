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
        if (/\b12[-\s]?hour\b/i.test(src) || /\b12hr\b/i.test(src)) {
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
      expect(/\b12[-\s]?hour\b/i.test(s), s).toBe(false);
      expect(/\b12hr\b/i.test(s), s).toBe(false);
    }
  });

  it("is honest about what it does not catch", () => {
    // The guard matches "12-hour" and "12hr", which is what actually shipped.
    // A bare "12 hours" is deliberately allowed through because the big-design
    // copy uses it — so a plain "12 hours turnaround" would slip past. Naming
    // the gap beats implying coverage the check does not have.
    expect(/\b12[-\s]?hour\b/i.test("12-hour turnaround")).toBe(true);
    expect(/\b12hr\b/i.test("12hr turnaround")).toBe(true);
    expect(/\b12[-\s]?hour\b/i.test("12 hours turnaround")).toBe(false);
  });
});
