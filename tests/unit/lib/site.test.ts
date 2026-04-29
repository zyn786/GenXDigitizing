import { describe, expect, it } from "vitest";

import { buildTitle, siteConfig } from "@/lib/site";

describe("site config", () => {
  it("builds page titles against the site name", () => {
    expect(buildTitle("Pricing")).toBe(`Pricing · ${siteConfig.name}`);
  });
});
