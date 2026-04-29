import { describe, expect, it } from "vitest";

import { resolveAccessDecision } from "@/lib/auth/session";

describe("resolveAccessDecision", () => {
  it("redirects anonymous users away from client routes", () => {
    expect(resolveAccessDecision("/client/dashboard", undefined)).toEqual({
      type: "redirect",
      location: "/login?next=%2Fclient%2Fdashboard"
    });
  });

  it("allows client users into client routes", () => {
    expect(resolveAccessDecision("/client/dashboard", "client")).toEqual({
      type: "allow"
    });
  });

  it("blocks client users from admin routes", () => {
    expect(resolveAccessDecision("/admin", "client")).toEqual({
      type: "redirect",
      location: "/login?next=%2Fadmin"
    });
  });

  it("allows admins into admin routes", () => {
    expect(resolveAccessDecision("/admin", "admin")).toEqual({
      type: "allow"
    });
  });
});
