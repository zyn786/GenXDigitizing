import { describe, it, expect, vi } from "vitest";
import {
  normalizeSubject,
  extractMessageIds,
  normalizeMessageId,
  resolveThreadId,
} from "./email-threads";

describe("normalizeSubject", () => {
  it("strips reply and forward prefixes", () => {
    expect(normalizeSubject("Re: Indian Applique")).toBe("indian applique");
    expect(normalizeSubject("RE: Indian Applique")).toBe("indian applique");
    expect(normalizeSubject("Fwd: Indian Applique")).toBe("indian applique");
    expect(normalizeSubject("FW: Indian Applique")).toBe("indian applique");
  });

  it("strips stacked prefixes in any order", () => {
    expect(normalizeSubject("Re: Fwd: Re: Indian Applique")).toBe("indian applique");
    expect(normalizeSubject("Fwd: Re: FW: FOXES LOGO")).toBe("foxes logo");
  });

  it("strips out-of-office autoreply markers", () => {
    expect(normalizeSubject("Automatic reply: First free design for quality testing.")).toBe(
      "first free design for quality testing."
    );
    expect(normalizeSubject("Auto-Reply: Pricing")).toBe("pricing");
    expect(normalizeSubject("Out of office: Pricing")).toBe("pricing");
  });

  it("leaves a plain subject alone", () => {
    expect(normalizeSubject("Indian Applique")).toBe("indian applique");
    expect(normalizeSubject("First free design for quality testing.")).toBe(
      "first free design for quality testing."
    );
  });

  it("collapses whitespace and handles empty input", () => {
    expect(normalizeSubject("  Re:   Two   Spaces ")).toBe("two spaces");
    expect(normalizeSubject("")).toBe("");
    expect(normalizeSubject(null)).toBe("");
    expect(normalizeSubject(undefined)).toBe("");
  });

  it("does not strip a word that merely starts with 're'", () => {
    expect(normalizeSubject("Reindeer logo")).toBe("reindeer logo");
    expect(normalizeSubject("Reference sheet")).toBe("reference sheet");
  });
});

describe("extractMessageIds", () => {
  it("reads a single reference", () => {
    expect(extractMessageIds("<a@b.com>", null)).toEqual(["<a@b.com>"]);
  });

  it("reads a space-separated reference chain, in order", () => {
    const refs = "<one@x.com> <two@x.com>\t<three@x.com>";
    expect(extractMessageIds(refs, null)).toEqual(["<one@x.com>", "<two@x.com>", "<three@x.com>"]);
  });

  it("dedupes ids present in both references and in-reply-to", () => {
    expect(extractMessageIds("<a@b.com> <c@d.com>", "<c@d.com>")).toEqual([
      "<a@b.com>",
      "<c@d.com>",
    ]);
  });

  it("accepts an array of references", () => {
    expect(extractMessageIds(["<a@b.com>", "<c@d.com>"], null)).toEqual(["<a@b.com>", "<c@d.com>"]);
  });

  it("returns nothing for malformed or empty input", () => {
    expect(extractMessageIds("not an id", null)).toEqual([]);
    expect(extractMessageIds("", "")).toEqual([]);
    expect(extractMessageIds(null, null)).toEqual([]);
  });
});

describe("normalizeMessageId", () => {
  it("unwraps angle brackets", () => {
    expect(normalizeMessageId("<abc@microsoft.com>")).toBe("<abc@microsoft.com>");
  });

  it("keeps a bare id usable", () => {
    expect(normalizeMessageId("abc@microsoft.com")).toBe("abc@microsoft.com");
  });

  it("returns null when absent", () => {
    expect(normalizeMessageId("")).toBe(null);
    expect(normalizeMessageId(null)).toBe(null);
  });
});

/* ── thread resolution with a stub supabase ─────────────── */

function stubClient({ inbound = [], sent = [], sentThreadId = null }: any) {
  const updates: any[] = [];
  return {
    updates,
    from(table: string) {
      const rows = table === "received_emails" ? inbound : sent;
      const builder: any = {
        _rows: rows,
        select() {
          return builder;
        },
        in(_col: string, ids: string[]) {
          builder._rows = rows.filter((r: any) => ids.includes(r.message_id));
          return builder;
        },
        not() {
          return builder;
        },
        gte() {
          return builder;
        },
        order() {
          return builder;
        },
        limit() {
          return builder;
        },
        eq() {
          return builder;
        },
        update(patch: any) {
          updates.push({ table, patch });
          return builder;
        },
        maybeSingle() {
          const row = builder._rows[0] || null;
          return Promise.resolve({
            data: row ? { ...row, thread_id: row.thread_id ?? sentThreadId } : null,
            error: null,
          });
        },
        then(resolve: any) {
          return Promise.resolve({ data: builder._rows, error: null }).then(resolve);
        },
      };
      return builder;
    },
  };
}

describe("resolveThreadId", () => {
  it("adopts the thread of an inbound parent found via References", async () => {
    const supabase = stubClient({
      inbound: [{ message_id: "<parent@x.com>", thread_id: "thread-1" }],
    });
    const id = await resolveThreadId(supabase, {
      messageId: "<child@x.com>",
      references: "<parent@x.com>",
      subject: "Re: Indian Applique",
      counterparty: "wk@x.com",
    });
    expect(id).toBe("thread-1");
  });

  it("adopts the thread of our own sent parent", async () => {
    const supabase = stubClient({
      sent: [{ message_id: "<ours@genx.com>", thread_id: "thread-2" }],
    });
    const id = await resolveThreadId(supabase, {
      messageId: "<reply@x.com>",
      inReplyTo: "<ours@genx.com>",
      subject: "Re: Quote",
      counterparty: "client@x.com",
    });
    expect(id).toBe("thread-2");
  });

  it("falls back to subject + counterparty for inbound mail", async () => {
    const supabase = stubClient({
      inbound: [
        {
          message_id: "<a@x.com>",
          thread_id: "thread-3",
          subject: "Indian Applique",
          from_email: "wk@x.com",
        },
      ],
    });
    const id = await resolveThreadId(supabase, {
      messageId: "<b@x.com>",
      subject: "Fwd: Indian Applique",
      counterparty: "wk@x.com",
    });
    expect(id).toBe("thread-3");
  });

  it("starts a new thread when nothing matches", async () => {
    const supabase = stubClient({ inbound: [], sent: [] });
    const id = await resolveThreadId(supabase, {
      messageId: "<fresh@x.com>",
      subject: "Brand new enquiry",
      counterparty: "new@x.com",
    });
    expect(id).toBe("<fresh@x.com>");
  });

  it("generates an id when there is no message id at all", async () => {
    const supabase = stubClient({ inbound: [], sent: [] });
    const id = await resolveThreadId(supabase, { subject: "No headers", counterparty: "x@y.com" });
    expect(id).toMatch(/^t-/);
  });

  it("does not match on subject alone when the counterparty differs", async () => {
    const supabase = stubClient({
      inbound: [
        {
          message_id: "<a@x.com>",
          thread_id: "thread-3",
          subject: "Indian Applique",
          from_email: "someone-else@x.com",
        },
      ],
    });
    const id = await resolveThreadId(supabase, {
      messageId: "<b@x.com>",
      subject: "Indian Applique",
      counterparty: "wk@x.com",
    });
    expect(id).toBe("<b@x.com>");
  });
});
