import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  BACKOFF_FACTOR,
  BACKOFF_MAX_MS,
  DEFAULT_MAX_ATTEMPTS,
  NOTIF_TYPES,
  OUTBOX_CHANNELS,
  OUTBOX_EVENT_TYPES,
  backoffMs,
  buildInAppNotification,
  defaultSend,
  enqueue,
  enqueueAndDeliver,
  isClaimable,
  isExhausted,
  isNotifType,
  isOpenStatus,
  nextStatus,
  processOutbox,
  type OutboxRow,
} from "./outbox";

afterEach(() => vi.restoreAllMocks());

/** Deterministic jitter: always the midpoint, so the delay is exactly `raw`. */
const midJitter = () => 0.5;

describe("backoff", () => {
  it("grows with each attempt", () => {
    const first = backoffMs(1, midJitter);
    const second = backoffMs(2, midJitter);
    const third = backoffMs(3, midJitter);
    expect(second).toBeGreaterThan(first);
    expect(third).toBeGreaterThan(second);
    expect(second / first).toBeCloseTo(BACKOFF_FACTOR, 5);
  });

  it("is capped, so a late attempt does not wait a week", () => {
    expect(backoffMs(9, midJitter)).toBeLessThanOrEqual(BACKOFF_MAX_MS);
    expect(backoffMs(50, midJitter)).toBeLessThanOrEqual(BACKOFF_MAX_MS);
  });

  it("never returns a negative or non-finite delay, even at absurd attempt counts", () => {
    // Math.pow overflows to Infinity long before attempt 1000; an Invalid Date
    // from that would silently park the row forever.
    for (const n of [0, -5, 1, 12, 500, 1e6]) {
      const ms = backoffMs(n, midJitter);
      expect(Number.isFinite(ms)).toBe(true);
      expect(ms).toBeGreaterThanOrEqual(0);
    }
  });

  it("jitters either side of the midpoint but stays within the band", () => {
    const raw = backoffMs(2, midJitter);
    expect(backoffMs(2, () => 0)).toBeLessThan(raw);
    expect(backoffMs(2, () => 1)).toBeGreaterThan(raw);
    // ±20% of raw.
    expect(backoffMs(2, () => 0)).toBeGreaterThanOrEqual(Math.floor(raw * 0.79));
    expect(backoffMs(2, () => 1)).toBeLessThanOrEqual(Math.ceil(raw * 1.21));
  });

  it("actually varies between calls — a fixed delay would stampede the provider", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 40; i++) seen.add(backoffMs(3));
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("isExhausted", () => {
  it("keeps trying until the budget is spent, then stops", () => {
    expect(isExhausted(1, 5)).toBe(false);
    expect(isExhausted(4, 5)).toBe(false);
    expect(isExhausted(5, 5)).toBe(true);
    expect(isExhausted(6, 5)).toBe(true);
  });

  it("uses the default budget when none is given", () => {
    expect(isExhausted(DEFAULT_MAX_ATTEMPTS - 1)).toBe(false);
    expect(isExhausted(DEFAULT_MAX_ATTEMPTS)).toBe(true);
  });

  it("treats a nonsensical budget as one attempt rather than zero", () => {
    // A maxAttempts of 0 would otherwise make every row die instantly and
    // silently.
    expect(isExhausted(0, 0)).toBe(false);
    expect(isExhausted(1, 0)).toBe(true);
  });
});

describe("nextStatus", () => {
  it("calls an in-app insert delivered — the stored row IS the delivery", () => {
    expect(nextStatus("in_app", { ok: true }, 1, 5)).toBe("delivered");
  });

  it("calls a WhatsApp send accepted, never delivered", () => {
    // Meta acknowledges and returns a wamid; the receipt arrives on the status
    // webhook. Claiming `delivered` here would report evidence we do not have.
    expect(nextStatus("whatsapp", { ok: true, providerId: "wamid.X" }, 1, 5)).toBe("accepted");
  });

  it("retries a failure until the budget runs out, then buries it", () => {
    expect(nextStatus("whatsapp", { ok: false }, 1, 5)).toBe("failed");
    expect(nextStatus("whatsapp", { ok: false }, 4, 5)).toBe("failed");
    expect(nextStatus("whatsapp", { ok: false }, 5, 5)).toBe("dead");
  });
});

describe("status predicates", () => {
  it("re-claims pending, failed and unknown — including rows a crashed worker left", () => {
    expect(isClaimable("pending")).toBe(true);
    expect(isClaimable("failed")).toBe(true);
    expect(isClaimable("unknown")).toBe(true);
  });

  it("never re-claims a row another worker is holding or one that is done", () => {
    expect(isClaimable("sending")).toBe(false);
    expect(isClaimable("delivered")).toBe(false);
    expect(isClaimable("accepted")).toBe(false);
    expect(isClaimable("dead")).toBe(false);
  });

  it("counts accepted as still open — a receipt has not arrived", () => {
    expect(isOpenStatus("accepted")).toBe(true);
    expect(isOpenStatus("delivered")).toBe(false);
    expect(isOpenStatus("dead")).toBe(false);
  });
});

describe("buildInAppNotification", () => {
  const ok = {
    userId: "u1",
    title: "New lead",
    body: "Ayesha asked about caps",
    notifType: "message",
  };

  it("builds the row the dashboard reads", () => {
    expect(buildInAppNotification({ ...ok, actionUrl: "/crm/inbox" })).toEqual({
      user_id: "u1",
      type: "message",
      title: "New lead",
      body: "Ayesha asked about caps",
      action_url: "/crm/inbox",
    });
  });

  it("falls back to 'system' for a missing or invalid notif type", () => {
    // An enum-invalid value would fail the entire batch insert in notifyUsers.
    expect(buildInAppNotification({ ...ok, notifType: undefined }).type).toBe("system");
    expect(buildInAppNotification({ ...ok, notifType: "not_a_type" }).type).toBe("system");
    expect(buildInAppNotification({ ...ok, notifType: "order_update" }).type).toBe("order_update");
  });

  it("refuses to build something the dashboard cannot render", () => {
    expect(() => buildInAppNotification({ ...ok, userId: "" })).toThrow(/userId/);
    expect(() => buildInAppNotification({ ...ok, title: "   " })).toThrow(/title/);
    expect(() => buildInAppNotification({ ...ok, body: "" })).toThrow(/body/);
  });
});

describe("notif_type vocabulary", () => {
  it("matches the enum in the migrations", () => {
    const dir = path.resolve(process.cwd(), "supabase/migrations");
    const found = new Set<string>();
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
      const sql = readFileSync(path.join(dir, file), "utf8");
      // create type notif_type as enum ('a','b',...)
      const m = sql.match(/create\s+type\s+(?:public\.)?notif_type\s+as\s+enum\s*\(([\s\S]*?)\)/i);
      if (m) for (const q of m[1].match(/'[a-z_]+'/g) ?? []) found.add(q.replace(/'/g, ""));
    }
    expect(found.size).toBeGreaterThan(0); // a parse failure must not read as agreement
    expect([...found].sort()).toEqual([...NOTIF_TYPES].sort());
  });

  it("validates membership", () => {
    expect(isNotifType("sla_warning")).toBe(true);
    expect(isNotifType("nope")).toBe(false);
    expect(isNotifType(null)).toBe(false);
  });
});

// ── I/O ─────────────────────────────────────────────────────

/** Minimal fake Supabase client: enough shape for enqueue and processOutbox. */
function fakeDb(opts: { upsertRows?: any[]; upsertError?: any; claimed?: OutboxRow[] } = {}) {
  const updates: { id: string; patch: any }[] = [];
  const rpcs: string[] = [];

  const db = {
    from(table: string) {
      if (table !== "notification_outbox") throw new Error(`unexpected table ${table}`);
      return {
        upsert: (row: any) => ({
          select: async () => ({
            data: opts.upsertError ? null : (opts.upsertRows ?? [{ id: "o1" }]),
            error: opts.upsertError ?? null,
          }),
        }),
        update: (patch: any) => ({
          eq: async (_col: string, id: string) => {
            updates.push({ id, patch });
            return { error: null };
          },
        }),
      };
    },
    rpc(fn: string, args?: any) {
      rpcs.push(fn);
      if (fn === "sweep_stuck_notification_outbox")
        return Promise.resolve({ data: 0, error: null });
      if (fn === "claim_notification_outbox")
        return Promise.resolve({ data: opts.claimed ?? [], error: null });
      return Promise.resolve({ data: null, error: null });
    },
  };

  return { db, updates, rpcs };
}

const row = (over: Partial<OutboxRow> = {}): OutboxRow => ({
  id: "o1",
  event_key: "k1",
  event_type: "new_conversation",
  channel: "whatsapp",
  recipient: "923001234567",
  payload: { text: "New WhatsApp message" },
  attempts: 1,
  max_attempts: 5,
  ...over,
});

describe("enqueue", () => {
  it("reports a genuinely new event as queued", async () => {
    const { db } = fakeDb();
    expect(
      await enqueue(db, {
        eventKey: "k1",
        eventType: "new_conversation",
        channel: "in_app",
        recipient: "u1",
        payload: { title: "t", body: "b" },
      })
    ).toEqual({ ok: true, duplicate: false });
  });

  it("reports an already-queued event as a duplicate, not an error", async () => {
    // ignoreDuplicates returns no row on conflict — this is the idempotency
    // path working, so a retried webhook notifies once.
    const { db } = fakeDb({ upsertRows: [] });
    const res = await enqueue(db, {
      eventKey: "k1",
      eventType: "new_conversation",
      channel: "in_app",
      recipient: "u1",
      payload: {},
    });
    expect(res).toEqual({ ok: true, duplicate: true });
  });

  it("returns an error instead of throwing when the write fails", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db } = fakeDb({ upsertError: { message: "permission denied" } });
    const res = await enqueue(db, {
      eventKey: "k1",
      eventType: "new_conversation",
      channel: "in_app",
      recipient: "u1",
      payload: {},
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("permission denied");
    expect(err).toHaveBeenCalled();
  });

  it("refuses an empty key or an unknown channel before touching the database", async () => {
    const { db } = fakeDb();
    expect(
      (
        await enqueue(db, {
          eventKey: "  ",
          eventType: "x",
          channel: "in_app",
          recipient: null,
          payload: {},
        })
      ).ok
    ).toBe(false);
    expect(
      (
        await enqueue(db, {
          eventKey: "k",
          eventType: "x",
          channel: "carrier_pigeon" as never,
          recipient: null,
          payload: {},
        })
      ).ok
    ).toBe(false);
  });
});

describe("processOutbox", () => {
  it("sweeps abandoned rows and claims before sending", async () => {
    const { db, rpcs } = fakeDb({ claimed: [] });
    await processOutbox(db, { send: vi.fn() });
    expect(rpcs).toContain("sweep_stuck_notification_outbox");
    expect(rpcs).toContain("claim_notification_outbox");
  });

  it("does nothing else when the queue is empty", async () => {
    const { db } = fakeDb({ claimed: [] });
    const send = vi.fn();
    const summary = await processOutbox(db, { send });
    expect(send).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ claimed: 0, delivered: 0, accepted: 0, retried: 0, dead: 0 });
  });

  it("marks a delivered in-app alert delivered and clears its error", async () => {
    const { db, updates } = fakeDb({ claimed: [row({ channel: "in_app", recipient: "u1" })] });
    const summary = await processOutbox(db, { send: async () => ({ ok: true }) });

    expect(summary.delivered).toBe(1);
    expect(updates[0].patch.status).toBe("delivered");
    expect(updates[0].patch.last_error).toBeNull();
    // No point scheduling a next attempt for something that is finished.
    expect(updates[0].patch.next_attempt_at).toBeUndefined();
  });

  it("schedules a retry with a real future timestamp when a send fails", async () => {
    const { db, updates } = fakeDb({ claimed: [row()] });
    const summary = await processOutbox(db, {
      send: async () => ({ ok: false, error: "network" }),
      random: midJitter,
    });

    expect(summary.retried).toBe(1);
    expect(updates[0].patch.status).toBe("failed");
    expect(updates[0].patch.last_error).toBe("network");
    const when = new Date(updates[0].patch.next_attempt_at).getTime();
    expect(Number.isNaN(when)).toBe(false);
    expect(when).toBeGreaterThan(Date.now());
  });

  it("buries a row that has run out of attempts", async () => {
    const { db, updates } = fakeDb({ claimed: [row({ attempts: 5, max_attempts: 5 })] });
    const summary = await processOutbox(db, { send: async () => ({ ok: false, error: "gone" }) });

    expect(summary.dead).toBe(1);
    expect(updates[0].patch.status).toBe("dead");
  });

  it("does not retry a provider refusal that waiting cannot fix", async () => {
    // Outside WhatsApp's 24-hour window; no approved template exists, so a
    // retry would fail identically. It goes to a person instead of cycling.
    const { db, updates } = fakeDb({ claimed: [row()] });
    const summary = await processOutbox(db, {
      send: async () => ({ ok: false, error: "outside window", terminal: true }),
    });

    expect(summary.dead).toBe(1);
    expect(updates[0].patch.status).toBe("dead");
    expect(updates[0].patch.next_attempt_at).toBeUndefined();
  });

  it("keeps going when one send throws, so one bad row cannot block the batch", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db } = fakeDb({ claimed: [row({ id: "bad" }), row({ id: "good" })] });
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ ok: true, providerId: "wamid.1" });

    const summary = await processOutbox(db, { send });

    expect(send).toHaveBeenCalledTimes(2);
    expect(summary.retried).toBe(1); // the throw became a retryable failure
    expect(summary.accepted).toBe(1);
    expect(err).toHaveBeenCalled();
  });

  it("counts a WhatsApp send as accepted, not delivered", async () => {
    const { db } = fakeDb({ claimed: [row()] });
    const summary = await processOutbox(db, {
      send: async () => ({ ok: true, providerId: "wamid.1" }),
    });
    expect(summary.accepted).toBe(1);
    expect(summary.delivered).toBe(0);
  });
});

