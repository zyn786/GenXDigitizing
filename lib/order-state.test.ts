import { describe, it, expect } from "vitest";

// Extracted from app/api/orders/[id]/status/route.ts
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  submitted:   ["assigned", "cancelled"],
  assigned:    ["in_progress", "submitted"],
  in_progress: ["review", "assigned"],
  review:      ["approved", "revision", "in_progress"],
  approved:    ["delivered", "revision"],
  delivered:   ["revision", "delivered"],
  revision:    ["in_progress", "submitted"],
};

function isValidTransition(currentStatus: string, newStatus: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  return allowed.includes(newStatus);
}

// Extracted from app/api/orders/revision/route.ts
const REVISION_ALLOWED_STATUSES = ["delivered", "approved"];

function canClientRequestRevision(status: string): boolean {
  return REVISION_ALLOWED_STATUSES.includes(status);
}

// Simple input validator for revision request
function validateRevisionInput(input: {
  orderId?: string;
  orderNumber?: string;
  revisionNotes?: string;
}): { valid: boolean; error?: string } {
  if (!input.orderId) return { valid: false, error: "orderId is required" };
  if (!input.orderNumber) return { valid: false, error: "orderNumber is required" };
  if (!input.revisionNotes?.trim()) return { valid: false, error: "revisionNotes is required" };
  if (input.revisionNotes.trim().length > 2000) return { valid: false, error: "revisionNotes must be under 2000 characters" };
  return { valid: true };
}

function isAuthorizedForRevision(userRole: string, userId: string, orderOwnerId: string): boolean {
  // admin/crm can always trigger revision
  if (["admin", "crm"].includes(userRole)) return true;
  // client must own the order
  return userId === orderOwnerId;
}

describe("Order State Machine", () => {
  describe("submitted", () => {
    it("can be assigned", () => {
      expect(isValidTransition("submitted", "assigned")).toBe(true);
    });

    it("can be cancelled", () => {
      expect(isValidTransition("submitted", "cancelled")).toBe(true);
    });

    it("cannot go directly to in_progress", () => {
      expect(isValidTransition("submitted", "in_progress")).toBe(false);
    });

    it("cannot go directly to delivered", () => {
      expect(isValidTransition("submitted", "delivered")).toBe(false);
    });
  });

  describe("assigned", () => {
    it("can move to in_progress", () => {
      expect(isValidTransition("assigned", "in_progress")).toBe(true);
    });

    it("can fall back to submitted", () => {
      expect(isValidTransition("assigned", "submitted")).toBe(true);
    });

    it("cannot jump to delivered", () => {
      expect(isValidTransition("assigned", "delivered")).toBe(false);
    });
  });

  describe("in_progress", () => {
    it("can move to review", () => {
      expect(isValidTransition("in_progress", "review")).toBe(true);
    });

    it("can fall back to assigned", () => {
      expect(isValidTransition("in_progress", "assigned")).toBe(true);
    });
  });

  describe("review", () => {
    it("can be approved", () => {
      expect(isValidTransition("review", "approved")).toBe(true);
    });

    it("can go to revision", () => {
      expect(isValidTransition("review", "revision")).toBe(true);
    });

    it("can fall back to in_progress", () => {
      expect(isValidTransition("review", "in_progress")).toBe(true);
    });

    it("cannot go directly to delivered", () => {
      expect(isValidTransition("review", "delivered")).toBe(false);
    });
  });

  describe("approved", () => {
    it("can be delivered", () => {
      expect(isValidTransition("approved", "delivered")).toBe(true);
    });

    it("can go to revision", () => {
      expect(isValidTransition("approved", "revision")).toBe(true);
    });
  });

  describe("delivered", () => {
    it("can support revision", () => {
      expect(isValidTransition("delivered", "revision")).toBe(true);
    });

    it("can stay delivered (no-op)", () => {
      expect(isValidTransition("delivered", "delivered")).toBe(true);
    });

    it("cannot go back to review", () => {
      expect(isValidTransition("delivered", "review")).toBe(false);
    });
  });

  describe("revision", () => {
    it("can go back to in_progress", () => {
      expect(isValidTransition("revision", "in_progress")).toBe(true);
    });

    it("can fall back to submitted", () => {
      expect(isValidTransition("revision", "submitted")).toBe(true);
    });
  });

  describe("unknown status", () => {
    it("returns false for missing status", () => {
      expect(isValidTransition("nonexistent", "assigned")).toBe(false);
    });
  });

  describe("complete happy path", () => {
    it("follows: submitted → assigned → in_progress → review → approved → delivered", () => {
      const path = ["submitted", "assigned", "in_progress", "review", "approved", "delivered"];
      for (let i = 0; i < path.length - 1; i++) {
        expect(isValidTransition(path[i], path[i + 1])).toBe(true);
      }
    });
  });

  describe("revision path", () => {
    it("follows: delivered → revision → in_progress → review → approved → delivered", () => {
      const path = ["delivered", "revision", "in_progress", "review", "approved", "delivered"];
      for (let i = 0; i < path.length - 1; i++) {
        expect(isValidTransition(path[i], path[i + 1])).toBe(true);
      }
    });
  });
});

