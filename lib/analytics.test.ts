import { describe, it, expect } from "vitest";
import {
  MIN_SAMPLE_FOR_RATE,
  buildFunnelReport,
  formatDuration,
  formatRate,
  type EventRow,
} from "./analytics";

const T0 = Date.parse("2026-10-01T09:00:00.000Z");
const hours = (n: number) => new Date(T0 + n * 3600000).toISOString();

function ev(
  lead_id: string,
  type: string,
  atHours: number,
  extra: Partial<EventRow> = {}
): EventRow {
  return {
    lead_id,
    type,
    from_stage: null,
    to_stage: null,
    created_at: hours(atHours),
    ...extra,
  };
}

describe("buildFunnelReport", () => {
  it("measures first contact from creation to the first human action", () => {
    const report = buildFunnelReport([
      ev("a", "created", 0, { to_stage: "lead" }),
      ev("a", "email_sent", 2),
    ]);
    expect(report.timeToFirstContact.medianHours).toBe(2);
    expect(report.timeToFirstContact.samples).toBe(1);
  });

  it("does not count an automated follow-up as a reply", () => {
    // The customer is still waiting. Counting it would flatter the number.
    const report = buildFunnelReport([
      ev("a", "created", 0),
      ev("a", "note", 4),
      ev("a", "stage_change", 30, { from_stage: "lead", to_stage: "contacted" }),
    ]);
    expect(report.timeToFirstContact.medianHours).toBe(30);
  });

  it("uses the median, so one abandoned lead cannot skew it", () => {
    const rows: EventRow[] = [];
    for (const [i, replyAfter] of [1, 2, 3, 4, 500].entries()) {
      const id = `lead-${i}`;
      rows.push(ev(id, "created", 0));
      rows.push(ev(id, "email_sent", replyAfter));
    }
    // Mean would be 102 hours. Median is 3.
    expect(buildFunnelReport(rows).timeToFirstContact.medianHours).toBe(3);
  });

  it("ignores events that are out of order rather than reporting negative time", () => {
    const report = buildFunnelReport([
      ev("a", "created", 10),
      ev("a", "email_sent", 2), // before creation — bad data
    ]);
    expect(report.timeToFirstContact.samples).toBe(0);
    expect(report.timeToFirstContact.medianHours).toBeNull();
  });

  it("measures quote to won on the same lead", () => {
    const report = buildFunnelReport([
      ev("a", "created", 0),
      ev("a", "stage_change", 5, { from_stage: "lead", to_stage: "quote_sent" }),
      ev("a", "stage_change", 29, { from_stage: "quote_sent", to_stage: "won" }),
    ]);
    expect(report.quoteToWon.medianHours).toBe(24);
    expect(report.totals.quotesSent).toBe(1);
    expect(report.totals.won).toBe(1);
  });

  it("refuses to state a conversion rate on too few leads", () => {
    const rows: EventRow[] = [
      ev("a", "created", 0),
      ev("a", "stage_change", 1, { to_stage: "won" }),
    ];
    const report = buildFunnelReport(rows);
    expect(report.leadToWon.pct).toBeNull();
    expect(report.leadToWon.note).toMatch(/too few to say/);
  });

  it("states the rate once there is enough to say it", () => {
    const rows: EventRow[] = [];
    for (let i = 0; i < MIN_SAMPLE_FOR_RATE; i++) {
      rows.push(ev(`lead-${i}`, "created", 0));
      if (i < 3) rows.push(ev(`lead-${i}`, "stage_change", 1, { to_stage: "won" }));
    }
    const report = buildFunnelReport(rows);
    expect(report.leadToWon.pct).toBe(30);
    expect(report.leadToWon.denominator).toBe(MIN_SAMPLE_FOR_RATE);
  });

  it("returns an empty report rather than throwing on no events", () => {
    const report = buildFunnelReport([]);
    expect(report.timeToFirstContact.medianHours).toBeNull();
    expect(report.leadToWon.pct).toBeNull();
    expect(report.totals.leads).toBe(0);
  });

  it("keeps leads apart — one lead's reply is not another's", () => {
    const report = buildFunnelReport([
      ev("a", "created", 0),
      ev("a", "email_sent", 1),
      ev("b", "created", 0),
      ev("b", "email_sent", 9),
    ]);
    expect(report.timeToFirstContact.samples).toBe(2);
    expect(report.timeToFirstContact.medianHours).toBe(5);
  });
});

describe("formatting", () => {
  it("shows the sample size beside the duration", () => {
    // A duration without its n is a coincidence presented as a measurement.
    expect(formatDuration({ medianHours: 4, samples: 12 })).toBe("4 hours (12 leads)");
    expect(formatDuration({ medianHours: 1, samples: 1 })).toBe("1 hour (1 lead)");
    expect(formatDuration({ medianHours: null, samples: 0 })).toBe("—");
  });

  it("shows the fraction beside a rate, and the caveat when there is none", () => {
    expect(formatRate({ numerator: 3, denominator: 10, pct: 30 })).toBe("30% (3/10)");
    expect(formatRate({ numerator: 1, denominator: 2, pct: null, note: "too few to say" })).toBe(
      "too few to say"
    );
  });
});
