import { describe, it, expect } from "vitest";
import {
  FOLLOW_UP_DELAY_MS,
  MAX_AUTOMATED_FOLLOW_UPS,
  decideFollowUp,
  followUpKey,
  isChaseableStage,
  nextFollowUpAt,
} from "./follow-up";
import { QUOTE_CHASE_MS, STALE_LEAD_MS } from "@/lib/lead-timing";

const NOW = new Date("2026-10-10T12:00:00.000Z").getTime();
const HOUR = 3600000;

describe("nextFollowUpAt", () => {
  it("schedules from the moment the lead entered the stage", () => {
    expect(nextFollowUpAt("lead", NOW)!.getTime()).toBe(NOW + FOLLOW_UP_DELAY_MS.lead);
    expect(nextFollowUpAt("quote_sent", NOW)!.getTime()).toBe(NOW + QUOTE_CHASE_MS);
  });

  it("has no schedule for a stage that should not be chased", () => {
    // Won and lost leads must never be mailed by a robot.
    expect(nextFollowUpAt("won", NOW)).toBeNull();
    expect(nextFollowUpAt("lost", NOW)).toBeNull();
    expect(nextFollowUpAt("", NOW)).toBeNull();
  });

  it("takes a Date or a number interchangeably", () => {
    const asDate = nextFollowUpAt("lead", new Date(NOW));
    expect(asDate!.getTime()).toBe(nextFollowUpAt("lead", NOW)!.getTime());
  });

  it("reuses the dashboard's thresholds rather than restating them", () => {
    // If these drift, the panel says "quotes waiting" on one schedule and the
    // engine chases on another.
    expect(FOLLOW_UP_DELAY_MS.quote_sent).toBe(QUOTE_CHASE_MS);
    expect(FOLLOW_UP_DELAY_MS.contacted).toBe(STALE_LEAD_MS);
  });
});

describe("isChaseableStage", () => {
  it("covers the open pipeline only", () => {
    expect(isChaseableStage("lead")).toBe(true);
    expect(isChaseableStage("negotiation")).toBe(true);
    expect(isChaseableStage("won")).toBe(false);
    expect(isChaseableStage("lost")).toBe(false);
    expect(isChaseableStage(null)).toBe(false);
    expect(isChaseableStage("something_new")).toBe(false);
  });
});

describe("decideFollowUp", () => {
  const due = (msFromNow: number) => new Date(NOW + msFromNow).toISOString();

  it("sends when the due date has passed", () => {
    const d = decideFollowUp({ stage: "lead", followUpAt: due(-1), attempts: 0, now: NOW });
    expect(d.action).toBe("send");
  });

  it("waits when the due date is still ahead", () => {
    const d = decideFollowUp({ stage: "lead", followUpAt: due(HOUR), attempts: 0, now: NOW });
    expect(d.action).toBe("wait");
  });

  it("sends exactly at the due moment", () => {
    // Boundary is inclusive: a lead due now is due.
    const d = decideFollowUp({ stage: "lead", followUpAt: due(0), attempts: 0, now: NOW });
    expect(d.action).toBe("send");
  });

  it("never touches a closed lead, however overdue", () => {
    for (const stage of ["won", "lost"]) {
      const d = decideFollowUp({ stage, followUpAt: due(-30 * 24 * HOUR), attempts: 0, now: NOW });
      expect(d.action).toBe("skip");
    }
  });

  it("hands over to a human instead of mailing a third time", () => {
    const d = decideFollowUp({
      stage: "contacted",
      followUpAt: due(-1),
      attempts: MAX_AUTOMATED_FOLLOW_UPS,
      now: NOW,
    });
    expect(d.action).toBe("hand_to_human");
    if (d.action === "hand_to_human") expect(d.reason).toMatch(/2 automated/);
  });

  it("refuses to invent a schedule for a lead with no due date", () => {
    // Leads that predate the engine must not be mailed on a schedule nobody set.
    for (const followUpAt of [null, undefined, ""]) {
      const d = decideFollowUp({ stage: "lead", followUpAt, attempts: 0, now: NOW });
      expect(d.action).toBe("skip");
      if (d.action === "skip") expect(d.reason).toMatch(/no follow-up date/i);
    }
  });

  it("refuses a malformed date rather than treating it as due", () => {
    const d = decideFollowUp({ stage: "lead", followUpAt: "not a date", attempts: 0, now: NOW });
    expect(d.action).toBe("skip");
  });

  it("always says why it did nothing", () => {
    const outcomes = [
      decideFollowUp({ stage: "won", followUpAt: due(-1), attempts: 0, now: NOW }),
      decideFollowUp({ stage: "lead", followUpAt: null, attempts: 0, now: NOW }),
      decideFollowUp({ stage: "lead", followUpAt: due(-1), attempts: 5, now: NOW }),
    ];
    for (const o of outcomes) {
      if (o.action === "skip" || o.action === "hand_to_human") {
        expect(o.reason.length).toBeGreaterThan(5);
      }
    }
  });
});

describe("followUpKey", () => {
  it("is stable per lead and sequence, which is what makes a retry a no-op", () => {
    expect(followUpKey("lead-1", 1)).toBe("lead-1:1");
    expect(followUpKey("lead-1", 1)).toBe(followUpKey("lead-1", 1));
    expect(followUpKey("lead-1", 2)).not.toBe(followUpKey("lead-1", 1));
    expect(followUpKey("lead-2", 1)).not.toBe(followUpKey("lead-1", 1));
  });
});
