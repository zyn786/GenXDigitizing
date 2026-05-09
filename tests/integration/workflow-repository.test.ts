import { describe, expect, it } from "vitest";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("workflow repository (requires DATABASE_URL)", () => {
  // Dynamic imports inside the describe body so db.ts is only loaded when the suite runs.
  it("returns an array for admin orders", async () => {
    const { getAdminOrders } = await import("@/lib/workflow/repository");
    const orders = await getAdminOrders();
    expect(Array.isArray(orders)).toBe(true);
  });

  it("returns null for a non-existent order", async () => {
    const { getAdminOrder } = await import("@/lib/workflow/repository");
    const order = await getAdminOrder("non-existent-id");
    expect(order).toBeNull();
  });

  it("getClientFiles returns an empty array", async () => {
    const { getClientFiles } = await import("@/lib/workflow/repository");
    const files = await getClientFiles();
    expect(Array.isArray(files)).toBe(true);
    expect(files).toHaveLength(0);
  });

  it("getOpenRevisions returns an empty array", async () => {
    const { getOpenRevisions } = await import("@/lib/workflow/repository");
    const revisions = await getOpenRevisions();
    expect(Array.isArray(revisions)).toBe(true);
    expect(revisions).toHaveLength(0);
  });
});
