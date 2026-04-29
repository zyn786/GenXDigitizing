import { describe, expect, it } from "vitest";

import { canEnterPath, resolveDashboardPath } from "@/lib/auth/session";

describe("auth session routing helpers", () => {
  it("resolves dashboards by role", () => {
    expect(resolveDashboardPath("CLIENT")).toBe("/client/dashboard");
    expect(resolveDashboardPath("MANAGER")).toBe("/admin");
    expect(resolveDashboardPath(null)).toBe("/login");
  });

  it("protects client and admin paths", () => {
    expect(canEnterPath("/client/dashboard", null)).toBe(false);
    expect(canEnterPath("/client/dashboard", "CLIENT")).toBe(true);
    expect(canEnterPath("/admin", "CLIENT")).toBe(false);
    expect(canEnterPath("/admin", "SUPER_ADMIN")).toBe(true);
  });
});
