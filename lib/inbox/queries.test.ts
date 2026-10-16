import { describe, it, expect, vi, beforeEach } from "vitest";
import { isInboxStaff, INBOX_ROLES } from "./queries";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: () => ({ from }) }));

// Imported after the mock so the capability probe sees the fake client.
const { inboxCapabilities } = await import("./queries");

/**
 * The inbox is the only surface that reads customer conversation history, so
 * who can reach it is worth pinning down. Migration 057 grants these tables to
 * `admin` and `crm` through RLS; this predicate is the second lock, and the two
 * lists must not drift apart.
 */
describe("inbox authorisation", () => {
  it("admits exactly the roles migration 057 admits", () => {
    // If this changes, 057's `my_role() in ('admin','crm')` policy must change
    // with it — otherwise the app and the database disagree about the audience.
    expect([...INBOX_ROLES].sort()).toEqual(["admin", "crm"]);
  });

  it("admits admin and crm", () => {
    expect(isInboxStaff("admin")).toBe(true);
    expect(isInboxStaff("crm")).toBe(true);
  });

  it("refuses every other role", () => {
    // client and designer are the other two values of the user_role enum.
    expect(isInboxStaff("client")).toBe(false);
    expect(isInboxStaff("designer")).toBe(false);
    expect(isInboxStaff("ADMIN")).toBe(false); // case matters
    expect(isInboxStaff("super_admin")).toBe(false); // does not exist in the schema
  });

  it("refuses a missing or empty role", () => {
    // `getAdminUser()` can return a profile with a null role, and it is
    // misnamed: it admits ANY authenticated user, customers included.
    expect(isInboxStaff(null)).toBe(false);
    expect(isInboxStaff(undefined)).toBe(false);
    expect(isInboxStaff("")).toBe(false);
  });
});

/**
 * Migration 063 is additive and ships after this code, so the inbox asks the
 * database what it supports instead of assuming. Getting this wrong is not a
 * cosmetic bug: a probe that answers "yes" for a column that does not exist
 * makes the thread view render the note composer and then 500 on the first
 * `listNotes`, taking down the whole conversation pane.
 */
describe("inbox capability probe", () => {
  // `vi.clearAllMocks()`, not `from.mockReset()`. Vitest 2 has a quirk where
  // clearing that one mock directly in a hook makes the *caught* throw in the
  // last test below resurface as a failure — the error is handled, the probe
  // returns the right value, and the test still reports "boom". This form
  // clears the accumulated `mock.calls` the last test depends on and stays
  // quiet.
  beforeEach(() => vi.clearAllMocks());

  /** postgrest-js builder: `.from().select().limit()` resolves, it never rejects. */
  const builder = (settle: () => unknown) => ({
    select: () => ({ limit: () => Promise.resolve(settle()) }),
  });

  it("reports both features when the schema has them", async () => {
    from.mockImplementation(() => builder(() => ({ data: [], error: null })));
    expect(await inboxCapabilities()).toEqual({ assignment: true, notes: true });
  });

  it("reports a missing column as absent, because postgrest RESOLVES the error", async () => {
    // The regression this pins: a resolved `{ error }` is not a rejection, so
    // a probe written with a rejection handler alone answers `true` here.
    from.mockImplementation(() =>
      builder(() => ({ data: null, error: { code: "42703", message: "column does not exist" } }))
    );
    expect(await inboxCapabilities()).toEqual({ assignment: false, notes: false });
  });

  it("reports a missing table as absent", async () => {
    from.mockImplementation(() =>
      builder(() => ({ data: null, error: { code: "42P01", message: "relation does not exist" } }))
    );
    expect(await inboxCapabilities()).toEqual({ assignment: false, notes: false });
  });

  it("reports both absent when the client throws", async () => {
    from.mockImplementation(() => {
      throw new Error("fetch failed");
    });
    expect(await inboxCapabilities()).toEqual({ assignment: false, notes: false });
  });

  it("asks about assigned_to and conversation_notes, not something else", async () => {
    from.mockImplementation(() => builder(() => ({ data: [], error: null })));
    await inboxCapabilities();
    expect(from.mock.calls.map((c) => c[0]).sort()).toEqual([
      "conversation_notes",
      "conversations",
    ]);
  });
});
