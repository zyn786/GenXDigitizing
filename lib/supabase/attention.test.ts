import { describe, it, expect } from "vitest";
import { humanAge, orderRiskLevel } from "./attention";

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("humanAge", () => {
  it("reads the way the alerts are phrased", () => {
    expect(humanAge(45 * MIN)).toBe("45 minutes");
    expect(humanAge(1 * MIN)).toBe("1 minute");
    expect(humanAge(4 * HOUR)).toBe("4 hours");
    expect(humanAge(1 * HOUR)).toBe("1 hour");
    expect(humanAge(3 * DAY)).toBe("3 days");
    expect(humanAge(1 * DAY)).toBe("1 day");
  });

  it("rolls over at the boundaries rather than rounding up", () => {
    expect(humanAge(59 * MIN)).toBe("59 minutes");
    expect(humanAge(60 * MIN)).toBe("1 hour");
    expect(humanAge(23 * HOUR)).toBe("23 hours");
    expect(humanAge(24 * HOUR)).toBe("1 day");
  });

  it("never renders a negative age", () => {
    // A clock skew between the database and the server should read "0 minutes",
    // not "-1 minutes" on a customer-facing screen.
    expect(humanAge(-5 * MIN)).toBe("0 minutes");
  });
});

describe("orderRiskLevel", () => {
  it("is critical once the deadline has passed", () => {
    expect(orderRiskLevel(-1 * MIN)).toBe("critical");
    expect(orderRiskLevel(-3 * DAY)).toBe("critical");
  });

  it("matches the SLA cron's urgent window", () => {
    expect(orderRiskLevel(0)).toBe("critical");
    expect(orderRiskLevel(29 * MIN)).toBe("critical");
    expect(orderRiskLevel(30 * MIN)).toBe("critical"); // boundary is inclusive
  });

  it("is a warning inside the two-hour window and not before", () => {
    expect(orderRiskLevel(31 * MIN)).toBe("warning");
    expect(orderRiskLevel(2 * HOUR)).toBe("warning");
    expect(orderRiskLevel(2 * HOUR + MIN)).toBe("warning"); // query already bounded
  });
});
