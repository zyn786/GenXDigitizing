import { describe, expect, it } from "vitest";

import {
  canApproveProof,
  canRequestRevision,
  getWorkflowProgress,
  getWorkflowStatusLabel,
} from "@/lib/workflow/status";

describe("workflow status helpers", () => {
  it("maps labels and progress", () => {
    expect(getWorkflowStatusLabel("PROOF_READY")).toBe("Proof ready");
    expect(getWorkflowProgress("DELIVERED")).toBe(100);
  });

  it("enforces proof actions", () => {
    expect(canApproveProof("PROOF_READY")).toBe(true);
    expect(canApproveProof("IN_PROGRESS")).toBe(false);
    expect(canRequestRevision("PROOF_READY")).toBe(true);
    expect(canRequestRevision("APPROVED")).toBe(false);
  });
});