/**
 * The wiring path. Without an inline attempt every alert waits for the next
 * cron pass — up to five minutes — which for "a customer just messaged us" is
 * the difference between an alert and a history lesson.
 */
describe("enqueueAndDeliver", () => {
  it("queues first, then attempts delivery straight away", async () => {
    const { db, rpcs } = fakeDb({ claimed: [] });
    const send = vi.fn();

    let queuedBeforeSend = false;
    db.from = (() => ({
      upsert: () => ({
        select: async () => {
          queuedBeforeSend = true;
          return { data: [{ id: "o1" }], error: null };
        },
      }),
      update: () => ({ eq: async () => ({ error: null }) }),
    })) as never;

    await enqueueAndDeliver(
      db,
      {
        eventKey: "k1",
        eventType: "new_conversation",
        channel: "in_app",
        recipient: "u1",
        payload: {},
      },
      { send }
    );

    // Written before it is sent: that ordering is the entire durability story.
    expect(queuedBeforeSend).toBe(true);
    expect(rpcs).toContain("claim_notification_outbox");
  });

  it("does not throw when the inline delivery fails — the row is already queued", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const db = {
      from: () => ({
        upsert: () => ({ select: async () => ({ data: [{ id: "o1" }], error: null }) }),
        update: () => ({ eq: async () => ({ error: null }) }),
      }),
      rpc: () => {
        throw new Error("database is on fire");
      },
    };

    const result = await enqueueAndDeliver(
      db as never,
      {
        eventKey: "k1",
        eventType: "new_conversation",
        channel: "in_app",
        recipient: "u1",
        payload: {},
      },
      { send: vi.fn() }
    );

    // The caller is a webhook that must still return 200/500 on its own merits.
    expect(result.ok).toBe(true);
    expect(err).toHaveBeenCalled();
  });

  it("reports a failed enqueue without attempting delivery", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db } = fakeDb({ upsertError: { message: "nope" } });
    const send = vi.fn();

    const result = await enqueueAndDeliver(
      db,
      {
        eventKey: "k1",
        eventType: "new_conversation",
        channel: "in_app",
        recipient: "u1",
        payload: {},
      },
      { send }
    );

    expect(result.ok).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalled();
  });
});