// ── Client-initiated revision (from /api/orders/revision/route.ts) ──

describe("Revision Request — Client Initiated", () => {
  describe("REVISION_ALLOWED_STATUSES", () => {
    it("allows revision on delivered orders", () => {
      expect(canClientRequestRevision("delivered")).toBe(true);
    });

    it("allows revision on approved orders", () => {
      expect(canClientRequestRevision("approved")).toBe(true);
    });

    it("rejects revision on submitted orders", () => {
      expect(canClientRequestRevision("submitted")).toBe(false);
    });

    it("rejects revision on assigned orders", () => {
      expect(canClientRequestRevision("assigned")).toBe(false);
    });

    it("rejects revision on in_progress orders", () => {
      expect(canClientRequestRevision("in_progress")).toBe(false);
    });

    it("rejects revision on review orders", () => {
      expect(canClientRequestRevision("review")).toBe(false);
    });

    it("rejects revision on cancelled orders", () => {
      expect(canClientRequestRevision("cancelled")).toBe(false);
    });

    it("rejects revision on refunded orders", () => {
      expect(canClientRequestRevision("refunded")).toBe(false);
    });
  });

  describe("validateRevisionInput", () => {
    it("accepts valid input", () => {
      const result = validateRevisionInput({
        orderId: "order-123",
        orderNumber: "ORD-001",
        revisionNotes: "Need changes to the logo placement",
      });
      expect(result.valid).toBe(true);
    });

    it("rejects missing orderId", () => {
      const result = validateRevisionInput({
        orderNumber: "ORD-001",
        revisionNotes: "Need changes",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("orderId");
    });

    it("rejects missing orderNumber", () => {
      const result = validateRevisionInput({
        orderId: "order-123",
        revisionNotes: "Need changes",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("orderNumber");
    });

    it("rejects empty revisionNotes", () => {
      const result = validateRevisionInput({
        orderId: "order-123",
        orderNumber: "ORD-001",
        revisionNotes: "",
      });
      expect(result.valid).toBe(false);
    });

    it("rejects whitespace-only revisionNotes", () => {
      const result = validateRevisionInput({
        orderId: "order-123",
        orderNumber: "ORD-001",
        revisionNotes: "   ",
      });
      expect(result.valid).toBe(false);
    });

    it("rejects revisionNotes over 2000 chars", () => {
      const result = validateRevisionInput({
        orderId: "order-123",
        orderNumber: "ORD-001",
        revisionNotes: "x".repeat(2001),
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("2000");
    });

    it("accepts revisionNotes at 2000 chars (boundary)", () => {
      const result = validateRevisionInput({
        orderId: "order-123",
        orderNumber: "ORD-001",
        revisionNotes: "x".repeat(2000),
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("isAuthorizedForRevision", () => {
    it("allows admin to request revision on any order", () => {
      expect(isAuthorizedForRevision("admin", "admin-1", "client-5")).toBe(true);
    });

    it("allows crm to request revision on any order", () => {
      expect(isAuthorizedForRevision("crm", "crm-1", "client-5")).toBe(true);
    });

    it("allows client to request revision on their own order", () => {
      expect(isAuthorizedForRevision("client", "client-1", "client-1")).toBe(true);
    });

    it("denies client from requesting revision on another's order", () => {
      expect(isAuthorizedForRevision("client", "client-1", "client-2")).toBe(false);
    });

    it("denies designer from requesting client revision", () => {
      expect(isAuthorizedForRevision("designer", "designer-1", "client-1")).toBe(false);
    });
  });

  describe("full revision flow — client path", () => {
    it("client can revise delivered order they own", () => {
      const status = "delivered";
      const userRole = "client";
      const userId = "client-1";
      const orderOwnerId = "client-1";

      expect(canClientRequestRevision(status)).toBe(true);
      expect(isAuthorizedForRevision(userRole, userId, orderOwnerId)).toBe(true);
      // Together: user is authorized AND state allows revision
      const canRevise = canClientRequestRevision(status) && isAuthorizedForRevision(userRole, userId, orderOwnerId);
      expect(canRevise).toBe(true);
    });

    it("client cannot revise submitted order even if they own it", () => {
      const status = "submitted";
      const userRole = "client";
      const userId = "client-1";
      const orderOwnerId = "client-1";

      expect(canClientRequestRevision(status)).toBe(false);
      expect(isAuthorizedForRevision(userRole, userId, orderOwnerId)).toBe(true);
      const canRevise = canClientRequestRevision(status) && isAuthorizedForRevision(userRole, userId, orderOwnerId);
      expect(canRevise).toBe(false);
    });

    it("stranger cannot revise any order", () => {
      // Unauthenticated / no role match
      expect(isAuthorizedForRevision("client", "stranger", "owner-1")).toBe(false);
    });
  });
});
