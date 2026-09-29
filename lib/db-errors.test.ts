import { describe, it, expect } from "vitest";
import { isMissingColumn } from "./db-errors";

describe("isMissingColumn", () => {
  it("recognises the PostgREST schema-cache phrasing", () => {
    // The exact string our sync route logged before migration 037 was applied.
    expect(
      isMissingColumn({
        message: "Could not find the 'message_id' column of 'received_emails' in the schema cache",
      })
    ).toBe(true);
  });

  it("recognises the direct Postgres phrasing", () => {
    expect(isMissingColumn({ message: 'column "thread_id" does not exist' })).toBe(true);
  });

  it("recognises a missing table", () => {
    expect(
      isMissingColumn({
        message: "Could not find the table 'public.email_thread_summary' in the schema cache",
      })
    ).toBe(true);
  });

  it("accepts a bare string", () => {
    expect(isMissingColumn('column "is_read" does not exist')).toBe(true);
  });

  it("does not fire on unrelated failures", () => {
    expect(isMissingColumn({ message: "duplicate key value violates unique constraint" })).toBe(
      false
    );
    expect(isMissingColumn({ message: "permission denied for table users" })).toBe(false);
    expect(isMissingColumn({ message: "JWT expired" })).toBe(false);
  });

  it("is safe on empty input", () => {
    expect(isMissingColumn(null)).toBe(false);
    expect(isMissingColumn(undefined)).toBe(false);
    expect(isMissingColumn({})).toBe(false);
  });
});
