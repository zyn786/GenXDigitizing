import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins class names and removes falsey entries", () => {
    expect(cn("px-4", false, undefined, "py-2")).toBe("px-4 py-2");
  });

  it("prefers the last conflicting Tailwind class", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });
});
