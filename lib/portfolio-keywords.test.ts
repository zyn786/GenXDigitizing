import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { readSourceStripped } from "./test-source";

/**
 * The portfolio "Keywords — comma-separated, for SEO" field had never saved,
 * and it took three independent faults for that to be true at once:
 *
 *   1. no `keywords` column on `portfolios`;
 *   2. the API routes never read `body.keywords` (the blog routes did);
 *   3. the input rebuilt its array on every keystroke with `.filter(Boolean)`,
 *      which deleted the empty entry a comma produces — so the comma vanished
 *      as you typed it and the second keyword could never be started.
 *
 * Fixing any one alone would still leave it broken, so each layer gets its own
 * assertion. This is a source scan because that is where the bug lived: the
 * form collected data, the API silently dropped it, and nothing errored.
 */

const root = process.cwd();
const read = (p: string) => readSourceStripped(p);

const ADMIN_CLIENT = "app/(portals)/admin/portfolio/PortfolioAdminClient.tsx";
const CREATE_ROUTE = "app/api/admin/portfolio/route.ts";
const UPDATE_ROUTE = "app/api/admin/portfolio/[id]/route.ts";
const QUERIES = "lib/supabase/portfolio-queries.ts";
const PUBLIC_PAGE = "app/(marketing)/portfolio/page.tsx";

describe("layer 1 — the column exists", () => {
  it("migration 066 adds keywords to portfolios", () => {
    const file = "supabase/migrations/066_portfolio_keywords.sql";
    expect(existsSync(path.join(root, file))).toBe(true);
    const sql = read(file);
    expect(sql).toMatch(/alter table public\.portfolios/i);
    expect(sql).toMatch(/add column if not exists keywords text\[\]/i);
  });

  it("the query layer maps it and tolerates its absence", () => {
    // `|| []` matters: the code has to keep working against a database that has
    // not had 066 applied.
    expect(read(QUERIES)).toMatch(/keywords: item\.keywords \|\| \[\]/);
  });
});

describe("layer 2 — the API stores it", () => {
  it("create reads body.keywords", () => {
    const src = read(CREATE_ROUTE);
    expect(src).toMatch(/keywords/);
    expect(src).toMatch(/Array\.isArray\(body\.keywords\)/);
  });

  it("update reads body.keywords", () => {
    const src = read(UPDATE_ROUTE);
    expect(src).toMatch(/body\.keywords !== undefined/);
    expect(src).toMatch(/updateData\.keywords/);
  });
});

describe("layer 3 — the input accepts a comma", () => {
  it("is not bound to the parsed array", () => {
    // The exact shape of the bug: rendering `form.keywords.join(", ")` while
    // the change handler filters empties means the comma is deleted on the
    // keystroke that typed it.
    const src = read(ADMIN_CLIENT);
    expect(src).not.toMatch(/value=\{form\.keywords\.join\(",\s*"\)\}/);
  });

  it("keeps raw text while typing and parses it once, on save", () => {
    const src = read(ADMIN_CLIENT);
    expect(src).toMatch(/const \[keywordsText, setKeywordsText\]/);
    expect(src).toMatch(/value=\{keywordsText\}/);
    expect(src).toMatch(/keywords: parseKeywords\(keywordsText\)/);
  });

  it("parses commas, trims, and drops blanks — in one place", () => {
    const src = read(ADMIN_CLIENT);
    // One definition, used by the chip preview and the save payload alike, so
    // they cannot disagree about what the typed text means.
    expect(src.match(/function parseKeywords/g)?.length).toBe(1);
    expect(src).toMatch(/\.split\(","\)/);
    expect(src).toMatch(/\.filter\(Boolean\)/);
  });

  it("clears the field when opening a new project", () => {
    // Otherwise the last project's keywords silently attach to the new one.
    const src = read(ADMIN_CLIENT);
    const newProject = src.slice(src.indexOf("setForm(DEFAULT_FORM)"));
    expect(newProject.slice(0, 200)).toMatch(/setKeywordsText\(""\)/);
  });
});

describe("the field does something once saved", () => {
  it("merges project keywords into the page metadata", () => {
    // A field that saves but changes nothing is the same bug wearing a hat.
    const src = read(PUBLIC_PAGE);
    expect(src).toMatch(/export async function generateMetadata/);
    expect(src).toMatch(/BASE_KEYWORDS/);
    expect(src).toMatch(/projectKeywords\(\)/);
  });

  it("falls back to the static list rather than failing the build", () => {
    // This runs at build time too, and createAdminClient() throws when its env
    // is absent. Metadata must never be why a page fails to build.
    const src = read(PUBLIC_PAGE);
    expect(src).toMatch(/catch \{/);
    expect(src).toMatch(/return \[\];/);
  });
});
