import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildLeadEventRow,
  buildStageChangeEvent,
  isLeadEventType,
  recordLeadEvent,
} from "./lead-events";
import { leadStageLabel, summariseStageChange } from "./lead-stages";

afterEach(() => vi.restoreAllMocks());

describe("lead stages", () => {
  it("labels every stage the database accepts", () => {
    expect(leadStageLabel("quote_sent")).toBe("Quote Sent");
    expect(leadStageLabel("negotiation")).toBe("Negotiation");
    expect(leadStageLabel("lead")).toBe("New Lead");
  });

  it("does not blow up on a stage it has never seen", () => {
    // The old board used a non-null assertion here and blanked the whole page.
    expect(leadStageLabel("something_new")).toBe("something_new");
    expect(leadStageLabel(null)).toBe("Unknown");
  });

  it("writes a stage change the way the board and the API both read it", () => {
    expect(summariseStageChange("lead", "contacted")).toBe("Stage changed: New Lead → Contacted");
    expect(summariseStageChange(null, "quote_sent")).toBe("Moved to Quote Sent");
    expect(summariseStageChange("won", "won")).toBe("Stage unchanged (Won)");
  });
});

describe("buildLeadEventRow", () => {
  it("builds the row the table expects", () => {
    expect(
      buildLeadEventRow({
        leadId: "lead-1",
        type: "email_sent",
        actorId: "user-1",
        actorLabel: "  Sara  ",
        summary: "  Emailed the quote  ",
        metadata: { subject: "Your quote" },
      })
    ).toEqual({
      lead_id: "lead-1",
      type: "email_sent",
      actor_id: "user-1",
      actor_label: "Sara",
      summary: "Emailed the quote",
      from_stage: null,
      to_stage: null,
      metadata: { subject: "Your quote" },
    });
  });

  it("refuses a missing lead, an empty summary, or an invented type", () => {
    expect(() => buildLeadEventRow({ leadId: "", type: "note", summary: "x" })).toThrow(/leadId/);
    expect(() => buildLeadEventRow({ leadId: "l", type: "note", summary: "   " })).toThrow(
      /summary/
    );
    // A type outside the vocabulary would be rejected by the CHECK constraint
    // anyway; failing here says which call site is wrong.
    expect(() => buildLeadEventRow({ leadId: "l", type: "poked" as never, summary: "x" })).toThrow(
      /unknown lead event type/
    );
  });

  it("agrees with the database vocabulary", () => {
    expect(isLeadEventType("stage_change")).toBe(true);
    expect(isLeadEventType("created")).toBe(true);
    expect(isLeadEventType("Stage_Change")).toBe(false);
    expect(isLeadEventType(null)).toBe(false);
  });
});

describe("buildStageChangeEvent", () => {
  it("carries both stages and a readable summary", () => {
    const e = buildStageChangeEvent({
      leadId: "lead-1",
      fromStage: "contacted",
      toStage: "won",
      actorId: "u1",
      actorLabel: "Ayesha",
    });
    expect(e.type).toBe("stage_change");
    expect(e.fromStage).toBe("contacted");
    expect(e.toStage).toBe("won");
    expect(e.summary).toBe("Stage changed: Contacted → Won");
    expect(e.actorLabel).toBe("Ayesha");
  });
});

describe("recordLeadEvent", () => {
  function clientReturning(error: unknown) {
    const insert = vi.fn().mockResolvedValue({ error });
    return { client: { from: vi.fn(() => ({ insert })) }, insert };
  }

  it("inserts a well-formed event and reports success", async () => {
    const { client, insert } = clientReturning(null);
    const res = await recordLeadEvent(client, {
      leadId: "lead-1",
      type: "created",
      summary: "Lead created from the website form",
    });
    expect(res.ok).toBe(true);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ lead_id: "lead-1", type: "created" })
    );
  });

  it("never throws when the write fails — the business action must survive", async () => {
    // The event matters less than the email/order/stage change that produced it.
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientReturning({ message: "permission denied" });
    const res = await recordLeadEvent(client, {
      leadId: "lead-1",
      type: "email_sent",
      summary: "Emailed the quote",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("permission denied");
    expect(err).toHaveBeenCalled();
  });

  it("survives a client that throws outright", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = {
      from: () => ({
        insert: () => Promise.reject(new Error("socket closed")),
      }),
    };
    const res = await recordLeadEvent(client, {
      leadId: "lead-1",
      type: "note",
      summary: "Called the customer",
    });
    expect(res.ok).toBe(false);
    expect(err).toHaveBeenCalled();
  });

  it("rejects a malformed event without touching the database", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client, insert } = clientReturning(null);
    const res = await recordLeadEvent(client, {
      leadId: "lead-1",
      type: "note",
      summary: "",
    });
    expect(res.ok).toBe(false);
    expect(insert).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalled();
  });
});
