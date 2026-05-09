import { describe, expect, it } from "vitest";

import {
  isAppAdminRole,
  canEnterPath,
  resolveAccessDecision,
  resolveDashboardPath,
  ADMIN_ROLES,
} from "@/lib/auth/session";

describe("isAppAdminRole", () => {
  it("returns true for admin roles", () => {
    for (const role of ADMIN_ROLES) {
      expect(isAppAdminRole(role)).toBe(true);
    }
  });

  it("returns false for CLIENT", () => {
    expect(isAppAdminRole("CLIENT")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isAppAdminRole(null)).toBe(false);
    expect(isAppAdminRole(undefined)).toBe(false);
    expect(isAppAdminRole("")).toBe(false);
  });

  it("returns false for unknown strings", () => {
    expect(isAppAdminRole("HACKER")).toBe(false);
    expect(isAppAdminRole("admin")).toBe(false); // case-sensitive
  });
});

describe("canEnterPath", () => {
  it("allows admin roles into /admin paths", () => {
    expect(canEnterPath("/admin/orders", "SUPER_ADMIN")).toBe(true);
    expect(canEnterPath("/admin/orders", "MANAGER")).toBe(true);
    expect(canEnterPath("/admin/orders", "DESIGNER")).toBe(true);
  });

  it("blocks CLIENT from /admin paths", () => {
    expect(canEnterPath("/admin/orders", "CLIENT")).toBe(false);
    expect(canEnterPath("/admin/orders", "client")).toBe(false);
  });

  it("blocks unauthenticated from /admin paths", () => {
    expect(canEnterPath("/admin/orders", null)).toBe(false);
    expect(canEnterPath("/admin/orders", undefined)).toBe(false);
  });

  it("allows CLIENT into /client paths", () => {
    expect(canEnterPath("/client/orders", "CLIENT")).toBe(true);
    expect(canEnterPath("/client/orders", "client")).toBe(true);
  });

  it("allows admin roles into /client paths (for impersonation/support)", () => {
    expect(canEnterPath("/client/orders", "SUPER_ADMIN")).toBe(true);
    expect(canEnterPath("/client/orders", "MANAGER")).toBe(true);
  });

  it("allows anyone into public paths", () => {
    expect(canEnterPath("/portfolio", null)).toBe(true);
    expect(canEnterPath("/pricing", "CLIENT")).toBe(true);
    expect(canEnterPath("/services/embroidery-digitizing", undefined)).toBe(true);
  });
});

describe("resolveAccessDecision", () => {
  it("redirects unauthenticated from /admin to /login", () => {
    const decision = resolveAccessDecision("/admin/orders", null);
    expect(decision.type).toBe("redirect");
    if (decision.type === "redirect") {
      expect(decision.location).toContain("/login");
      expect(decision.location).toContain("next=");
    }
  });

  it("redirects CLIENT from /admin to /login", () => {
    const decision = resolveAccessDecision("/admin/orders", "CLIENT");
    expect(decision.type).toBe("redirect");
  });

  it("allows SUPER_ADMIN into /admin", () => {
    expect(resolveAccessDecision("/admin/orders", "SUPER_ADMIN").type).toBe("allow");
  });

  it("allows CLIENT into /client paths", () => {
    expect(resolveAccessDecision("/client/orders", "CLIENT").type).toBe("allow");
  });

  it("redirects unauthenticated from /client to /login", () => {
    const decision = resolveAccessDecision("/client/orders", null);
    expect(decision.type).toBe("redirect");
    if (decision.type === "redirect") {
      expect(decision.location).toContain("/login");
    }
  });

  it("allows public paths for everyone", () => {
    expect(resolveAccessDecision("/pricing", null).type).toBe("allow");
    expect(resolveAccessDecision("/contact", "CLIENT").type).toBe("allow");
  });
});

describe("resolveDashboardPath", () => {
  it("returns /admin for admin roles", () => {
    expect(resolveDashboardPath("SUPER_ADMIN")).toBe("/admin");
    expect(resolveDashboardPath("MANAGER")).toBe("/admin");
    expect(resolveDashboardPath("DESIGNER")).toBe("/admin");
    expect(resolveDashboardPath("admin")).toBe("/admin");
  });

  it("returns /client/dashboard for CLIENT", () => {
    expect(resolveDashboardPath("CLIENT")).toBe("/client/dashboard");
    expect(resolveDashboardPath("client")).toBe("/client/dashboard");
  });

  it("returns /login for null/undefined", () => {
    expect(resolveDashboardPath(null)).toBe("/login");
    expect(resolveDashboardPath(undefined)).toBe("/login");
  });
});
