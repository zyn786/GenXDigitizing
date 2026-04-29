import { describe, expect, it } from "vitest";

import {
  getAdminOrder,
  getAdminOrders,
  getClientFiles,
  getOpenRevisions,
} from "@/lib/workflow/repository";

describe("workflow repository", () => {
  it("returns an array for admin orders", async () => {
    const orders = await getAdminOrders();
    expect(Array.isArray(orders)).toBe(true);
  });

  it("returns null for a non-existent order", async () => {
    const order = await getAdminOrder("non-existent-id");
    expect(order).toBeNull();
  });

  it("getClientFiles returns an empty array", async () => {
    const files = await getClientFiles();
    expect(Array.isArray(files)).toBe(true);
    expect(files).toHaveLength(0);
  });

  it("getOpenRevisions returns an empty array", async () => {
    const revisions = await getOpenRevisions();
    expect(Array.isArray(revisions)).toBe(true);
    expect(revisions).toHaveLength(0);
  });
});
