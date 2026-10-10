import { describe, it, expect } from "vitest";
import { buildLeadBriefing, stripInternalAnnotations } from "./sales-agent";

describe("stripInternalAnnotations", () => {
  it("removes the timeline lines this system writes", () => {
    const notes = [
      "Service: Cap Digitizing",
      "[2026-08-14T10:31:00.000Z] Stage changed: New Lead → Contacted",
      "[2026-08-14T11:02:00.000Z] Email sent to a@b.com - \"Your quote\"",
      "",
      "Need this on a left chest, 12 shirts.",
    ].join("\n");

    const out = stripInternalAnnotations(notes);
    expect(out).not.toContain("Stage changed");
    expect(out).not.toContain("Email sent to");
    // The customer's own words survive.
    expect(out).toContain("Need this on a left chest, 12 shirts.");
    expect(out).toContain("Service: Cap Digitizing");
  });

  it("removes the reference and machine-written failure notes", () => {
    const notes = [
      "Reference: GX-7K2M9Q",
      "Artwork: UPLOAD FAILED",
      "The customer believes a file was attached. Ask them to resend it.",
      "UPLOAD FAILED for: logo.png — ask the customer to resend",
      "Design: Jaguar Head",
    ].join("\n");

    const out = stripInternalAnnotations(notes);
    expect(out).not.toContain("GX-7K2M9Q");
    expect(out).not.toMatch(/UPLOAD FAILED/);
    expect(out).not.toContain("believes a file was attached");
    expect(out).toContain("Design: Jaguar Head");
  });

  it("keeps a legitimate bracketed line that a human typed", () => {
    // Only the "[ISO] …" shape is ours. A staff note that happens to start with
    // a bracket must not be swallowed.
    const notes = "[urgent] caller wants it before Friday";
    expect(stripInternalAnnotations(notes)).toContain("urgent");
  });

  it("collapses the blank runs it leaves behind", () => {
    const notes = ["Design: X", "", "", "", "Placement: Cap"].join("\n");
    expect(stripInternalAnnotations(notes)).toBe("Design: X\n\nPlacement: Cap");
  });

  it("returns an empty string for notes that were only annotations", () => {
    const notes = "[2026-08-14T10:31:00.000Z] Stage changed: New Lead → Contacted";
    expect(stripInternalAnnotations(notes)).toBe("");
  });
});

describe("buildLeadBriefing", () => {
  const lead = {
    contact_name: "Dana",
    email: "dana@example.com",
    stage: "contacted",
    notes: [
      "Design: Jaguar Head",
      "[2026-08-14T10:31:00.000Z] Stage changed: New Lead → Contacted",
    ].join("\n"),
  };

  it("marks the CRM notes as internal and unverified", () => {
    const b = buildLeadBriefing(lead, []);
    expect(b).toContain("internal, written by staff, may be stale or wrong");
    expect(b).toMatch(/Do NOT quote anything from here/);
  });

  it("does not pass our own machine annotations to the model", () => {
    const b = buildLeadBriefing(lead, []);
    expect(b).not.toContain("Stage changed");
    expect(b).toContain("Design: Jaguar Head");
  });

  it("omits the notes block entirely when nothing human is left", () => {
    const b = buildLeadBriefing(
      { ...lead, notes: "[2026-08-14T10:31:00.000Z] Stage changed: New Lead → Contacted" },
      []
    );
    expect(b).not.toContain("CRM NOTES");
  });

  it("still says plainly when there is no prior conversation", () => {
    expect(buildLeadBriefing(lead, [])).toContain("No prior messages");
  });
});