describe("defaultSend", () => {
  it("inserts the dashboard row for an in-app alert", async () => {
    const inserted: any[] = [];
    const db = {
      from: (t: string) => {
        expect(t).toBe("notifications");
        return {
          insert: async (r: any) => {
            inserted.push(r);
            return { error: null };
          },
        };
      },
    };
    const res = await defaultSend(
      db as never,
      row({
        channel: "in_app",
        recipient: "u1",
        payload: { title: "New lead", body: "Ayesha", notifType: "message" },
      })
    );

    expect(res.ok).toBe(true);
    expect(inserted[0]).toMatchObject({ user_id: "u1", type: "message", title: "New lead" });
  });

  it("fails an in-app row with no recipient rather than inserting a bad row", async () => {
    const db = { from: () => ({ insert: async () => ({ error: null }) }) };
    const res = await defaultSend(db as never, row({ channel: "in_app", recipient: null }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/recipient/);
  });

  it("reports a missing WhatsApp number instead of pretending to send", async () => {
    const db = {} as never;
    const res = await defaultSend(db, row({ channel: "whatsapp", recipient: null, payload: {} }));
    // No text in the payload — refused before any network call.
    expect(res.ok).toBe(false);
  });
});

describe("vocabularies", () => {
  it("keeps the event list closed so a typo is caught in code", () => {
    expect(OUTBOX_EVENT_TYPES).toContain("qualified_social_lead");
    expect(OUTBOX_EVENT_TYPES).toContain("outbound_message_failed");
  });

  it("knows exactly two channels", () => {
    expect([...OUTBOX_CHANNELS]).toEqual(["in_app", "whatsapp"]);
  });
});
