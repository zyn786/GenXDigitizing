import { describe, it, expect } from "vitest";
import { computeDeadline, turnaroundHours, BIG_DESIGN_HOURS, TURNAROUND_HOURS } from "./sla";

const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);
const hoursFrom = (iso: string) => (new Date(iso).getTime() - NOW) / 3_600_000;

describe("turnaroundHours", () => {
  it("maps each turnaround speed", () => {
    expect(turnaroundHours("standard")).toBe(24);
    expect(turnaroundHours("rush")).toBe(6);
    expect(turnaroundHours("urgent")).toBe(3);
  });

  it("gives a big design 12h whatever the speed", () => {
    expect(turnaroundHours("standard", true)).toBe(BIG_DESIGN_HOURS);
    expect(turnaroundHours("rush", true)).toBe(BIG_DESIGN_HOURS);
    expect(turnaroundHours("urgent", true)).toBe(BIG_DESIGN_HOURS);
  });

  it("falls back to the slowest option for missing or unknown input", () => {
    expect(turnaroundHours(null)).toBe(TURNAROUND_HOURS.standard);
    expect(turnaroundHours(undefined)).toBe(TURNAROUND_HOURS.standard);
    expect(turnaroundHours("nonsense")).toBe(TURNAROUND_HOURS.standard);
  });
});

describe("computeDeadline", () => {
  it("returns an ISO timestamp the requested number of hours out", () => {
    expect(hoursFrom(computeDeadline("standard", false, NOW))).toBe(24);
    expect(hoursFrom(computeDeadline("rush", false, NOW))).toBe(6);
    expect(hoursFrom(computeDeadline("urgent", false, NOW))).toBe(3);
  });

  it("matches the client wizards' short-circuit for the real cases", () => {
    // `big ? 12 : urgent ? 3 : rush ? 6 : 24` — the rule this replaces.
    const legacy = (turn: string, big: boolean) => (big ? 12 : turn === "urgent" ? 3 : turn === "rush" ? 6 : 24);
    for (const turn of ["standard", "rush", "urgent"]) {
      for (const big of [true, false]) {
        expect(hoursFrom(computeDeadline(turn, big, NOW))).toBe(legacy(turn, big));
      }
    }
  });

  it("fixes convert-to-order, which gave a big standard order 24h instead of 12h", () => {
    // The old CRM path: `urgent ? 3 : rush ? 6 : 24`, with no big-design branch.
    const legacyCrm = (turn: string) => (turn === "urgent" ? 3 : turn === "rush" ? 6 : 24);
    expect(legacyCrm("standard")).toBe(24);
    expect(hoursFrom(computeDeadline("standard", true, NOW))).toBe(12);
  });

  it("produces a UTC ISO string, so it is timezone-independent", () => {
    const iso = computeDeadline("standard", false, NOW);
    expect(iso.endsWith("Z")).toBe(true);
    expect(new Date(iso).toISOString()).toBe(iso);
  });
});
