import { describe, it, expect } from "vitest";
import {
  formatLeadReferenceLine,
  generateLeadReference,
  normaliseLeadReference,
  parseLeadReference,
} from "./lead-reference";

describe("generateLeadReference", () => {
  it("produces the documented shape", () => {
    expect(generateLeadReference()).toMatch(/^GX-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  });

  it("never emits a character that is misread aloud", () => {
    // 0/O, 1/I/L are excluded so a reference survives being read over the phone.
    for (let i = 0; i < 200; i++) {
      const ref = generateLeadReference();
      expect(ref.slice(3)).not.toMatch(/[01OIL]/);
    }
  });

  it("does not repeat itself", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) seen.add(generateLeadReference());
    expect(seen.size).toBe(500);
  });
});

describe("normaliseLeadReference", () => {
  it("accepts what a customer actually types", () => {
    expect(normaliseLeadReference("gx-7k2m9q")).toBe("GX-7K2M9Q");
    expect(normaliseLeadReference("  GX 7K2M9Q ")).toBe("GX-7K2M9Q");
    expect(normaliseLeadReference("7k2m9q")).toBe("GX-7K2M9Q");
  });

  it("rejects wrong lengths and excluded characters", () => {
    expect(normaliseLeadReference("GX-7K2M9")).toBeNull();
    expect(normaliseLeadReference("GX-7K2M9QQ")).toBeNull();
    expect(normaliseLeadReference("GX-7K2M90")).toBeNull(); // 0 is not in the alphabet
    expect(normaliseLeadReference("")).toBeNull();
    expect(normaliseLeadReference(null)).toBeNull();
    expect(normaliseLeadReference(undefined)).toBeNull();
  });
});

describe("parseLeadReference", () => {
  it("finds the reference in a lead's notes", () => {
    const notes = [
      formatLeadReferenceLine("GX-7K2M9Q"),
      "Design: Jaguar Head",
      "Placement: Left Chest",
    ].join("\n");
    expect(parseLeadReference(notes)).toBe("GX-7K2M9Q");
  });

  it("finds a reference written mid-note", () => {
    const notes = "Design: X\nCustomer called, quoted Reference: gx-4tuvwx\n";
    expect(parseLeadReference(notes)).toBe("GX-4TUVWX");
  });

  it("returns null when there is none, or when the shape is wrong", () => {
    expect(parseLeadReference("Design: X\nPlacement: Cap")).toBeNull();
    expect(parseLeadReference(null)).toBeNull();
    expect(parseLeadReference("Reference: GX-TOOLONG9")).toBeNull();
  });

  it("round-trips with the writer", () => {
    const ref = generateLeadReference();
    expect(parseLeadReference(formatLeadReferenceLine(ref))).toBe(ref);
  });
});
