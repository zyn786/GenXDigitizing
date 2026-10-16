import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  LEAD_EVENT_TYPES,
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

/**
 * The vocabulary exists in two places — this module and a CHECK constraint in
 * the migrations — and both comments claim they are mirrored. Nothing enforced
 * it, so they drifted: 'reply_sent' was added to the database in 064, and the
 * code would have rejected it before it ever got there (`buildLeadEventRow`
 * throws on an unknown type, and `recordLeadEvent` turns that into a
 * silently-swallowed failure that only a console line reports).
 *
 * The spot-checks above could not catch that. This reads the migrations.
 */
function vocabularyFromMigrations(): string[] {
  const dir = path.resolve(process.cwd(), "supabase/migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));

  const found = new Set<string>();
  for (const file of files) {
    const sql = readFileSync(path.join(dir, file), "utf8");
    // Only lead_events' constraint — other tables constrain `status`, `channel`
    // and `direction` the same way and would otherwise be swept in.
    if (!sql.includes("lead_events")) continue;

    const block = /check\s*\(\s*type\s+in\s*\(([\s\S]*?)\)\s*\)/gi;
    let match: RegExpExecArray | null;
    while ((match = block.exec(sql))) {
      for (const quoted of match[1].match(/'[a-z_]+'/g) ?? []) {
        found.add(quoted.replace(/'/g, ""));
      }
    }
  }
  return [...found].sort();
}

describe("the vocabulary and the migrations", () => {
  it("match in both directions", () => {
    const inCode = [...LEAD_EVENT_TYPES].sort();
    const inDatabase = vocabularyFromMigrations();

    // Not a vacuous pass: a broken regex would leave this empty and the
    // comparison below would fail on the first element — but say it explicitly
    // so a parse failure is never mistaken for agreement.
    expect(inDatabase.length).toBeGreaterThan(0);

    // Missing from the database = a code path that throws at runtime.
    expect(inDatabase.filter((t) => !inCode.includes(t as never))).toEqual([]);
    // Missing from the code = a value the DB allows that nothing can write.
    expect(inCode.filter((t) => !inDatabase.includes(t))).toEqual([]);
    expect(inCode).toEqual(inDatabase);
  });

  it("keeps who-spoke apart: chat_reply is inbound, reply_sent is outbound", () => {
    expect(LEAD_EVENT_TYPES).toContain("chat_reply");
    expect(LEAD_EVENT_TYPES).toContain("reply_sent");
  });
});

describe("buildLeadEventRow for an outbound reply", () => {
  it("builds a reply_sent row attributed to the staff member", () => {
    expect(
      buildLeadEventRow({
        leadId: "lead-1",
        type: "reply_sent",
        actorId: "u1",
        actorLabel: "  Ayesha  ",
        summary: 'whatsapp reply: "Yes, we can do that."',
        metadata: { channel: "whatsapp", conversationId: "c1" },
      })
    ).toEqual({
      lead_id: "lead-1",
      type: "reply_sent",
      actor_id: "u1",
      actor_label: "Ayesha",
      summary: 'whatsapp reply: "Yes, we can do that."',
      from_stage: null,
      to_stage: null,
      metadata: { channel: "whatsapp", conversationId: "c1" },
    });
  });

  it("is a real type now, and a lookalike still is not", () => {
    expect(isLeadEventType("reply_sent")).toBe(true);
    expect(isLeadEventType("message_sent")).toBe(false);
  });
});
