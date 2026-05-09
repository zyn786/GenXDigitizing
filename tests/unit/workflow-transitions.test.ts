import { describe, expect, it } from "vitest";

import {
  getClientWorkflowStatusLabel,
  getClientWorkflowStatusTone,
  getWorkflowProgress,
} from "@/lib/workflow/status";

describe("client status labels", () => {
  it("maps SUBMITTED to Order Received", () => {
    expect(getClientWorkflowStatusLabel("SUBMITTED")).toBe("Order Received");
  });
  it("maps NEW to Order Received", () => {
    expect(getClientWorkflowStatusLabel("NEW")).toBe("Order Received");
  });
  it("maps ASSIGNED_TO_DESIGNER to Assigned", () => {
    expect(getClientWorkflowStatusLabel("ASSIGNED_TO_DESIGNER")).toBe("Assigned");
  });
  it("maps IN_PROGRESS to In Progress", () => {
    expect(getClientWorkflowStatusLabel("IN_PROGRESS")).toBe("In Progress");
  });
  it("maps DELIVERED to Final Files Unlocked", () => {
    expect(getClientWorkflowStatusLabel("DELIVERED")).toBe("Final Files Unlocked");
  });
  it("maps PROOF_READY to Proof Ready", () => {
    expect(getClientWorkflowStatusLabel("PROOF_READY")).toBe("Proof Ready");
  });
});

describe("status tones", () => {
  it("CANCELLED has red tone", () => {
    expect(getClientWorkflowStatusTone("CANCELLED")).toContain("red");
  });
  it("DELIVERED has teal tone", () => {
    expect(getClientWorkflowStatusTone("DELIVERED")).toContain("teal");
  });
});

describe("progress mapping", () => {
  it("CANCELLED is 0%", () => {
    expect(getWorkflowProgress("CANCELLED")).toBe(0);
  });
  it("DELIVERED is 100%", () => {
    expect(getWorkflowProgress("DELIVERED")).toBe(100);
  });
});
