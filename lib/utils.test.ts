import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  formatFileSize,
  formatStitchCount,
  getInitials,
  isOverdue,
  hoursUntilDeadline,
  slaStatusColor,
  calculateSLADeadline,
  pct,
  slugify,
  truncate,
  STATUS_LABEL,
  TURNAROUND_OPTIONS,
  OUTPUT_FORMATS,
  DEFAULT_PRICES,
} from "./utils";

describe("cn", () => {
  it("merges classes", () => {
    const result = cn("px-4", "py-2");
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
  });

  it("resolves tailwind conflicts", () => {
    const result = cn("px-4", "px-2");
    expect(result).toContain("px-2");
    expect(result).not.toContain("px-4");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
    expect(result).not.toContain("hidden");
  });
});

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(1500)).toBe("$1,500");
  });

  it("formats compact", () => {
    expect(formatCurrency(1500, "USD", true)).toContain("1.5");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });
});

describe("formatFileSize", () => {
  it("formats KB", () => {
    expect(formatFileSize(500)).toBe("500 KB");
  });

  it("formats MB", () => {
    expect(formatFileSize(2048)).toBe("2.0 MB");
  });
});

describe("formatStitchCount", () => {
  it("formats with commas", () => {
    expect(formatStitchCount(15000)).toBe("15,000");
  });
});

describe("getInitials", () => {
  it("extracts initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("handles single name", () => {
    expect(getInitials("Cher")).toBe("C");
  });

  it("handles empty name", () => {
    expect(getInitials("")).toBe("");
  });

  it("handles multiple spaces", () => {
    expect(getInitials("John   Michael   Doe")).toBe("JM");
  });
});

describe("isOverdue", () => {
  it("returns true for past deadline", () => {
    const past = new Date(Date.now() - 3600000).toISOString();
    expect(isOverdue(past)).toBe(true);
  });

  it("returns false for future deadline", () => {
    const future = new Date(Date.now() + 3600000).toISOString();
    expect(isOverdue(future)).toBe(false);
  });

  it("returns false for null deadline", () => {
    expect(isOverdue(null)).toBe(false);
  });

  it("returns false for undefined deadline", () => {
    expect(isOverdue(undefined)).toBe(false);
  });
});

describe("hoursUntilDeadline", () => {
  it("returns positive hours for future", () => {
    const future = new Date(Date.now() + 7200000).toISOString();
    const h = hoursUntilDeadline(future);
    expect(h).toBeGreaterThan(0);
  });

  it("returns negative hours for past", () => {
    const past = new Date(Date.now() - 3600000).toISOString();
    const h = hoursUntilDeadline(past);
    expect(h).toBeLessThan(0);
  });

  it("returns null for null", () => {
    expect(hoursUntilDeadline(null)).toBeNull();
  });
});

describe("slaStatusColor", () => {
  it("returns red for overdue", () => {
    const past = new Date(Date.now() - 3600000).toISOString();
    expect(slaStatusColor(past)).toBe("text-red-400");
  });

  it("returns red for < 2 hours", () => {
    const soon = new Date(Date.now() + 3600000).toISOString();
    expect(slaStatusColor(soon)).toBe("text-red-400");
  });

  it("returns orange for < 4 hours", () => {
    const medium = new Date(Date.now() + 3 * 3600000).toISOString();
    expect(slaStatusColor(medium)).toBe("text-[#E76F2E]");
  });

  it("returns green for > 4 hours", () => {
    const far = new Date(Date.now() + 5 * 3600000).toISOString();
    expect(slaStatusColor(far)).toBe("text-green-400");
  });

  it("returns muted for null", () => {
    expect(slaStatusColor(null)).toBe("text-slate-400");
  });
});

describe("calculateSLADeadline", () => {
  it("calculates standard turnaround (24h)", () => {
    const deadline = calculateSLADeadline("standard", false);
    const diffHours = (deadline.getTime() - Date.now()) / 3600000;
    expect(diffHours).toBeCloseTo(24, 0);
  });

  it("calculates rush turnaround (6h)", () => {
    const deadline = calculateSLADeadline("rush", false);
    const diffHours = (deadline.getTime() - Date.now()) / 3600000;
    expect(diffHours).toBeCloseTo(6, 0);
  });

  it("calculates urgent turnaround (3h)", () => {
    const deadline = calculateSLADeadline("urgent", false);
    const diffHours = (deadline.getTime() - Date.now()) / 3600000;
    expect(diffHours).toBeCloseTo(3, 0);
  });

  it("big designs always get 12h", () => {
    expect(calculateSLADeadline("standard", true).getTime() - Date.now()).toBeCloseTo(12 * 3600000, -2);
    expect(calculateSLADeadline("rush", true).getTime() - Date.now()).toBeCloseTo(12 * 3600000, -2);
    expect(calculateSLADeadline("urgent", true).getTime() - Date.now()).toBeCloseTo(12 * 3600000, -2);
  });
});

describe("pct", () => {
  it("calculates percentage", () => {
    expect(pct(3, 10)).toBe(30);
  });

  it("returns 0 for total=0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("handles decimals", () => {
    const result = pct(1, 3, 1);
    expect(result).toBeCloseTo(33.3, 0);
  });
});

describe("slugify", () => {
  it("converts string to slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Test@#$String!")).toBe("teststring");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });
});

describe("truncate", () => {
  it("returns full string if short enough", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long string", () => {
    const result = truncate("hello world this is long", 10);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result).toContain("…");
  });
});

describe("STATUS_LABEL", () => {
  it("has labels for all statuses", () => {
    const statuses = ["submitted", "assigned", "in_progress", "review", "approved", "delivered", "revision", "refunded", "cancelled"];
    for (const s of statuses) {
      expect(STATUS_LABEL[s]).toBeTruthy();
    }
  });
});

describe("TURNAROUND_OPTIONS", () => {
  it("has all turnaround types", () => {
    expect(TURNAROUND_OPTIONS.standard).toBeTruthy();
    expect(TURNAROUND_OPTIONS.rush).toBeTruthy();
    expect(TURNAROUND_OPTIONS.urgent).toBeTruthy();
  });
});

describe("OUTPUT_FORMATS", () => {
  it("includes machine and vector formats", () => {
    expect(OUTPUT_FORMATS).toContain("DST");
    expect(OUTPUT_FORMATS).toContain("SVG");
    expect(OUTPUT_FORMATS).toContain("PDF");
  });
});

describe("DEFAULT_PRICES", () => {
  it("has prices for all tiers", () => {
    expect(DEFAULT_PRICES.digitizing_standard).toBe(7);
    expect(DEFAULT_PRICES.digitizing_large).toBe(18);
    expect(DEFAULT_PRICES.vector_basic).toBe(8);
    expect(DEFAULT_PRICES.sewout_large).toBe(10);
  });
});
